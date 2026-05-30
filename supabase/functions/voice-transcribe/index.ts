import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ─── CORS ────────────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ─── Provider abstraction ────────────────────────────────────────────────────
// Future providers (e.g. OpenAI Whisper) follow the same interface.

interface TranscriptionResult {
  transcript: string
  providerUsed: string
}

// ── Groq Whisper ─────────────────────────────────────────────────────────────

async function transcribeWithGroq(
  audioBlob: Blob,
  mimeType: string,
  apiKey: string,
): Promise<TranscriptionResult> {
  const form = new FormData()
  form.append('file', audioBlob, `audio.${mimeTypeToExtension(mimeType)}`)
  form.append('model', 'whisper-large-v3')
  form.append('response_format', 'json')
  form.append('temperature', '0')

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  if (!response.ok) {
    const errBody = await response.text()
    console.error('[voice-transcribe] Groq error:', errBody)
    throw new Error(`Groq transcription failed: ${response.status}`)
  }

  const data = await response.json() as { text?: string }
  return {
    transcript: data.text?.trim() ?? '',
    providerUsed: 'groq',
  }
}

// ── Gemini fallback ───────────────────────────────────────────────────────────

async function transcribeWithGemini(
  audioArrayBuffer: ArrayBuffer,
  mimeType: string,
  apiKey: string,
): Promise<TranscriptionResult> {
  // Convert ArrayBuffer → base64 safely (no spread — avoids call stack overflow)
  const uint8Array = new Uint8Array(audioArrayBuffer)
  let binaryString = ''
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i])
  }
  const base64Audio = btoa(binaryString)

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: mimeType.split(';')[0], // strip codec suffix
              data: base64Audio,
            },
          },
          {
            text: 'Transcribe this audio recording accurately. Return ONLY the spoken text — no labels, no explanations, no timestamps. If nothing is spoken, return an empty string.',
          },
        ],
      }],
      generationConfig: { temperature: 0, maxOutputTokens: 2048 },
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    console.error('[voice-transcribe] Gemini error:', errBody)
    throw new Error(`Gemini transcription failed: ${response.status}`)
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  return {
    transcript: data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '',
    providerUsed: 'gemini',
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mimeTypeToExtension(mimeType: string): string {
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('mp4')) return 'mp4'
  return 'webm'
}

function inferMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase()
  if (ext === 'ogg') return 'audio/ogg'
  if (ext === 'mp4') return 'audio/mp4'
  return 'audio/webm'
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization header', error_code: 'UNAUTHENTICATED' }, 401)

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey      = Deno.env.get('SUPABASE_ANON_KEY')!

    // Validate JWT via user client
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) return json({ error: 'Unauthorized', error_code: 'UNAUTHORIZED' }, 401)

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json().catch(() => null) as { filePath?: string } | null
    const { filePath } = body ?? {}
    if (!filePath) return json({ error: 'filePath is required', error_code: 'MISSING_FILE_PATH' }, 400)

    // ── Security: enforce user-scoped storage path ────────────────────────────
    // Path format: "{userId}/{uuid}.{ext}"
    const pathSegments = filePath.split('/')
    if (pathSegments[0] !== user.id) {
      return json({ error: 'Forbidden: path must start with your user ID', error_code: 'FORBIDDEN' }, 403)
    }
    // Reject path traversal
    if (filePath.includes('..') || pathSegments.length !== 2) {
      return json({ error: 'Invalid file path', error_code: 'INVALID_PATH' }, 400)
    }

    // ── Download audio from Storage ───────────────────────────────────────────
    const serviceClient = createClient(supabaseUrl, serviceKey)
    const { data: fileData, error: downloadErr } = await serviceClient.storage
      .from('voice-responses')
      .download(filePath)

    if (downloadErr || !fileData) {
      console.error('[voice-transcribe] Download failed:', downloadErr)
      return json({ error: 'Failed to download audio file', error_code: 'DOWNLOAD_FAILED' }, 500)
    }

    const mimeType = inferMimeType(filePath)

    // ── Resolve transcription provider ────────────────────────────────────────
    // Priority: Groq key (user) → Groq key (env) → Gemini key (user) → Gemini key (env) → error

    const { data: keyRows } = await serviceClient
      .from('ai_keys')
      .select('provider, api_key')
      .eq('user_id', user.id)
      .in('provider', ['groq', 'gemini'])

    const keyMap: Record<string, string> = {}
    for (const row of keyRows ?? []) {
      if (row.api_key?.trim()) keyMap[row.provider] = row.api_key.trim()
    }

    const groqKey   = keyMap['groq']   || Deno.env.get('GROQ_API_KEY')   || ''
    const geminiKey = keyMap['gemini'] || Deno.env.get('GEMINI_API_KEY') || ''

    // ── Transcribe ────────────────────────────────────────────────────────────
    let result: TranscriptionResult | null = null

    if (groqKey) {
      try {
        result = await transcribeWithGroq(fileData, mimeType, groqKey)
      } catch (err) {
        console.warn('[voice-transcribe] Groq failed, trying Gemini fallback:', (err as Error).message)
        // Fall through to Gemini
      }
    }

    if (!result && geminiKey) {
      try {
        const arrayBuffer = await fileData.arrayBuffer()
        result = await transcribeWithGemini(arrayBuffer, mimeType, geminiKey)
      } catch (err) {
        console.error('[voice-transcribe] Gemini fallback also failed:', (err as Error).message)
      }
    }

    if (!result) {
      return json({
        error: 'No transcription provider available. Add a Groq or Gemini API key in Settings → AI Integration.',
        error_code: 'NO_PROVIDER',
      }, 400)
    }

    // ── Cleanup storage ───────────────────────────────────────────────────────
    // Best-effort — don't block the response on this
    void serviceClient.storage.from('voice-responses').remove([filePath])

    return json({
      transcript: result.transcript,
      provider_used: result.providerUsed,
    })

  } catch (err) {
    console.error('[voice-transcribe] Unexpected error:', err)
    return json({ error: 'Internal server error', error_code: 'INTERNAL_ERROR' }, 500)
  }
})
