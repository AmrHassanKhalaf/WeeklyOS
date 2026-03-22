import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export type AIProvider = 'openai' | 'gemini' | 'grok' | 'anthropic'

export interface SettingsState {
  // AI Settings
  aiKeys: Partial<Record<AIProvider, string>>
  activeProvider: AIProvider
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
    if (updates.fallbackEnabled !== undefined) payload.fallback_enabled = updates.fallbackEnabled
    
    await supabase.from('user_settings' as any).upsert(payload)
  } catch (e) {
    console.warn('Sync failed', e)
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      aiKeys: {},
      activeProvider: 'openai',
      fallbackEnabled: true,
      theme: 'dark',
      dailyReminders: true,
      weeklySummaries: true,
      analyticsEnabled: false,

      setAiKey: async (provider, key) => {
        set((state) => ({ aiKeys: { ...state.aiKeys, [provider]: key } }))
        // Best effort sync to Supabase if table exists
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await supabase.from('ai_keys' as any).upsert({ 
              user_id: user.id, 
              provider, 
              key_value: key 
            })
          }
        } catch (e) { console.warn('Supabase ai_keys sync failed', e) }
      },
      setActiveProvider: (provider) => set({ activeProvider: provider }),
      setFallbackEnabled: (enabled) => { set({ fallbackEnabled: enabled }); syncSettingsToDb({ fallbackEnabled: enabled }) },
      setTheme: (theme) => { set({ theme }); syncSettingsToDb({ theme }) },
      setDailyReminders: (enabled) => { set({ dailyReminders: enabled }); syncSettingsToDb({ dailyReminders: enabled }) },
      setWeeklySummaries: (enabled) => { set({ weeklySummaries: enabled }); syncSettingsToDb({ weeklySummaries: enabled }) },
      setAnalyticsEnabled: (enabled) => { set({ analyticsEnabled: enabled }); syncSettingsToDb({ analyticsEnabled: enabled }) },

      loadFromDb: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return
          const { data } = await supabase.from('user_settings' as any).select().eq('user_id', user.id).maybeSingle()
          const dbData = data as any
          if (dbData) {
            set({
              theme: dbData.theme,
              dailyReminders: dbData.daily_reminders,
              weeklySummaries: dbData.weekly_summaries,
              analyticsEnabled: dbData.analytics_enabled,
              fallbackEnabled: dbData.fallback_enabled
            })
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
