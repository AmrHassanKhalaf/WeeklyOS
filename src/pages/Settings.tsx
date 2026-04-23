import { AppLayout } from '../components/layout/AppLayout'
import { useSettingsStore, AIProvider, WeekStartDay } from '../store/useSettingsStore'
import { useState, useEffect } from 'react'
import { generateWeeklyReportHTML } from '../lib/generateWeeklyReportHTML'
import { GlowButton } from '../components/effects/GlowButton'
import { useWeekStore } from '../store/useWeekStore'
import { usePinnedTaskStore } from '../store/usePinnedTaskStore'
import type { DayOfWeek, Priority, WeekData } from '../store/useWeekStore'

const TIMEZONE_OPTIONS = [
  'Africa/Cairo',
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
]

const WEEK_START_OPTIONS: Array<{ value: WeekStartDay; label: string }> = [
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
]

export function Settings() {
  const settings = useSettingsStore()
  const { currentWeek, getPreviousWeekForReport, goToWeek } = useWeekStore()
  const pinnedStore = usePinnedTaskStore()
  const [isExporting, setIsExporting] = useState(false)

  // Local state for Model Selection
  const [localProvider, setLocalProvider] = useState<AIProvider>(settings.activeProvider)
  const [localModel, setLocalModel] = useState<string>(settings.activeModel)
  const [isSavingModel, setIsSavingModel] = useState(false)
  const [savedModel, setSavedModel] = useState(false)
  const [pinnedDraft, setPinnedDraft] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    dayOfWeek: 'monday' as DayOfWeek,
    startTime: '07:00',
    endTime: '10:00',
    tags: '',
    untilDate: '',
    isActive: true,
  })

  // Sync local state when store loads
  useEffect(() => {
    setLocalProvider(settings.activeProvider)
    setLocalModel(settings.activeModel)
  }, [settings.activeProvider, settings.activeModel])

  useEffect(() => {
    void pinnedStore.loadPinnedTasks()
  }, [])

  useEffect(() => {
    if (!settings.autoDownloadCompletedWeekReport || !currentWeek) return
    const markerKey = `weeklyos:auto-report:${currentWeek.year}:w${currentWeek.weekNumber}`
    if (localStorage.getItem(markerKey)) return

    const run = async () => {
      const prevWeek = await getPreviousWeekForReport()
      if (!prevWeek) return
      openReportWindow(prevWeek)
      localStorage.setItem(markerKey, '1')
    }

    void run()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.autoDownloadCompletedWeekReport, currentWeek?.id])

  // Determine if it's a custom model
  const predefinedGemini = [
    'gemini-flash-latest', 
    'gemini-3.1-pro-preview', 
    'gemini-3-flash-preview', 
    'gemini-2.5-pro', 
    'gemini-2.5-flash', 
    'gemini-2.5-flash-lite',
    'gemini-live-2.5-flash-native-audio'
  ]
  const predefinedGrok = [
    'grok-4', 
    'grok-4.1-fast', 
    'grok-4-vision', 
    'grok-code-fast-1'
  ]
  const isCustom = localProvider === 'gemini' 
    ? !predefinedGemini.includes(localModel)
    : !predefinedGrok.includes(localModel)

  const handleSaveModel = async () => {
    setIsSavingModel(true)
    await settings.setActiveProvider(localProvider)
    await settings.setActiveModel(localModel)
    setIsSavingModel(false)
    setSavedModel(true)
    setTimeout(() => setSavedModel(false), 2000)
  }

  const openReportWindow = (weekToExport?: WeekData | null) => {
    const targetWeek = weekToExport || currentWeek
    if (!targetWeek || isExporting) return
    setIsExporting(true)
    try {
      const html = generateWeeklyReportHTML(targetWeek, {
        includedDays: settings.reportIncludedDays,
        closingQuote: settings.reportClosingQuote,
      })
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url  = URL.createObjectURL(blob)
      const win  = window.open(url, '_blank')
      // Clean up blob URL after window loads
      if (win) {
        win.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
      } else {
        setTimeout(() => URL.revokeObjectURL(url), 60_000)
        alert('Pop-up blocked — please allow pop-ups for this site.')
      }
    } catch (e) {
      console.error('Report failed:', e)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadCompletedWeek = async () => {
    const prevWeek = await getPreviousWeekForReport()
    if (!prevWeek) {
      alert('No completed week available yet.')
      return
    }
    openReportWindow(prevWeek)
  }

  const handleCreatePinnedTask = async () => {
    if (!pinnedDraft.title.trim()) {
      alert('Please enter a title for the pinned task.')
      return
    }

    try {
      await pinnedStore.createPinnedTask({
        title: pinnedDraft.title.trim(),
        description: pinnedDraft.description.trim() || undefined,
        priority: pinnedDraft.priority,
        dayOfWeek: pinnedDraft.dayOfWeek,
        startTime: pinnedDraft.startTime || undefined,
        endTime: pinnedDraft.endTime || undefined,
        tags: pinnedDraft.tags ? pinnedDraft.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        untilDate: pinnedDraft.untilDate || undefined,
        isActive: pinnedDraft.isActive,
      })

      if (currentWeek) {
        await goToWeek(currentWeek.weekNumber, currentWeek.year)
      }

      setPinnedDraft({
        title: '',
        description: '',
        priority: 'medium',
        dayOfWeek: 'monday',
        startTime: '07:00',
        endTime: '10:00',
        tags: '',
        untilDate: '',
        isActive: true,
      })
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create pinned task')
    }
  }

  const handleTogglePinnedTask = async (id: string, isActive: boolean) => {
    try {
      await pinnedStore.togglePinnedTask(id, isActive)
      if (currentWeek) {
        await goToWeek(currentWeek.weekNumber, currentWeek.year)
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update pinned task')
    }
  }

  const handleDeletePinnedTask = async (id: string) => {
    try {
      await pinnedStore.deletePinnedTask(id)
      if (currentWeek) {
        await goToWeek(currentWeek.weekNumber, currentWeek.year)
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete pinned task')
    }
  }

  const Toggle = ({ label, desc, checked, onChange }: { label: string, desc: string, checked: boolean, onChange: (c: boolean) => void }) => (
    <div className="flex items-center justify-between gap-4 p-4 bg-surface-container-low/70 rounded-xl border border-white/10">
      <div>
        <p className="font-bold text-on-surface text-sm">{label}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
      </div>
      <button 
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full p-1 transition-colors ${checked ? 'bg-primary' : 'bg-surface-variant'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  )

  return (
    <AppLayout>
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-10 py-8 md:py-10">
        <div className="mb-8 rounded-2xl border border-white/10 bg-gradient-to-br from-surface-container-low/70 to-surface-container-lowest/80 p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-on-surface mb-2">Settings</h1>
              <p className="text-sm md:text-base text-neutral-300">Configure your WeeklyOS experience, AI integrations, and privacy in one place.</p>
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
              <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary">Workspace</span>
              <span className="px-2.5 py-1 rounded-full bg-tertiary/15 text-tertiary">AI</span>
              <span className="px-2.5 py-1 rounded-full bg-error/15 text-error">Privacy</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
          
          {/* AI Settings */}
          <section className="space-y-6 xl:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-surface-container-low/40 p-5 md:p-6 lg:p-7">
            <div className="flex items-center gap-3 text-primary mb-5">
              <span className="material-symbols-outlined">smart_toy</span>
              <h2 className="text-[13px] font-bold uppercase tracking-widest">AI Integration</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Primary Model Selection</label>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select 
                      value={localProvider}
                      onChange={e => {
                        const p = e.target.value as AIProvider;
                        setLocalProvider(p)
                        if (p === 'grok') setLocalModel('grok-2-mini')
                        if (p === 'gemini') setLocalModel('gemini-1.5-flash')
                      }}
                      className="bg-surface-container-low px-4 py-3 rounded-xl border border-white/10 outline-none text-sm text-on-surface"
                    >
                      <option value="gemini">Google Gemini</option>
                      <option value="grok">Grok (xAI)</option>
                    </select>
                    
                    <select
                      value={isCustom ? 'custom' : localModel}
                      onChange={e => {
                        if (e.target.value !== 'custom') {
                          setLocalModel(e.target.value)
                        } else {
                          setLocalModel('') // clear for custom typing
                        }
                      }}
                      className="bg-surface-container-low px-4 py-3 rounded-xl border border-white/10 outline-none text-sm text-on-surface text-tertiary font-medium"
                    >
                      {localProvider === 'grok' && (
                        <>
                          <option value="grok-4">grok-4</option>
                          <option value="grok-4.1-fast">grok-4.1-fast</option>
                          <option value="grok-4-vision">grok-4-vision</option>
                          <option value="grok-code-fast-1">grok-code-fast-1</option>
                        </>
                      )}
                      {localProvider === 'gemini' && (
                        <>
                           <option value="gemini-flash-latest">gemini-flash-latest</option>
                           <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                           <option value="gemini-3-flash-preview">gemini-3-flash-preview</option>
                           <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                           <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                           <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
                           <option value="gemini-live-2.5-flash-native-audio">gemini-live-audio</option>
                        </>
                      )}
                      <option value="custom">Other (Custom...)</option>
                    </select>
                  </div>

                  {isCustom && (
                    <input
                      type="text"
                      value={localModel}
                      onChange={e => setLocalModel(e.target.value)}
                      placeholder={`Enter custom ${localProvider} model name...`}
                      className="w-full bg-surface-container-lowest px-4 py-3 rounded-xl border border-white/10 outline-none text-sm text-on-surface font-mono focus:border-tertiary/50 transition-colors"
                    />
                  )}

                  <div className="flex items-center gap-3">
                    <GlowButton
                      type="button"
                      onClick={handleSaveModel}
                      disabled={isSavingModel || (!localModel.trim()) || (localProvider === settings.activeProvider && localModel === settings.activeModel)}
                      compact
                      variant="secondary"
                      className="text-[11px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingModel ? 'Saving...' : savedModel ? 'Saved!' : 'Save Model Selection'}
                    </GlowButton>
                    {savedModel && <span className="text-tertiary text-[11px] font-medium uppercase tracking-widest">Successfully updated</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-4 py-4 border-y border-white/10">
                <ProviderInput provider="gemini" label="Google Gemini" settings={settings} />
                <ProviderInput provider="grok" label="xAI Grok" settings={settings} />
              </div>

              <Toggle 
                label="Fallback Provider" 
                desc="Automatically switch to another provider if the primary one fails."
                checked={settings.fallbackEnabled}
                onChange={settings.setFallbackEnabled}
              />
            </div>
            </div>
          </section>

          {/* General & Privacy */}
          <section className="space-y-6 xl:col-span-7">
            
            {/* UI Settings */}
            <div className="rounded-2xl border border-white/10 bg-surface-container-low/40 p-5 md:p-6 lg:p-7">
              <div className="flex items-center gap-3 text-tertiary mb-5">
                <span className="material-symbols-outlined">palette</span>
                <h2 className="text-[13px] font-bold uppercase tracking-widest">Appearance</h2>
              </div>
              <div className="flex gap-4">
                {['dark', 'light', 'system'].map(t => (
                  <GlowButton 
                    key={t}
                    type="button"
                    onClick={() => settings.setTheme(t as any)}
                    compact
                    variant={settings.theme === t ? 'secondary' : 'tertiary'}
                    className={`flex-1 text-[12px] font-bold uppercase tracking-wider ${settings.theme === t ? '' : 'opacity-75 hover:opacity-100'}`}
                  >
                    {t}
                  </GlowButton>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="rounded-2xl border border-white/10 bg-surface-container-low/40 p-5 md:p-6 lg:p-7">
              <div className="flex items-center gap-3 text-neutral-400 mb-5">
                <span className="material-symbols-outlined">notifications</span>
                <h2 className="text-[13px] font-bold uppercase tracking-widest">Notifications</h2>
              </div>
              <div className="space-y-4">
                <Toggle 
                  label="Daily Reminders" 
                  desc="Get notified about your main objective every morning."
                  checked={settings.dailyReminders}
                  onChange={settings.setDailyReminders}
                />
                <Toggle 
                  label="Weekly Summary" 
                  desc="Receive an email report of your week's performance."
                  checked={settings.weeklySummaries}
                  onChange={settings.setWeeklySummaries}
                />
                <Toggle
                  label="Auto-download completed week report"
                  desc="When enabled, WeeklyOS downloads last completed week's PDF once after rollover."
                  checked={settings.autoDownloadCompletedWeekReport}
                  onChange={settings.setAutoDownloadCompletedWeekReport}
                />
              </div>
            </div>

            {/* Work Schedule */}
            <div className="rounded-2xl border border-white/10 bg-surface-container-low/40 p-5 md:p-6 lg:p-7">
              <div className="flex items-center gap-3 text-primary mb-5">
                <span className="material-symbols-outlined">calendar_month</span>
                <h2 className="text-[13px] font-bold uppercase tracking-widest">Work Schedule</h2>
              </div>
              <div className="bg-surface-container-low rounded-xl border border-white/10 p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Timezone</label>
                    <select
                      value={settings.timezone}
                      onChange={e => settings.setTimezone(e.target.value)}
                      className="w-full bg-surface-container-lowest px-4 py-3 rounded-xl border border-white/10 outline-none text-sm text-on-surface"
                    >
                      <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>System ({Intl.DateTimeFormat().resolvedOptions().timeZone})</option>
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Week Starts On</label>
                    <select
                      value={settings.weekStartDay}
                      onChange={e => settings.setWeekStartDay(e.target.value as WeekStartDay)}
                      className="w-full bg-surface-container-lowest px-4 py-3 rounded-xl border border-white/10 outline-none text-sm text-on-surface"
                    >
                      {WEEK_START_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-[12px] text-neutral-400 mb-2">Select your rest days. These days will be marked as "Rest Day" on your dashboard.</p>
                <div className="flex flex-wrap gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                    const isRest = (settings.restDays || []).includes(day)
                    return (
                      <GlowButton
                        key={day}
                        type="button"
                        onClick={() => {
                          const current = settings.restDays || []
                          const next = isRest 
                            ? current.filter(d => d !== day)
                            : [...current, day]
                          settings.setRestDays(next)
                        }}
                        compact
                        variant={isRest ? 'secondary' : 'tertiary'}
                        className={`uppercase tracking-wider text-[11px] font-bold ${isRest ? 'text-white' : 'text-neutral-400'}`}
                      >
                        {day.slice(0, 3)}
                      </GlowButton>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Pinned Tasks */}
            <div className="rounded-2xl border border-white/10 bg-surface-container-low/40 p-5 md:p-6 lg:p-7">
              <div className="flex items-center gap-3 text-primary mb-5">
                <span className="material-symbols-outlined">push_pin</span>
                <h2 className="text-[13px] font-bold uppercase tracking-widest">Pinned Tasks</h2>
              </div>
              <div className="bg-surface-container-low rounded-xl border border-white/10 p-4 space-y-3">
                <p className="text-xs text-neutral-500">Pinned tasks repeat every week on your selected day/time until you disable or delete them.</p>
                <input
                  type="text"
                  placeholder="Pinned task title"
                  value={pinnedDraft.title}
                  onChange={e => setPinnedDraft(p => ({ ...p, title: e.target.value }))}
                  className="w-full bg-surface-container-lowest px-4 py-2.5 rounded-lg border border-white/10 outline-none text-sm"
                />
                <textarea
                  rows={2}
                  placeholder="Description (optional)"
                  value={pinnedDraft.description}
                  onChange={e => setPinnedDraft(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-surface-container-lowest px-4 py-2.5 rounded-lg border border-white/10 outline-none text-sm resize-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={pinnedDraft.priority}
                    onChange={e => setPinnedDraft(p => ({ ...p, priority: e.target.value as Priority }))}
                    className="bg-surface-container-lowest px-3 py-2 rounded-lg border border-white/10 text-sm"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select
                    value={pinnedDraft.dayOfWeek}
                    onChange={e => setPinnedDraft(p => ({ ...p, dayOfWeek: e.target.value as DayOfWeek }))}
                    className="bg-surface-container-lowest px-3 py-2 rounded-lg border border-white/10 text-sm"
                  >
                    {['saturday','sunday','monday','tuesday','wednesday','thursday','friday'].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={pinnedDraft.startTime}
                    onChange={e => setPinnedDraft(p => ({ ...p, startTime: e.target.value }))}
                    className="bg-surface-container-lowest px-3 py-2 rounded-lg border border-white/10 text-sm [color-scheme:dark]"
                  />
                  <input
                    type="time"
                    value={pinnedDraft.endTime}
                    onChange={e => setPinnedDraft(p => ({ ...p, endTime: e.target.value }))}
                    className="bg-surface-container-lowest px-3 py-2 rounded-lg border border-white/10 text-sm [color-scheme:dark]"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={pinnedDraft.tags}
                  onChange={e => setPinnedDraft(p => ({ ...p, tags: e.target.value }))}
                  className="w-full bg-surface-container-lowest px-4 py-2.5 rounded-lg border border-white/10 outline-none text-sm"
                />
                <input
                  type="date"
                  value={pinnedDraft.untilDate}
                  onChange={e => setPinnedDraft(p => ({ ...p, untilDate: e.target.value }))}
                  className="w-full bg-surface-container-lowest px-4 py-2.5 rounded-lg border border-white/10 outline-none text-sm [color-scheme:dark]"
                />
                <p className="text-[11px] text-neutral-500 -mt-1">
                  Leave date empty to repeat every week until you pause or delete this pinned task.
                </p>
                <GlowButton
                  type="button"
                  onClick={handleCreatePinnedTask}
                  compact
                  variant="secondary"
                  className="text-[11px] font-bold uppercase tracking-widest"
                >
                  Create Pinned Task
                </GlowButton>

                <div className="space-y-2 pt-2 border-t border-white/10 max-h-64 overflow-y-auto pr-1">
                  {pinnedStore.items.length === 0 && (
                    <p className="text-xs text-neutral-500">No pinned tasks created yet.</p>
                  )}
                  {pinnedStore.items.map((item) => (
                    <div key={item.id} className="bg-surface-container-lowest border border-white/5 rounded-lg px-3 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold leading-tight">{item.title}</p>
                          <p className="text-[12px] text-neutral-500 mt-0.5">{item.dayOfWeek} • {item.startTime || '--:--'} to {item.endTime || '--:--'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => void handleTogglePinnedTask(item.id, !item.isActive)}
                            className={`px-2.5 py-1 rounded text-[11px] uppercase tracking-wider font-bold ${item.isActive ? 'bg-tertiary/15 text-tertiary' : 'bg-neutral-700/30 text-neutral-400'}`}
                          >
                            {item.isActive ? 'Active' : 'Paused'}
                          </button>
                          <button
                            onClick={() => void handleDeletePinnedTask(item.id)}
                            className="px-2.5 py-1 rounded text-[11px] uppercase tracking-wider font-bold bg-error/15 text-error"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>


            {/* ── Report Settings ─────────────────────────────────── */}
            <div className="rounded-2xl border border-white/10 bg-surface-container-low/40 p-5 md:p-6 lg:p-7">
              <div className="flex items-center gap-3 text-tertiary mb-5">
                <span className="material-symbols-outlined">picture_as_pdf</span>
                <h2 className="text-[13px] font-bold uppercase tracking-widest">Report Settings</h2>
              </div>

              {/* Days included in report */}
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3">Days Included in Report</p>
                <div className="flex flex-wrap gap-2">
                  {['saturday','sunday','monday','tuesday','wednesday','thursday','friday'].map(day => {
                    const included = (settings.reportIncludedDays ?? []).includes(day)
                    return (
                      <GlowButton
                        key={day}
                        type="button"
                        onClick={() => {
                          const current = settings.reportIncludedDays ?? []
                          const next = included
                            ? current.filter(d => d !== day)
                            : [...current, day]
                          settings.setReportIncludedDays(next)
                        }}
                        compact
                        variant={included ? 'secondary' : 'tertiary'}
                        className={`uppercase tracking-wider text-[11px] font-bold ${
                          included ? 'text-white' : 'text-neutral-500'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </GlowButton>
                    )
                  })}
                </div>
                <p className="text-[11px] text-neutral-500 mt-2">
                  Days turned off won't appear in the exported PDF.
                </p>
              </div>

              {/* Closing quote */}
              <div className="mb-5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Closing Page Quote
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. The secret of getting ahead is getting started. — Mark Twain"
                  value={settings.reportClosingQuote ?? ''}
                  onChange={e => settings.setReportClosingQuote(e.target.value)}
                  className="w-full bg-surface-container-lowest px-4 py-3 rounded-xl border border-white/10 outline-none text-sm text-on-surface resize-none focus:border-tertiary/50 transition-colors"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Appears on the last report page when a day ends up alone. Use " — Author" at the end to add an attribution.
                </p>
              </div>

              {/* Export buttons */}
              <div className="space-y-3">
                <GlowButton
                  type="button"
                  onClick={() => void openReportWindow()}
                  disabled={isExporting}
                  compact
                  variant="secondary"
                  className="w-full text-sm font-bold disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isExporting ? 'sync' : 'download'}
                  </span>
                  {isExporting ? 'Generating...' : 'Export This Week Report'}
                </GlowButton>
                <GlowButton
                  type="button"
                  onClick={() => void handleDownloadCompletedWeek()}
                  disabled={isExporting}
                  compact
                  variant="tertiary"
                  className="w-full text-sm font-bold disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">history</span>
                  Export Previous Week Report
                </GlowButton>
              </div>
            </div>

            {/* ── Privacy & Data ───────────────────────────────────── */}
            <div className="rounded-2xl border border-white/10 bg-surface-container-low/40 p-5 md:p-6 lg:p-7">
              <div className="flex items-center gap-3 text-error mb-5">
                <span className="material-symbols-outlined">security</span>
                <h2 className="text-[13px] font-bold uppercase tracking-widest">Privacy &amp; Data</h2>
              </div>
              <div className="space-y-2">
                <Toggle
                  label="Analytics Tracking"
                  desc="Share anonymous usage data to help us improve."
                  checked={settings.analyticsEnabled}
                  onChange={settings.setAnalyticsEnabled}
                />
              </div>
            </div>

          </section>

        </div>
      </div>
    </AppLayout>
  )
}

function ProviderInput({ provider, label, settings }: { provider: AIProvider, label: string, settings: any }) {
  const [localVal, setLocalVal] = useState(settings.aiKeys[provider] || '')
  const [isVis, setIsVis] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await settings.setAiKey(provider, localVal)
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">{label} API Key</label>
      <div className="flex bg-surface-container-low rounded-xl border border-white/10 overflow-hidden focus-within:border-primary/50 transition-colors">
        <input
          type={isVis ? 'text' : 'password'}
          value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          placeholder="sk-..."
          className="flex-1 bg-transparent px-4 py-3 outline-none text-sm text-on-surface font-mono"
        />
        <button onClick={() => setIsVis(!isVis)} className="px-4 text-neutral-500 hover:text-white border-l border-white/5">
          <span className="material-symbols-outlined text-[18px]">{isVis ? 'visibility_off' : 'visibility'}</span>
        </button>
        <GlowButton
          type="button"
          onClick={handleSave}
          disabled={isSaving || localVal === (settings.aiKeys[provider] || '')}
          compact
          variant="secondary"
          className="font-bold text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'SAVING...' : saved ? 'SAVED' : 'SAVE'}
        </GlowButton>
      </div>
      {saved && <p className="text-tertiary text-[11px] mt-1 font-medium">API key saved successfully</p>}
    </div>
  )
}
