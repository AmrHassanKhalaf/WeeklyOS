import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'

export type AIProvider = 'gemini' | 'grok'
export type WeekStartDay = 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'

function getDefaultTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Cairo'
  } catch {
    return 'Africa/Cairo'
  }
}

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
  autoDownloadCompletedWeekReport: boolean

  // Work Schedule
  restDays: string[]  // e.g. ['friday', 'saturday']
  timezone: string
  weekStartDay: WeekStartDay

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
  setAutoDownloadCompletedWeekReport: (enabled: boolean) => void
  setRestDays: (days: string[]) => void
  setTimezone: (timezone: string) => void
  setWeekStartDay: (day: WeekStartDay) => void
  setAnalyticsEnabled: (enabled: boolean) => void
  exportWeeklyReport: () => void
  loadFromDb: () => Promise<void>
}

const syncSettingsToDb = async (updates: Partial<SettingsState>) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    await supabase.from('user_settings').upsert({
      user_id: user.id,
      ...(updates.theme !== undefined && { theme: updates.theme }),
      ...(updates.dailyReminders !== undefined && { daily_reminders: updates.dailyReminders }),
      ...(updates.weeklySummaries !== undefined && { weekly_summaries: updates.weeklySummaries }),
      ...(updates.autoDownloadCompletedWeekReport !== undefined && { auto_download_completed_week_report: updates.autoDownloadCompletedWeekReport }),
      ...(updates.analyticsEnabled !== undefined && { analytics_enabled: updates.analyticsEnabled }),
      ...(updates.restDays !== undefined && { rest_days: updates.restDays }),
      ...(updates.timezone !== undefined && { timezone: updates.timezone }),
      ...(updates.weekStartDay !== undefined && { week_start_day: updates.weekStartDay }),
    })
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
      autoDownloadCompletedWeekReport: false,
      restDays: ['friday'],
      timezone: getDefaultTimeZone(),
      weekStartDay: 'saturday',
      analyticsEnabled: false,

      setAiKey: async (provider, key) => {
        set((state) => ({ aiKeys: { ...state.aiKeys, [provider]: key } }))
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const user = session?.user
          if (user) {
            const { data: existing } = await supabase
              .from('ai_keys')
              .select('id')
              .eq('provider', provider)
              .eq('user_id', user.id)
              .maybeSingle()
            if (existing) {
              await supabase.from('ai_keys').update({ api_key: key }).eq('id', existing.id)
            } else {
              await supabase.from('ai_keys').insert({ user_id: user.id, provider, api_key: key })
            }
          }
        } catch (e) { console.warn('Supabase ai_keys sync failed', e) }
      },

      setActiveProvider: async (provider) => {
        set({ activeProvider: provider })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const user = session?.user
          if (user) {
            await supabase.from('ai_settings').upsert({ user_id: user.id, default_provider: provider })
          }
        } catch (_e) { /* silent */ }
      },

      setActiveModel: async (model) => {
        set({ activeModel: model })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const user = session?.user
          if (user) {
            await supabase.from('ai_settings').upsert({ user_id: user.id, active_model: model })
          }
        } catch (_e) { /* silent */ }
      },

      setFallbackEnabled: async (enabled) => {
        set({ fallbackEnabled: enabled })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const user = session?.user
          if (user) {
            await supabase.from('ai_settings').upsert({ user_id: user.id, fallback_enabled: enabled })
          }
        } catch (_e) { /* silent */ }
      },

      setTheme: (theme) => { set({ theme }); void syncSettingsToDb({ theme }) },
      setDailyReminders: (enabled) => { set({ dailyReminders: enabled }); void syncSettingsToDb({ dailyReminders: enabled }) },
      setWeeklySummaries: (enabled) => { set({ weeklySummaries: enabled }); void syncSettingsToDb({ weeklySummaries: enabled }) },
      setAutoDownloadCompletedWeekReport: (enabled) => { set({ autoDownloadCompletedWeekReport: enabled }); void syncSettingsToDb({ autoDownloadCompletedWeekReport: enabled }) },
      setRestDays: (days) => { set({ restDays: days }); void syncSettingsToDb({ restDays: days }) },
      setTimezone: (timezone) => { set({ timezone }); void syncSettingsToDb({ timezone }) },
      setWeekStartDay: (day) => { set({ weekStartDay: day }); void syncSettingsToDb({ weekStartDay: day }) },
      setAnalyticsEnabled: (enabled) => { set({ analyticsEnabled: enabled }); void syncSettingsToDb({ analyticsEnabled: enabled }) },

      loadFromDb: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const user = session?.user
          if (!user) return

          // Load User Settings
          const { data: userSettings } = await supabase
            .from('user_settings')
            .select()
            .eq('user_id', user.id)
            .maybeSingle()

          if (userSettings) {
            set(state => ({
              ...state,
              theme: (userSettings.theme as SettingsState['theme']) ?? state.theme,
              dailyReminders: userSettings.daily_reminders ?? state.dailyReminders,
              weeklySummaries: userSettings.weekly_summaries ?? state.weeklySummaries,
              autoDownloadCompletedWeekReport: userSettings.auto_download_completed_week_report ?? state.autoDownloadCompletedWeekReport,
              analyticsEnabled: userSettings.analytics_enabled ?? state.analyticsEnabled,
              restDays: (userSettings.rest_days as string[]) ?? state.restDays,
              timezone: userSettings.timezone ?? state.timezone,
              weekStartDay: (userSettings.week_start_day as WeekStartDay) ?? state.weekStartDay,
            }))
          }

          // Load AI Settings
          const { data: aiSettings } = await supabase
            .from('ai_settings')
            .select()
            .eq('user_id', user.id)
            .maybeSingle()

          if (aiSettings) {
            set(state => ({
              ...state,
              activeProvider: (aiSettings.default_provider as AIProvider) ?? state.activeProvider,
              activeModel: aiSettings.active_model ?? state.activeModel,
              fallbackEnabled: aiSettings.fallback_enabled ?? state.fallbackEnabled,
            }))
          }

          // Load AI Keys
          const { data: keysData } = await supabase
            .from('ai_keys')
            .select('provider, api_key')
            .eq('user_id', user.id)

          if (keysData && keysData.length > 0) {
            const keysObj: Partial<Record<AIProvider, string>> = {}
            keysData.forEach((k) => {
              if (k.api_key) keysObj[k.provider as AIProvider] = k.api_key
            })
            set(state => ({ ...state, aiKeys: { ...state.aiKeys, ...keysObj } }))
          }
        } catch (e) { console.warn('Load settings failed', e) }
      },

      exportWeeklyReport: () => {
        // Strip AI keys before export — never include API secrets in downloaded files
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { aiKeys: _aiKeys, ...safeState } = get()
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(safeState, null, 2))
        const node = document.createElement('a')
        node.setAttribute('href', dataStr)
        node.setAttribute('download', 'weekly_os_report.json')
        document.body.appendChild(node)
        node.click()
        node.remove()
      },
    }),
    {
      name: 'weeklyos-settings',
    }
  )
)
