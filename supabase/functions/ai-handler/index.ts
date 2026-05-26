import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── System Prompts ───────────────────────────────────────────────────────────

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

const WORKSPACE_RULES = `
You are WeeklyOS AI, a calm contextual productivity operating layer.
Use the workspace context provided to give strategic, actionable guidance.
Avoid generic motivation. Prefer specific insights grounded in the real data.
When you call a tool, do so because it is the right action — not speculatively.
Respond in the same language the user writes in.
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
- tags: optional string[]
`

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
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
  const validHistory: any[] = []
  let expectedRole = 'user'
  for (const msg of filtered) {
    if (msg.role === expectedRole && msg.parts[0]?.text?.trim()) {
      validHistory.push(msg)
      expectedRole = expectedRole === 'user' ? 'model' : 'user'
    }
  }
  return validHistory
}

// ─── Workspace Handler (Phase 2.4+) ──────────────────────────────────────────
//
// Accepts a structured message array assembled by the client orchestrator.
// Supports Gemini function declarations when tools are provided.
// Returns: { response, toolCalls?, reasoning?, providerUsed, model }

async function handleWorkspace(
  reqData: any,
  apiKey: string,
  provider: string,
  aiModel: string
) {
  const {
    messages: rawMessages,
    tools: toolDeclarations,
    context,
  } = reqData

  const genAI = new GoogleGenerativeAI(apiKey)

  // Extract system messages and build the system instruction
  // (Gemini treats all system messages as a single system instruction)
  const systemMessages = (rawMessages || [])
    .filter((m: any) => m.role === 'system')
    .map((m: any) => m.content)
    .join('\n\n')

  const systemInstruction = systemMessages || WORKSPACE_RULES

  // Build Gemini model config
  const modelConfig: any = {
    model: aiModel,
    systemInstruction,
  }

  // Attach function declarations if provided
  if (Array.isArray(toolDeclarations) && toolDeclarations.length > 0) {
    modelConfig.tools = [{ functionDeclarations: toolDeclarations }]
    // Use AUTO mode: model decides whether to call a function or respond with text
    modelConfig.toolConfig = { functionCallingConfig: { mode: 'AUTO' } }
  }

  const geminiModel = genAI.getGenerativeModel(modelConfig)

  // Convert non-system messages to Gemini history + final user message
  const nonSystemMessages = (rawMessages || []).filter((m: any) => m.role !== 'system')

  // All messages except the last user message go into history
  const historyMessages = nonSystemMessages.slice(0, -1)
  const lastMessage = nonSystemMessages[nonSystemMessages.length - 1]

  const geminiHistory = historyMessages
    .filter((m: any) => m.content?.trim())
    .map((m: any) => ({
      role: (m.role === 'assistant' || m.role === 'model') ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  // Remove consecutive same-role messages (Gemini requirement)
  const cleanHistory: any[] = []
  let expectedRole = 'user'
  for (const msg of geminiHistory) {
    if (msg.role === expectedRole) {
      cleanHistory.push(msg)
      expectedRole = expectedRole === 'user' ? 'model' : 'user'
    }
  }

  const chat = geminiModel.startChat({ history: cleanHistory })
  const userText = lastMessage?.content || (
    // Legacy fallback: type=workspace with old-style context
    typeof context?.serialized === 'string' ? `Context: ${context.serialized}` : ''
  )

  if (!userText.trim()) {
    return json({ error: 'Missing user message' }, 400)
  }

  const result = await chat.sendMessage(userText)
  const candidate = result.response.candidates?.[0]

  // Check for function calls in the response
  const functionCallPart = candidate?.content?.parts?.find((p: any) => p.functionCall)
  if (functionCallPart?.functionCall) {
    const fc = functionCallPart.functionCall
    return json({
      response: '',
      toolCalls: [{
        toolId: fc.name,
        input: fc.args ?? {},
      }],
      providerUsed: provider,
      model: aiModel,
    })
  }

  return json({
    response: result.response.text(),
    toolCalls: [],
    providerUsed: provider,
    model: aiModel,
  })
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('authorization') ?? ''
    if (!authHeader) return json({ error: 'No Authorization header' }, 401)

    const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    const payload = decodeJWT(jwt)
    if (!payload?.sub) return json({ error: 'Invalid JWT' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    })

    const userId = payload.sub as string
    const reqData = await req.json()
    const { type, input, context, overrideProvider, model, history } = reqData

    // Fetch user settings + API keys
    const [settingsRes, keysRes] = await Promise.all([
      supabaseClient
        .from('ai_settings')
        .select('default_provider, active_model')
        .eq('user_id', userId)
        .maybeSingle(),
      supabaseClient
        .from('ai_keys')
        .select('provider, api_key')
        .eq('user_id', userId),
    ])

    const provider = overrideProvider || settingsRes.data?.default_provider || 'gemini'
    const apiKey = (keysRes.data || []).find((k: any) => k.provider === provider)?.api_key
    const aiModel = model || settingsRes.data?.active_model || 'gemini-1.5-flash'

    // ── Phase 2.4+ structured workspace requests ──────────────────────────────
    if (type === 'workspace' && Array.isArray(reqData.messages)) {
      if (!apiKey) return json({ error: 'No API key configured' }, 400)
      return await handleWorkspace(reqData, apiKey, provider, aiModel)
    }

    // ── Legacy request types (backward compat) ────────────────────────────────
    const contextStr =
      typeof context?.serialized === 'string' ? context.serialized : JSON.stringify(context || {})

    const systemPrompt =
      type === 'schedule'
        ? `${SCHEDULE_RULES}\nContext: ${contextStr}`
        : `${GLOBAL_RULES}\nContext: ${contextStr}`

    if (['chat', 'reflection', 'challenge', 'insight', 'schedule'].includes(type)) {
      if (!apiKey) return json({ error: 'No API key configured' }, 400)

      const fallbackInputs: Record<string, string> = {
        challenge: `Create a concise weekly challenge from these pending tasks: ${(context?.tasks || '').toString()}`,
        insight: 'Give me a very short encouraging insight based on the provided context.',
        reflection: 'Write a short weekly reflection based on the provided context.',
        schedule: 'Turn the provided brain dump into a structured weekly plan.',
        chat: input || '',
      }

      const resolvedInput = (input?.trim() || fallbackInputs[type] || '').trim()
      if (!resolvedInput) return json({ error: 'Missing input' }, 400)

      const genAI = new GoogleGenerativeAI(apiKey)
      const geminiModel = genAI.getGenerativeModel({
        model: aiModel,
        systemInstruction: systemPrompt,
        ...(type === 'schedule' ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
      })

      const chat = geminiModel.startChat({ history: normalizeHistory(history || []) })
      const result = await chat.sendMessage(resolvedInput)
      return json({ response: result.response.text(), providerUsed: provider })
    }

    return json({ error: 'Unsupported request type' }, 400)
  } catch (error: any) {
    return json({ error: error.message }, 500)
  }
})
