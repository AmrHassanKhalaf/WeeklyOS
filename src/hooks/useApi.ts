import { supabase } from '../lib/supabase'
import { useSettingsStore } from '../store/useSettingsStore'

export function useAiApi() {
  const getAuth = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) throw new Error('Session expired')
    return session.access_token
  }

  const sendMessage = async (type: string, input: string, context: any = {}, overrideProvider?: string, audioBase64?: string, history: any[] = []) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const state = useSettingsStore.getState()
      const { data, error } = await supabase.functions.invoke('ai-handler', {
        body: { type, input, context, overrideProvider, audioBase64, model: state.activeModel, history }
      })

      if (error || data?.error) throw new Error(error?.message || data?.error || 'AI Error')
      return data as { response: string, providerUsed: string }
    } catch (e: any) {
      throw new Error(e.message)
    }
  }

  const sendAudioChunk = async (sessionId: string, chunkId: number, chunkBase64: string) => {
    await getAuth() // Ensure authenticated
    const { data, error } = await supabase.functions.invoke('ai-handler', {
      body: { type: 'chunk', sessionId, chunkId, chunkData: chunkBase64 }
    })
    if (error) throw error
    return data
  }

  const streamVoiceResponse = async (
    sessionId: string, 
    context: any, 
    onEvent: (event: string, data: any) => void,
    signal?: AbortSignal
  ) => {
    const token = await getAuth()
    const state = useSettingsStore.getState()
    
    const response = await fetch(`${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/ai-handler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': (import.meta as any).env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        type: 'process',
        sessionId,
        context,
        model: state.activeModel
      }),
      signal // Support cancellation
    })

    if (!response.ok) throw new Error('Stream failed')
    
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    
    if (!reader) return

    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        const eventMatch = line.match(/^event: (.*)$/m)
        const dataMatch = line.match(/^data: (.*)$/m)
        if (eventMatch && dataMatch) {
          onEvent(eventMatch[1], JSON.parse(dataMatch[1]))
        }
      }
    }
  }

  return { sendMessage, sendAudioChunk, streamVoiceResponse }
}
