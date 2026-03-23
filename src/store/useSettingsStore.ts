import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export type AIProvider = 'gemini' | 'grok'

export interface SettingsState {
  // AI Settings
  aiKeys: Partial<Record<AIProvider, string>>
  activeProvider: AIProvider
  activeModel: string
  fallbackEnabled: boolean

  // UI Settings
  theme: 'dark' | 'light' | 'system'

  // Notifications
  dailyReminders: boolean
  weeklySummaries: boolean

  // Privacy
  analyticsEnabled: boolean

  // Actions
  setAiKey: (provider: AIProvider, key: string) => void
  setActiveProvider: (provider: AIProvider) => void
  setActiveModel: (model: string) => void
  setFallbackEnabled: (enabled: boolean) => void
  setTheme: (theme: 'dark' | 'light' | 'system') => void
  setDailyReminders: (enabled: boolean) => void
  setWeeklySummaries: (enabled: boolean) => void
  setAnalyticsEnabled: (enabled: boolean) => void
  exportWeeklyReport: () => void
  loadFromDb: () => Promise<void>
}

const syncSettingsToDb = async (updates: Partial<SettingsState>) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const payload: any = { user_id: user.id }
    if (updates.theme !== undefined) payload.theme = updates.theme
    if (updates.dailyReminders !== undefined) payload.daily_reminders = updates.dailyReminders
    if (updates.weeklySummaries !== undefined) payload.weekly_summaries = updates.weeklySummaries
    if (updates.analyticsEnabled !== undefined) payload.analytics_enabled = updates.analyticsEnabled
    
    await supabase.from('user_settings' as any).upsert(payload)
  } catch (e) {
    console.warn('Sync failed', e)
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      aiKeys: {},
      activeProvider: 'gemini',
      activeModel: 'gemini-1.5-flash',
      fallbackEnabled: true,
      theme: 'dark',
      dailyReminders: true,
      weeklySummaries: true,
      analyticsEnabled: false,

      setAiKey: async (provider, key) => {
        set((state) => ({ aiKeys: { ...state.aiKeys, [provider]: key } }))
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // Check if key exists for this provider
            const { data: existingData } = await supabase.from('ai_keys' as any).select('id').eq('provider', provider).eq('user_id', user.id).maybeSingle()
            const existing = existingData as any
            if (existing) {
              await supabase.from('ai_keys' as any).update({ api_key: key }).eq('id', existing.id)
            } else {
              await supabase.from('ai_keys' as any).insert({ user_id: user.id, provider, api_key: key })
            }
          }
        } catch (e) { console.warn('Supabase ai_keys sync failed', e) }
      },
      setActiveProvider: async (provider) => {
        set({ activeProvider: provider })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await supabase.from('ai_settings' as any).upsert({ user_id: user.id, default_provider: provider })
          }
        } catch (e) {}
      },
      setActiveModel: async (model) => {
        set({ activeModel: model })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await supabase.from('ai_settings' as any).upsert({ user_id: user.id, active_model: model })
          }
        } catch (e) {}
      },
      setFallbackEnabled: async (enabled) => {
        set({ fallbackEnabled: enabled })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await supabase.from('ai_settings' as any).upsert({ user_id: user.id, fallback_enabled: enabled })
          }
        } catch (e) {}
      },
      setTheme: (theme) => { set({ theme }); syncSettingsToDb({ theme }) },
      setDailyReminders: (enabled) => { set({ dailyReminders: enabled }); syncSettingsToDb({ dailyReminders: enabled }) },
      setWeeklySummaries: (enabled) => { set({ weeklySummaries: enabled }); syncSettingsToDb({ weeklySummaries: enabled }) },
      setAnalyticsEnabled: (enabled) => { set({ analyticsEnabled: enabled }); syncSettingsToDb({ analyticsEnabled: enabled }) },

      loadFromDb: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return
          // Load User Settings
          const { data: userSettings } = await supabase.from('user_settings' as any).select().eq('user_id', user.id).maybeSingle()
          const dbData = userSettings as any
          if (dbData) {
            set(state => ({
              ...state,
              theme: dbData.theme ?? state.theme,
              dailyReminders: dbData.daily_reminders ?? state.dailyReminders,
              weeklySummaries: dbData.weekly_summaries ?? state.weeklySummaries,
              analyticsEnabled: dbData.analytics_enabled ?? state.analyticsEnabled
            }))
          }
          // Load AI Settings
          const { data: aiSettings } = await supabase.from('ai_settings' as any).select().eq('user_id', user.id).maybeSingle()
          const aiData = aiSettings as any
          if (aiData) {
            set(state => ({
              ...state,
              activeProvider: aiData.default_provider ?? state.activeProvider,
              activeModel: aiData.active_model ?? state.activeModel,
              fallbackEnabled: aiData.fallback_enabled ?? state.fallbackEnabled
            }))
          }
          // Load AI Keys
          const { data: keysData } = await supabase.from('ai_keys' as any).select('provider, api_key').eq('user_id', user.id)
          if (keysData && keysData.length > 0) {
            const keysObj: Partial<Record<AIProvider, string>> = {}
            keysData.forEach((k: any) => {
              if (k.api_key) keysObj[k.provider as AIProvider] = k.api_key
            })
            set(state => ({ ...state, aiKeys: { ...state.aiKeys, ...keysObj } }))
          }
        } catch (e) { console.warn('Load settings failed', e) }
      },

      exportWeeklyReport: () => {
        const state = get()
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2))
        const node = document.createElement('a')
        node.setAttribute("href", dataStr)
        node.setAttribute("download", "weekly_os_report.json")
        document.body.appendChild(node)
        node.click()
        node.remove()
      }
    }),
    {
      name: 'weeklyos-settings',
    }
  )
)
