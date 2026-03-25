import { describe, expect, it, vi } from 'vitest'
import { useAiApi } from './useApi'
import { useSettingsStore } from '../store/useSettingsStore'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  }
}))

describe('useAiApi', () => {
  it('sendMessage should pass activeModel in body', async () => {
    useSettingsStore.setState({ activeModel: 'gemini-3.1-pro-preview', activeProvider: 'gemini' })

    // @ts-ignore
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user1' } } })
    // @ts-ignore
    supabase.functions.invoke.mockResolvedValue({ data: { response: 'hello', providerUsed: 'gemini' } })

    const api = useAiApi()
    const result = await api.sendMessage('chat', 'مرحبا')

    expect(result.response).toBe('hello')
    expect(result.providerUsed).toBe('gemini')

    expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-handler', expect.objectContaining({
      body: expect.objectContaining({
        type: 'chat',
        input: 'مرحبا',
        model: 'gemini-3.1-pro-preview',
      }),
    }))
  })
})
