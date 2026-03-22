import { supabase } from '../lib/supabase'

export function useAiApi() {
  const sendMessage = async (type: string, input: string, context: any = {}, overrideProvider?: string, audioBase64?: string) => {
    try {
      // Ensure session is available
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Your login session has expired. Please refresh the page or sign in again.')
      }

      const { data, error } = await supabase.functions.invoke('ai-handler', {
        body: { type, input, context, overrideProvider, audioBase64 }
      })

      if (error) {
        console.error('Edge Function Error:', error)
        // Check if error is related to 401 Unauthorized
        if (error.message?.includes('401') || error.message?.includes('non-2xx')) {
          throw new Error('Session unauthorized or expired. Please sign out and sign back in.')
        }
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
