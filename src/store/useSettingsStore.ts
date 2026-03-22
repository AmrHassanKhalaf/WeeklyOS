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
      setFallbackEnabled: (enabled) => set({ fallbackEnabled: enabled }),
      setTheme: (theme) => set({ theme }),
      setDailyReminders: (enabled) => set({ dailyReminders: enabled }),
      setWeeklySummaries: (enabled) => set({ weeklySummaries: enabled }),
      setAnalyticsEnabled: (enabled) => set({ analyticsEnabled: enabled }),

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
