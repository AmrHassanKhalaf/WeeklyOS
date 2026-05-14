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

    const getSessionMock = vi.mocked(supabase.auth.getSession)
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'user1' }, access_token: 'token-123' } } })

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'hello', providerUsed: 'gemini' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const api = useAiApi()
    const result = await api.sendMessage('chat', 'مرحبا')

    expect(result.response).toBe('hello')
    expect(result.providerUsed).toBe('gemini')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/ai-handler'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
        body: expect.stringContaining('"model":"gemini-3.1-pro-preview"'),
      })
    )
  })
})
