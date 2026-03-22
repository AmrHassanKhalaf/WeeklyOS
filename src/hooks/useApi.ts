import { supabase } from '../lib/supabase'
import { useSettingsStore } from '../store/useSettingsStore'

export function useAiApi() {
  const sendMessage = async (type: string, input: string, context: any = {}, overrideProvider?: string, audioBase64?: string) => {
    try {
      // Ensure session is available
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Your login session has expired. Please refresh the page or sign in again.')
      }

      const state = useSettingsStore.getState()
      
      const { data, error } = await supabase.functions.invoke('ai-handler', {
        body: { type, input, context, overrideProvider, audioBase64, model: state.activeModel }
      })

      if (error) {
        console.error('Edge Function Error Response:', error)
        throw new Error(error.message || 'AI Edge Function failed with a non-2xx status code.')
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
