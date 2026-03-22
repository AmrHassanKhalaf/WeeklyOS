import { useSettingsStore, type AIProvider } from '../store/useSettingsStore'

export function useAiApi() {
  const sendMessage = async (_type: string, input: string, context: any) => {
    const state = useSettingsStore.getState()
    const { activeProvider, fallbackEnabled, aiKeys } = state

    try {
      return await makeRequest(activeProvider, input, context, aiKeys[activeProvider])
    } catch (e: any) {
      console.error(`Primary provider ${activeProvider} failed:`, e)
      
      if (!fallbackEnabled) {
        throw new Error(`API Error (${activeProvider}): ${e.message}`)
      }

      // Fallback
      const providers: AIProvider[] = ['openai', 'gemini', 'grok']
      for (const p of providers) {
        if (p === activeProvider) continue
        if (!aiKeys[p]) continue

        try {
          console.log(`Trying fallback provider: ${p}`)
          return await makeRequest(p, input, context, aiKeys[p])
        } catch (fallbackErr) {
          console.error(`Fallback failed: ${p}`, fallbackErr)
        }
      }

      throw new Error(`All configured AI providers failed.`)
    }
  }

  return { sendMessage }
}

async function makeRequest(provider: AIProvider, input: string, context: any, apiKey?: string) {
  if (!apiKey) {
    throw new Error(`Missing API Key for ${provider}`)
  }

  const systemPrompt = `You are the WeeklyOS AI Assistant, an expert productivity analyst. 
Context data: ${JSON.stringify(context || {})}
Be concise, actionable, and encouraging.`

  if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ]
      })
    })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    return { response: data.choices[0].message.content }
  }

  if (provider === 'gemini') {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: input }] }]
      })
    })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    return { response: data.candidates[0].content.parts[0].text }
  }

  if (provider === 'grok') {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input }
        ]
      })
    })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    return { response: data.choices[0].message.content }
  }

  throw new Error(`Provider not supported from frontend browser natively: ${provider}`)
}
