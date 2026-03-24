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
        // If it's a 401, it means the JWT token expired or is invalid
        if (error.message && error.message.includes('non-2xx status code') || error.status === 401) {
          throw new Error('Your login session appears to have expired. Please sign out and sign back in to use AI features.')
        }
        throw new Error(error.message || 'AI Edge Function failed.')
      }

      if (data?.error) {
        if (data.error === 'Unauthorized') {
           throw new Error('Your login session appears to have expired. Please sign out and sign back in.')
        }
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
