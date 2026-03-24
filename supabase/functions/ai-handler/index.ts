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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await (createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
    )).auth.getUser()
    
    if (authError || !user) throw new Error('Unauthorized')

    const reqData = await req.json()
    const { type, sessionId, chunkId, chunkData, context, overrideProvider, model } = reqData
    console.log("AI Handler Request:", { type, sessionId, model })

    // 1. Common Settings Fetch
    const [settingsRes, keysRes] = await Promise.all([
      supabaseClient.from('ai_settings').select('default_provider, active_model').eq('user_id', user.id).maybeSingle(),
      supabaseClient.from('ai_keys').select('provider, api_key').eq('user_id', user.id)
    ])

    const provider = overrideProvider || settingsRes.data?.default_provider || 'gemini'
    const apiKey = (keysRes.data || []).find(k => k.provider === provider)?.api_key

    const aiModel = model || settingsRes.data?.active_model || 'gemini-1.5-flash'
    const systemPrompt = `${GLOBAL_RULES}\nContext: ${JSON.stringify(context || {})}`

    // 2. Interaction Handlers
    if (type === 'chunk' && sessionId && chunkData) {
      const buffer = Uint8Array.from(atob(chunkData), c => c.charCodeAt(0))
      await supabaseClient.storage.from('voice-responses').upload(`chunks/${user.id}/${sessionId}/${chunkId}.webm`, buffer, { contentType: 'audio/webm', upsert: true })
      return new Response(JSON.stringify({ status: 'chunk_received' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } } )
    }

    if (type === 'chat') {
      if (!apiKey) throw new Error('No key')
      const { input, history } = reqData
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

      return new Response(JSON.stringify({ response: responseText, providerUsed: 'gemini' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (type === 'process' && sessionId) {
      if (!apiKey) throw new Error('No key')
      const { data: files } = await supabaseClient.storage.from('voice-responses').list(`chunks/${user.id}/${sessionId}`)
      if (!files || files.length === 0) throw new Error('No audio found')

      const chunks = await Promise.all(
        files.sort((a, b) => a.name.localeCompare(b.name)).map(async (f) => {
          const { data } = await supabaseClient.storage.from('voice-responses').download(`chunks/${user.id}/${sessionId}/${f.name}`)
          const arr = new Uint8Array(await data!.arrayBuffer())
          let binary = ''; for (let i = 0; i < arr.byteLength; i++) binary += String.fromCharCode(arr[i]);
          return btoa(binary)
        })
      )

      // SSE STREAM
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(encoder.encode(`event: status\ndata: ${JSON.stringify({ state: 'generating' })}\n\n`))

            const parts = chunks.map(c => ({ inlineData: { mimeType: 'audio/webm', data: c } }))
            parts.push({ text: "Respond to the audio. Be brief." } as any)

            // Phase 12: Gemini Native Voice Configuration
            // We use 'audio' modality if the model supports it. 
            // Most recent Flash models do.
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    systemInstruction: { parts: [{ text: systemPrompt }] }, 
                    contents: [{ role: 'user', parts }],
                    generationConfig: {
                        responseModality: ["TEXT", "AUDIO"], // Request both text and audio
                        speechConfig: {
                           voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } // "Puck", "Charon", etc.
                        }
                    }
                })
            })

            if (!response.ok) {
                const errText = await response.text();
                // Fallback to text-only if audio modality is not supported for this model/key
                if (errText.includes("modality") || errText.includes("mod") || response.status === 400) {
                    const fallbackRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents: [{ role: 'user', parts }] })
                    })
                    const fbData = await fallbackRes.json()
                    const fbText = fbData.candidates[0].content.parts[0].text
                    controller.enqueue(encoder.encode(`event: text\ndata: ${JSON.stringify({ text: fbText, providerUsed: 'gemini-fallback' })}\n\n`))
                } else {
                    throw new Error(errText)
                }
            } else {
                const data = await response.json()
                const parts = data.candidates[0].content.parts
                
                for (const part of parts) {
                    if (part.text) {
                        controller.enqueue(encoder.encode(`event: text\ndata: ${JSON.stringify({ text: part.text, providerUsed: 'gemini-native' })}\n\n`))
                    }
                    if (part.inlineData && part.inlineData.mimeType.includes("audio")) {
                        // Upload native audio to Supabase Storage
                        const audioBuffer = Uint8Array.from(atob(part.inlineData.data), c => c.charCodeAt(0))
                        const audioPath = `responses/${user.id}/${sessionId}_${Date.now()}.wav`
                        await supabaseClient.storage.from('voice-responses').upload(audioPath, audioBuffer, { contentType: 'audio/wav', upsert: true })
                        
                        const { data: { publicUrl } } = supabaseClient.storage.from('voice-responses').getPublicUrl(audioPath)
                        controller.enqueue(encoder.encode(`event: audio\ndata: ${JSON.stringify({ url: publicUrl })}\n\n`))
                    }
                }
            }

            // 4. Send "Done"
            controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`))

            // Cleanup
            await supabaseClient.storage.from('voice-responses').remove(files.map(f => `chunks/${user.id}/${sessionId}/${f.name}`))
            
          } catch (e: any) {
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: e.message })}\n\n`))
          } finally {
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
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
