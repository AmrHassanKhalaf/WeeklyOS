import { AppLayout } from '../components/layout/AppLayout'
import { Bot, Pin, Calendar, Palette, Bell, FileText, History, Shield, MonitorDown, Download, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { useSettingsStore, AIProvider, WeekStartDay, type SettingsState } from '../store/useSettingsStore'
import { useState, useEffect } from 'react'
import { generateWeeklyReportHTML } from '../lib/generateWeeklyReportHTML'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Section } from '../components/ui/Section'
import { useWeekStore } from '../store/useWeekStore'
import { usePinnedTaskStore } from '../store/usePinnedTaskStore'
import type { DayOfWeek, Priority, WeekData } from '../store/useWeekStore'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

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
  const { canInstall, install, isInstalled } = useInstallPrompt()
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
    <Card variant="glass" className="flex items-center justify-between gap-3 sm:gap-4 p-4 cursor-pointer touch-target" onClick={() => onChange(!checked)}>
      <div className="flex-1">
        <p className="font-bold text-on-surface text-sm">{label}</p>
        <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5 leading-snug">{desc}</p>
      </div>
      <div 
        className={`shrink-0 w-12 h-6 rounded-full p-1 transition-colors ${checked ? 'bg-primary' : 'bg-surface-variant'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </Card>
  )

  return (
    <AppLayout>
      <div className="max-w-[1280px] mx-auto container-responsive py-responsive pb-32 sm:pb-16">
        <Section variant="glass" className="mb-6 sm:mb-8 rounded-2xl border border-white/10 bg-gradient-to-br from-surface-container-low/70 to-surface-container-lowest/80 p-5 sm:p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-responsive-h1 font-extrabold tracking-tight text-on-surface mb-2">Settings</h1>
              <p className="text-sm md:text-base text-neutral-300">Configure your WeeklyOS experience, AI integrations, and privacy in one place.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest font-bold">
              <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary">Workspace</span>
              <span className="px-2.5 py-1 rounded-full bg-tertiary/15 text-tertiary">AI</span>
              <span className="px-2.5 py-1 rounded-full bg-error/15 text-error">Privacy</span>
            </div>
          </div>
        </Section>

        {/* ══ 3-Column Grid ═══════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 items-start">

          {/* ── Col 1: AI Integration + Pinned Tasks ───────────────── */}
          <div className="space-y-6">

            {/* AI Integration */}
            <Card variant="glass" className="rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-3 text-primary mb-5">
                <Bot  strokeWidth={1.5} />
                <h2 className="text-[13px] font-bold uppercase tracking-widest">AI Integration</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Primary Model</label>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Select value={localProvider}
                        onChange={e => { const p=e.target.value as AIProvider; setLocalProvider(p); if(p==='grok')setLocalModel('grok-2-mini'); if(p==='gemini')setLocalModel('gemini-1.5-flash') }}
                        className="text-sm text-on-surface">
                        <option value="gemini">Google Gemini</option>
                        <option value="grok">Grok (xAI)</option>
                      </Select>
                      <Select value={isCustom?'custom':localModel}
                        onChange={e => { if(e.target.value!=='custom')setLocalModel(e.target.value); else setLocalModel('') }}
                        className="text-sm text-on-surface text-tertiary font-medium">
                        {localProvider==='grok'&&(<><option value="grok-4">grok-4</option><option value="grok-4.1-fast">grok-4.1-fast</option><option value="grok-4-vision">grok-4-vision</option><option value="grok-code-fast-1">grok-code-fast-1</option></>)}
                        {localProvider==='gemini'&&(<><option value="gemini-flash-latest">gemini-flash-latest</option><option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option><option value="gemini-3-flash-preview">gemini-3-flash-preview</option><option value="gemini-2.5-pro">gemini-2.5-pro</option><option value="gemini-2.5-flash">gemini-2.5-flash</option><option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option><option value="gemini-live-2.5-flash-native-audio">gemini-live-audio</option></>)}
                        <option value="custom">Other (Custom...)</option>
                      </Select>
                    </div>
                    {isCustom && (
                      <Input type="text" value={localModel} onChange={e=>setLocalModel(e.target.value)}
                        placeholder={`Custom ${localProvider} model...`}
                        className="w-full text-sm font-mono focus:border-tertiary/50 transition-colors" />
                    )}
                    <div className="flex items-center gap-3">
                      <Button type="button" onClick={handleSaveModel} size="sm" variant="secondary"
                        disabled={isSavingModel||!localModel.trim()||(localProvider===settings.activeProvider&&localModel===settings.activeModel)}
                        className="text-[11px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSavingModel?'Saving...':savedModel?'Saved!':'Save Selection'}
                      </Button>
                      {savedModel&&<span className="text-tertiary text-[11px] font-medium uppercase tracking-widest">Updated</span>}
                    </div>
                  </div>
                </div>
                <div className="space-y-4 py-4 border-y border-white/10">
                  <ProviderInput provider="gemini" label="Google Gemini" settings={settings} />
                  <ProviderInput provider="grok" label="xAI Grok" settings={settings} />
                </div>
                <Toggle label="Fallback Provider" desc="Switch to another provider if the primary fails." checked={settings.fallbackEnabled} onChange={settings.setFallbackEnabled} />
              </div>
            </Card>


            {/* Pinned Tasks */}
            <Card variant="glass" className="rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-3 text-primary mb-5">
                <Pin  strokeWidth={1.5} />
                <h2 className="text-[13px] font-bold uppercase tracking-widest">Pinned Tasks</h2>
              </div>
              <div className="space-y-3">
                <p className="text-xs text-neutral-500">Pinned tasks repeat every week on your selected day/time until disabled or deleted.</p>
                <Input type="text" placeholder="Task title" value={pinnedDraft.title} onChange={e=>setPinnedDraft(p=>({...p,title:e.target.value}))} className="text-sm" />
                <Textarea rows={2} placeholder="Description (optional)" value={pinnedDraft.description} onChange={e=>setPinnedDraft(p=>({...p,description:e.target.value}))} className="text-sm resize-none" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select value={pinnedDraft.priority} onChange={e=>setPinnedDraft(p=>({...p,priority:e.target.value as Priority}))} className="text-sm">
                    <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                  </Select>
                  <Select value={pinnedDraft.dayOfWeek} onChange={e=>setPinnedDraft(p=>({...p,dayOfWeek:e.target.value as DayOfWeek}))} className="text-sm">
                    {['saturday','sunday','monday','tuesday','wednesday','thursday','friday'].map(d=><option key={d} value={d}>{d}</option>)}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="time" value={pinnedDraft.startTime} onChange={e=>setPinnedDraft(p=>({...p,startTime:e.target.value}))} className="text-sm" />
                  <Input type="time" value={pinnedDraft.endTime} onChange={e=>setPinnedDraft(p=>({...p,endTime:e.target.value}))} className="text-sm" />
                </div>
                <Input type="text" placeholder="Tags (comma separated)" value={pinnedDraft.tags} onChange={e=>setPinnedDraft(p=>({...p,tags:e.target.value}))} className="text-sm" />
                <Input type="date" value={pinnedDraft.untilDate} onChange={e=>setPinnedDraft(p=>({...p,untilDate:e.target.value}))} className="text-sm" />
                <p className="text-[11px] text-neutral-500">Leave date empty to repeat indefinitely.</p>
                <Button type="button" onClick={handleCreatePinnedTask} size="sm" variant="secondary" className="text-[11px] font-bold uppercase tracking-widest touch-target mt-2">Create Pinned Task</Button>
                <div className="space-y-2 pt-2 border-t border-white/10 max-h-64 overflow-y-auto pr-1">
                  {pinnedStore.items.length===0&&<p className="text-xs text-neutral-500">No pinned tasks yet.</p>}
                  {pinnedStore.items.map(item=>(
                    <div key={item.id} className="bg-surface-container-lowest border border-white/5 rounded-lg px-3 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold leading-tight">{item.title}</p>
                          <p className="text-[12px] text-neutral-500 mt-0.5">{item.dayOfWeek} • {item.startTime||'--:--'} – {item.endTime||'--:--'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={()=>void handleTogglePinnedTask(item.id,!item.isActive)} className={`px-2.5 py-1 rounded text-[11px] uppercase tracking-wider font-bold ${item.isActive?'bg-tertiary/15 text-tertiary':'bg-neutral-700/30 text-neutral-400'}`}>{item.isActive?'Active':'Paused'}</button>
                          <button onClick={()=>void handleDeletePinnedTask(item.id)} className="px-2.5 py-1 rounded text-[11px] uppercase tracking-wider font-bold bg-error/15 text-error">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

          </div>{/* /col1 */}


          {/* ── Col 2: Work Schedule + Appearance + Notifications ──────── */}
          <div className="space-y-6">

            {/* Work Schedule */}
            <Card variant="glass" className="rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-3 text-primary mb-5">
                <Calendar  strokeWidth={1.5} />
                <h2 className="text-[13px] font-bold uppercase tracking-widest">Work Schedule</h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Timezone</label>
                    <Select value={settings.timezone} onChange={e=>settings.setTimezone(e.target.value)} className="text-sm">
                      <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>System</option>
                      {TIMEZONE_OPTIONS.map(tz=><option key={tz} value={tz}>{tz}</option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Week Starts</label>
                    <Select value={settings.weekStartDay} onChange={e=>settings.setWeekStartDay(e.target.value as WeekStartDay)} className="text-sm">
                      {WEEK_START_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Rest Days</p>
                  <div className="flex flex-wrap gap-2">
                    {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day=>{
                      const isRest=(settings.restDays||[]).includes(day)
                      return(
                        <Button
                          key={day}
                          type="button"
                          size="sm"
                          variant={isRest ? 'secondary' : 'ghost'}
                          active={isRest}
                          onClick={()=>{const c=settings.restDays||[];settings.setRestDays(isRest?c.filter(d=>d!==day):[...c,day])}}
                          className={`uppercase tracking-wider text-[11px] font-bold ${isRest?'text-white':'text-neutral-400'}`}
                        >
                          {day.slice(0,3)}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Card>

            {/* Appearance */}
            <Card variant="glass" className="rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-3 text-tertiary mb-5">
                <Palette  strokeWidth={1.5} />
                <h2 className="text-[13px] font-bold uppercase tracking-widest">Appearance</h2>
              </div>
              <div className="flex gap-3">
                {(['dark','light','system'] as SettingsState['theme'][]).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    size="sm"
                    variant={settings.theme===t ? 'secondary' : 'ghost'}
                    active={settings.theme===t}
                    onClick={() => settings.setTheme(t)}
                    className={`flex-1 text-[12px] font-bold uppercase tracking-wider ${settings.theme===t?'':'opacity-75 hover:opacity-100'}`}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Notifications */}
            <Card variant="glass" className="rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-3 text-neutral-400 mb-5">
                <Bell  strokeWidth={1.5} />
                <h2 className="text-[13px] font-bold uppercase tracking-widest">Notifications</h2>
              </div>
              <div className="space-y-3">
                <Toggle label="Daily Reminders" desc="Get notified about your main objective every morning." checked={settings.dailyReminders} onChange={settings.setDailyReminders} />
                <Toggle label="Weekly Summary" desc="Receive a report of your week's performance." checked={settings.weeklySummaries} onChange={settings.setWeeklySummaries} />
                <Toggle label="Auto-download Report" desc="Downloads last completed week's PDF once after rollover." checked={settings.autoDownloadCompletedWeekReport} onChange={settings.setAutoDownloadCompletedWeekReport} />
              </div>
            </Card>

          </div>{/* /col2 */}


          {/* ── Col 3: Report Settings + Privacy ───────────────────────── */}
          <div className="space-y-6">

            {/* Report Settings */}
            <Card variant="glass" className="rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-3 text-tertiary mb-5">
                <FileText  strokeWidth={1.5} />
                <h2 className="text-[13px] font-bold uppercase tracking-widest">Report Settings</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Days in Report</p>
                  <div className="flex flex-wrap gap-2">
                    {['saturday','sunday','monday','tuesday','wednesday','thursday','friday'].map(day=>{
                      const included=(settings.reportIncludedDays??[]).includes(day)
                      return(
                        <Button
                          key={day}
                          type="button"
                          size="sm"
                          variant={included ? 'secondary' : 'ghost'}
                          active={included}
                          onClick={()=>{const c=settings.reportIncludedDays??[];settings.setReportIncludedDays(included?c.filter(d=>d!==day):[...c,day])}}
                          className={`uppercase tracking-wider text-[11px] font-bold ${included?'text-white':'text-neutral-500'}`}
                        >
                          {day.slice(0,3)}
                        </Button>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-2">Disabled days won't appear in the exported PDF.</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Closing Page Quote</label>
                  <Textarea rows={3}
                    placeholder="e.g. The secret of getting ahead is getting started. — Mark Twain"
                    value={settings.reportClosingQuote??''}
                    onChange={e=>settings.setReportClosingQuote(e.target.value)}
                    className="text-sm text-on-surface resize-none focus:border-tertiary/50 transition-colors" />
                  <p className="text-[11px] text-neutral-500 mt-1">Use " — Author" at the end to add an attribution.</p>
                </div>
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <Button type="button" onClick={()=>void openReportWindow()} disabled={isExporting} size="sm" variant="secondary" className="w-full text-sm font-bold disabled:opacity-50">
                    {isExporting ? <RefreshCw className="w-[18px] h-[18px] animate-spin" strokeWidth={1.5} /> : <Download className="w-[18px] h-[18px]" strokeWidth={1.5} />}
                    {isExporting?'Generating...':'Export This Week'}
                  </Button>
                  <Button type="button" onClick={()=>void handleDownloadCompletedWeek()} disabled={isExporting} size="sm" variant="ghost" className="w-full text-sm font-bold disabled:opacity-50 border border-white/10 hover:border-white/20">
                    <History className="text-[18px]" strokeWidth={1.5} />
                    Export Previous Week
                  </Button>
                </div>
              </div>
            </Card>

            {/* Privacy & Data */}
            <Card variant="glass" className="rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-3 text-error mb-5">
                <Shield  strokeWidth={1.5} />
                <h2 className="text-[13px] font-bold uppercase tracking-widest">Privacy &amp; Data</h2>
              </div>
              <Toggle label="Analytics Tracking" desc="Share anonymous usage data to help us improve." checked={settings.analyticsEnabled} onChange={settings.setAnalyticsEnabled} />
            </Card>

            {/* Install App */}
            {!isInstalled && (
              <Card variant="glass" className="rounded-2xl p-5 md:p-6">
                <div className="flex items-center gap-3 text-tertiary mb-4">
                  <MonitorDown  strokeWidth={1.5} />
                  <h2 className="text-[13px] font-bold uppercase tracking-widest">Install App</h2>
                </div>
                <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                  Install WeeklyOS as a native-like app on your device for instant launch, offline access, and a distraction-free experience.
                </p>
                {canInstall ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void install()}
                    className="w-full text-[12px] font-bold uppercase tracking-widest"
                    leftIcon={<Download className="text-[16px]" strokeWidth={1.5} />}
                  >
                    Install WeeklyOS
                  </Button>
                ) : (
                  <p className="text-[11px] text-neutral-500">
                    Your browser doesn't support installation prompts, or WeeklyOS is already installed.
                  </p>
                )}
              </Card>
            )}

          </div>{/* /col3 */}

        </div>{/* /3-col grid */}
      </div>
    </AppLayout>
  )
}
function ProviderInput({ provider, label, settings }: { provider: AIProvider; label: string; settings: SettingsState }) {
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
        <Input
          type={isVis ? 'text' : 'password'}
          value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          placeholder="sk-..."
          className="flex-1 bg-transparent border-0 px-4 py-3 outline-none text-sm text-on-surface font-mono"
        />
        <button onClick={() => setIsVis(!isVis)} className="px-4 text-neutral-500 hover:text-white border-l border-white/5">
          {isVis ? <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Eye className="w-[18px] h-[18px]" strokeWidth={1.5} />}
        </button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving || localVal === (settings.aiKeys[provider] || '')}
          size="sm"
          variant="secondary"
          className="rounded-none rounded-r-xl font-bold text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'SAVING...' : saved ? 'SAVED' : 'SAVE'}
        </Button>
      </div>
      {saved && <p className="text-tertiary text-[11px] mt-1 font-medium">API key saved successfully</p>}
    </div>
  )
}
