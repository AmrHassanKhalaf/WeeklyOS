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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace('Bearer ', '')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Create authenticated Supabase client with user's JWT
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } }
    })

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error("User auth error:", userError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Processing request for user ${user?.id}`);

    const reqData = await req.json()
    const { type, input, context, overrideProvider, model, history } = reqData
    console.log(`Processing ${type} request for user ${user.id}`);

    // 1. Common Settings Fetch
    const [settingsRes, keysRes] = await Promise.all([
      supabaseClient.from('ai_settings').select('default_provider, active_model').eq('user_id', user.id).maybeSingle(),
      supabaseClient.from('ai_keys').select('provider, api_key').eq('user_id', user.id)
    ])

    const provider = overrideProvider || settingsRes.data?.default_provider || 'gemini'
    const apiKey = (keysRes.data || []).find(k => k.provider === provider)?.api_key

    const aiModel = model || settingsRes.data?.active_model || 'gemini-1.5-flash'
    const systemPrompt = `${GLOBAL_RULES}\nContext: ${JSON.stringify(context || {})}`

    if (['chat', 'reflection', 'challenge', 'insight', 'schedule'].includes(type)) {
      if (!apiKey) throw new Error('No key')
      if (!input?.trim()) throw new Error('Missing input')

      const genAI = new GoogleGenerativeAI(apiKey)
      const geminiModel = genAI.getGenerativeModel({
        model: aiModel,
        systemInstruction: systemPrompt
      })

      const chat = geminiModel.startChat({
        history: (history || []).map((m: any) => ({
          role: (m.role === 'assistant' || m.role === 'ai' || m.role === 'model') ? 'model' : 'user',
          parts: [{ text: m.content || m.text || '' }]
        })),
      })

      const result = await chat.sendMessage(input)
      const responseText = result.response.text()

      return new Response(JSON.stringify({ response: responseText, providerUsed: provider }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Unsupported type')

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message === 'Unauthorized' ? 401 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
