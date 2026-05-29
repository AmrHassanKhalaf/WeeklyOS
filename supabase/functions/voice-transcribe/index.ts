import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // ── CORS preflight ─────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const serviceKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey      = Deno.env.get('SUPABASE_ANON_KEY')!

    // Validate user JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const { filePath } = await req.json() as { filePath?: string }
    if (!filePath) {
      return new Response(JSON.stringify({ error: 'filePath is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Security: user can only transcribe their own files ────────────────────
    // filePath format: "{userId}/{uuid}.webm"
    const pathSegments = filePath.split('/')
    if (pathSegments[0] !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden: path must start with your user ID' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Download audio file from Storage (service role) ───────────────────────
    const serviceClient = createClient(supabaseUrl, serviceKey)
    const { data: fileData, error: downloadErr } = await serviceClient.storage
      .from('voice-responses')
      .download(filePath)

    if (downloadErr || !fileData) {
      console.error('[voice-transcribe] Download failed:', downloadErr)
      return new Response(JSON.stringify({ error: 'Failed to download audio file' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Convert Blob → base64 ─────────────────────────────────────────────────
    const arrayBuffer = await fileData.arrayBuffer()
    const uint8Array  = new Uint8Array(arrayBuffer)
    const base64Audio = btoa(String.fromCharCode(...uint8Array))

    // ── Get Gemini API key ─────────────────────────────────────────────────────
    // First check user's own key in ai_keys table
    let geminiKey = ''
    const { data: keyRow } = await serviceClient
      .from('ai_keys')
      .select('api_key')
      .eq('user_id', user.id)
      .eq('provider', 'gemini')
      .maybeSingle()

    if (keyRow?.api_key && keyRow.api_key.trim().length > 0) {
      geminiKey = keyRow.api_key.trim()
    } else {
      // Fall back to environment variable
      geminiKey = Deno.env.get('GEMINI_API_KEY') ?? ''
    }

    if (!geminiKey) {
      return new Response(JSON.stringify({ error: 'No Gemini API key configured' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Call Gemini for transcription ─────────────────────────────────────────
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: 'audio/webm',
                data: base64Audio,
              },
            },
            {
              text: 'Transcribe this audio recording accurately. Return ONLY the spoken text — no labels, no explanations, no timestamps. If nothing is spoken, return an empty string.',
            },
          ],
        }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 2048,
        },
      }),
    })

    if (!geminiResponse.ok) {
      const errBody = await geminiResponse.text()
      console.error('[voice-transcribe] Gemini error:', errBody)
      return new Response(JSON.stringify({ error: 'Transcription failed', detail: errBody }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiData = await geminiResponse.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }

    const transcript = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''

    // ── (Optional) Delete file after successful transcription ─────────────────
    // Keeps storage clean. Comment out if you want to keep recordings.
    await serviceClient.storage.from('voice-responses').remove([filePath])

    return new Response(
      JSON.stringify({ transcript }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (err) {
    console.error('[voice-transcribe] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
