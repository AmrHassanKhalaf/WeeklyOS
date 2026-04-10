import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GLOBAL_RULES = `
You are the WeeklyOS AI Assistant. Follow these rules strictly:
- Primary Language: Arabic. Naturally include English terms like AI, WeeklyOS.
- Formatting: Plain text ONLY. NO markdown symbols.
- Spacing: Clear spacing.
- Bullets: Use "•" symbol only.
- Tone: Friendly, modern.
- Structure:
👋 Greeting
🎯 Context
⚡ Main Answer
💡 Tip
🚀 Action
`

const SCHEDULE_RULES = `
You are a planning engine that must return strict JSON only.
Do not include markdown, explanations, headings, emoji, or extra text.
Return exactly one JSON object with a "tasks" array.
Each task must include:
- title: string
- priority: "high" | "medium" | "low"
- day: "saturday" | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday"
- estimatedTime: optional string
`

function decodeJWT(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}

function normalizeHistory(history: any[]) {
  if (!Array.isArray(history) || history.length === 0) return []

  const normalized = history.map((m: any) => ({
    role: (m.role === 'assistant' || m.role === 'ai' || m.role === 'model') ? 'model' : 'user',
    parts: [{ text: m.content || m.text || '' }],
  }))

  let startIdx = 0
  while (startIdx < normalized.length && normalized[startIdx].role === 'model') {
    startIdx++
  }

  const filtered = normalized.slice(startIdx)
  const validHistory = []
  let expectedRole = 'user'
  for (const msg of filtered) {
    if (msg.role === expectedRole && msg.parts[0]?.text?.trim()) {
      validHistory.push(msg)
      expectedRole = expectedRole === 'user' ? 'model' : 'user'
    }
  }
  return validHistory
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization') ?? ''
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    const payload = decodeJWT(jwt)
    if (!payload?.sub) {
      return new Response(JSON.stringify({ error: 'Invalid JWT' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Create authenticated Supabase client with user's JWT
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } }
    })

    const userId = payload.sub as string

    const reqData = await req.json()
    const { type, input, context, overrideProvider, model, history } = reqData

    // 1. Common Settings Fetch
    const [settingsRes, keysRes] = await Promise.all([
      supabaseClient.from('ai_settings').select('default_provider, active_model').eq('user_id', userId).maybeSingle(),
      supabaseClient.from('ai_keys').select('provider, api_key').eq('user_id', userId)
    ])

    const provider = overrideProvider || settingsRes.data?.default_provider || 'gemini'
    const apiKey = (keysRes.data || []).find(k => k.provider === provider)?.api_key

    const aiModel = model || settingsRes.data?.active_model || 'gemini-1.5-flash'
    const systemPrompt = type === 'schedule'
      ? `${SCHEDULE_RULES}\nContext: ${JSON.stringify(context || {})}`
      : `${GLOBAL_RULES}\nContext: ${JSON.stringify(context || {})}`

    if (['chat', 'reflection', 'challenge', 'insight', 'schedule'].includes(type)) {
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'No API key configured' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const fallbackInputs: Record<string, string> = {
        challenge: `Create a concise weekly challenge from these pending tasks: ${(context?.tasks || '').toString()}`,
        insight: 'Give me a very short encouraging insight based on the provided context.',
        reflection: 'Write a short weekly reflection based on the provided context.',
        schedule: 'Turn the provided brain dump into a structured weekly plan.',
        chat: input || '',
      }

      const resolvedInput = (input?.trim() || fallbackInputs[type] || '').trim()
      if (!resolvedInput) {
        return new Response(JSON.stringify({ error: 'Missing input' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const genAI = new GoogleGenerativeAI(apiKey)
      const geminiModel = genAI.getGenerativeModel({
        model: aiModel,
        systemInstruction: systemPrompt,
        ...(type === 'schedule' ? { generationConfig: { responseMimeType: 'application/json' } } : {})
      })

      const chat = geminiModel.startChat({
        history: normalizeHistory(history || []),
      })

      const result = await chat.sendMessage(resolvedInput)
      const responseText = result.response.text()

      return new Response(JSON.stringify({ response: responseText, providerUsed: provider }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    return new Response(JSON.stringify({ error: 'Unsupported type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
