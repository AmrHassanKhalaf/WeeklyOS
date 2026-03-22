import { supabase } from '../lib/supabase'

export function useAiApi() {
  const sendMessage = async (type: string, input: string, context: any = {}, overrideProvider?: string, audioBase64?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-handler', {
        body: { type, input, context, overrideProvider, audioBase64 }
      })

      if (error) {
        console.error('Edge Function Error:', error)
        throw new Error(error.message || 'AI Edge Function failed')
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      return data as { response: string, providerUsed: string }
    } catch (e: any) {
      console.error(`AI Api Error:`, e)
      throw new Error(e.message || `AI is not configured properly.`)
    }
  }

  return { sendMessage }
}
