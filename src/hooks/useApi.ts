import { supabase } from '../lib/supabase'
import { useSettingsStore } from '../store/useSettingsStore'

export function useAiApi() {
  const sendMessage = async (type: string, input: string, context: any = {}, overrideProvider?: string, history: any[] = []) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const state = useSettingsStore.getState()
      const { data, error } = await supabase.functions.invoke('ai-handler', {
        body: { type, input, context, overrideProvider, model: state.activeModel, history }
      })

      if (error || data?.error) throw new Error(error?.message || data?.error || 'AI Error')
      return data as { response: string, providerUsed: string }
    } catch (e: any) {
      throw new Error(e.message)
    }
  }

  return { sendMessage }
}
