import { supabase } from '../lib/supabase'
import { useSettingsStore } from '../store/useSettingsStore'

type AiHistoryRole = 'assistant' | 'user' | 'system'

export interface AiHistoryMessage {
  role: AiHistoryRole
  content: string
}

export interface AiResponse {
  response: string
  providerUsed: string
}

export type AiRequestContext = Record<string, unknown>

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_PUBLIC_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string)

export function useAiApi() {
  const sendMessage = async (
    type: string,
    input: string,
    context: AiRequestContext = {},
    overrideProvider?: string,
    history: AiHistoryMessage[] = []
  ) => {
    try {
      if (!SUPABASE_URL || !SUPABASE_PUBLIC_KEY) {
        throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY)')
      }

      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) throw new Error('Unauthorized')

      const state = useSettingsStore.getState()
      const callAiHandler = async (accessToken?: string | null) => {
        return fetch(`${SUPABASE_URL}/functions/v1/ai-handler`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken || ''}`,
            'apikey': SUPABASE_PUBLIC_KEY,
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

      return await response.json() as AiResponse
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error'
      throw new Error(message)
    }
  }

  return { sendMessage }
}
