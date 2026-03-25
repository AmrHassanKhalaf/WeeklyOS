import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSettingsStore } from './useSettingsStore'
import { supabase } from '../lib/supabase'

const upsertMock = vi.fn().mockResolvedValue({ data: null })
const updateMock = vi.fn().mockResolvedValue({ data: null })
const insertMock = vi.fn().mockResolvedValue({ data: null })
const selectMock = vi.fn().mockReturnThis()
const eqMock = vi.fn().mockReturnThis()
const maybeSingleMock = vi.fn().mockResolvedValue({ data: null })

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: selectMock,
      eq: eqMock,
      maybeSingle: maybeSingleMock,
      upsert: upsertMock,
      update: updateMock,
      insert: insertMock,
    })),
    functions: {
      invoke: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({}),
        list: vi.fn().mockResolvedValue({ data: [] }),
        download: vi.fn(),
      })),
    },
  },
}))

describe('useSettingsStore', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    upsertMock.mockClear()
    updateMock.mockClear()
    insertMock.mockClear()
    useSettingsStore.setState({
      aiKeys: {},
      activeProvider: 'gemini',
      activeModel: 'gemini-1.5-flash',
      fallbackEnabled: true,
      theme: 'dark',
      dailyReminders: true,
      weeklySummaries: true,
      restDays: ['friday'],
      analyticsEnabled: false,
    })
  })

  it('should update activeProvider and sync to Supabase', async () => {
    // @ts-ignore
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user1' } } } })

    await useSettingsStore.getState().setActiveProvider('grok')

    const state = useSettingsStore.getState()
    expect(state.activeProvider).toBe('grok')
    expect(supabase.from).toHaveBeenCalledWith('ai_settings')
    expect(upsertMock).toHaveBeenCalledWith({ user_id: 'user1', default_provider: 'grok' })
  })

  it('should update activeModel and sync to Supabase', async () => {
    // @ts-ignore
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user1' } } } })

    await useSettingsStore.getState().setActiveModel('gemini-3.1-pro-preview')

    const state = useSettingsStore.getState()
    expect(state.activeModel).toBe('gemini-3.1-pro-preview')
    expect(supabase.from).toHaveBeenCalledWith('ai_settings')
    expect(upsertMock).toHaveBeenCalledWith({ user_id: 'user1', active_model: 'gemini-3.1-pro-preview' })
  })
})
