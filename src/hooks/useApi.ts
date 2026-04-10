import { supabase } from '../lib/supabase'
import { useSettingsStore } from '../store/useSettingsStore'

export function useAiApi() {
  const sendMessage = async (type: string, input: string, context: any = {}, overrideProvider?: string, history: any[] = []) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Unauthorized')

      const state = useSettingsStore.getState()
      const callAiHandler = async (accessToken?: string | null) => {
        return fetch(`${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/ai-handler`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || ''}`,
            'apikey': (import.meta as any).env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ type, input, context, overrideProvider, model: state.activeModel, history }),
        })
      }

      let response = await callAiHandler(session?.access_token)

      // If the access token expired, refresh once and retry.
      if (response.status === 401) {
        const { data: refreshData } = await supabase.auth.refreshSession()
        const refreshedToken = refreshData.session?.access_token
        if (refreshedToken) {
          response = await callAiHandler(refreshedToken)
        }
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || `Edge Function returned ${response.status}`)
      }

      return await response.json() as { response: string, providerUsed: string }
    } catch (e: any) {
      throw new Error(e.message)
    }
  }

  return { sendMessage }
}
