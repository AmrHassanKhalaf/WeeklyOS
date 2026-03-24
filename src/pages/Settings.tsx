import { AppLayout } from '../components/layout/AppLayout'
import { useSettingsStore, AIProvider } from '../store/useSettingsStore'
import { useState, useRef, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { WeeklyReportPrintView } from '../components/WeeklyReportPrintView'

export function Settings() {
  const settings = useSettingsStore()
  const [isExporting, setIsExporting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // Local state for Model Selection
  const [localProvider, setLocalProvider] = useState<AIProvider>(settings.activeProvider)
  const [localModel, setLocalModel] = useState<string>(settings.activeModel)
  const [isSavingModel, setIsSavingModel] = useState(false)
  const [savedModel, setSavedModel] = useState(false)

  // Sync local state when store loads
  useEffect(() => {
    setLocalProvider(settings.activeProvider)
    setLocalModel(settings.activeModel)
  }, [settings.activeProvider, settings.activeModel])

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

  const handleExport = async () => {
    if (!printRef.current || isExporting) return
    try {
      setIsExporting(true)
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#131313'
      })
      const imgData = canvas.toDataURL('image/png')
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      // If height is larger than 1 page, jsPDF handles it if we don't care about page breaks on perfectly formatted reports,
      // but usually scaling to width is enough for a cohesive report snapshot.
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()))
      pdf.save('weekly_os_report.pdf')
    } catch (e) {
      console.error('Export failed:', e)
    } finally {
      setIsExporting(false)
    }
  }

  const Toggle = ({ label, desc, checked, onChange }: { label: string, desc: string, checked: boolean, onChange: (c: boolean) => void }) => (
    <div className="flex items-center justify-between p-4 bg-surface-container-none rounded-xl border border-white/5">
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
      <div className="max-w-[800px] mx-auto px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface mb-2">Settings</h1>
          <p className="text-neutral-500">Configure your WeeklyOS experience, AI integrations, and privacy.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-white/5 pt-12">
          
          {/* AI Settings */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 text-primary mb-6">
              <span className="material-symbols-outlined">smart_toy</span>
              <h2 className="text-sm font-bold uppercase tracking-widest">AI Integration</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Primary Model Selection</label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-4">
                    <select 
                      value={localProvider}
                      onChange={e => {
                        const p = e.target.value as AIProvider;
                        setLocalProvider(p)
                        if (p === 'grok') setLocalModel('grok-2-mini')
                        if (p === 'gemini') setLocalModel('gemini-1.5-flash')
                      }}
                      className="flex-1 bg-surface-container-low px-4 py-3 rounded-xl border border-white/5 outline-none text-sm text-on-surface"
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
                      className="flex-1 bg-surface-container-low px-4 py-3 rounded-xl border border-white/5 outline-none text-sm text-on-surface text-tertiary font-medium"
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
                    <button 
                      onClick={handleSaveModel}
                      disabled={isSavingModel || (!localModel.trim()) || (localProvider === settings.activeProvider && localModel === settings.activeModel)}
                      className="px-6 py-2.5 rounded-lg font-bold text-xs bg-tertiary/10 text-tertiary hover:bg-tertiary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors tracking-widest uppercase"
                    >
                      {isSavingModel ? 'Saving...' : savedModel ? 'Saved!' : 'Save Model Selection'}
                    </button>
                    {savedModel && <span className="text-tertiary text-[10px] font-medium uppercase tracking-widest">Successfully updated</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-4 py-4 border-y border-white/5">
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
          </section>

          {/* General & Privacy */}
          <section className="space-y-12">
            
            {/* UI Settings */}
            <div>
              <div className="flex items-center gap-3 text-tertiary mb-6">
                <span className="material-symbols-outlined">palette</span>
                <h2 className="text-sm font-bold uppercase tracking-widest">Appearance</h2>
              </div>
              <div className="flex gap-4">
                {['dark', 'light', 'system'].map(t => (
                  <button 
                    key={t}
                    onClick={() => settings.setTheme(t as any)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors border ${
                      settings.theme === t 
                        ? 'bg-tertiary/20 text-tertiary border-tertiary/30' 
                        : 'bg-surface-container-low text-neutral-500 border-transparent hover:bg-surface-container-high'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div>
              <div className="flex items-center gap-3 text-neutral-400 mb-6">
                <span className="material-symbols-outlined">notifications</span>
                <h2 className="text-sm font-bold uppercase tracking-widest">Notifications</h2>
              </div>
              <div className="space-y-2">
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
              </div>
            </div>

            {/* Privacy & Data */}
            <div>
              <div className="flex items-center gap-3 text-error mb-6">
                <span className="material-symbols-outlined">security</span>
                <h2 className="text-sm font-bold uppercase tracking-widest">Privacy & Data</h2>
              </div>
              <div className="space-y-2 mb-6">
                <Toggle 
                  label="Analytics Tracking" 
                  desc="Share anonymous usage data to help us improve."
                  checked={settings.analyticsEnabled}
                  onChange={settings.setAnalyticsEnabled}
                />
              </div>
              
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-white/10 text-neutral-400 font-bold text-sm hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isExporting ? 'hourglass_empty' : 'download'}
                </span>
                {isExporting ? 'Generating Image...' : 'Export Weekly Report'}
              </button>
            </div>

          </section>

        </div>
      </div>
      <WeeklyReportPrintView ref={printRef} />
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
      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">{label} API Key</label>
      <div className="flex bg-surface-container-low rounded-xl border border-white/5 overflow-hidden focus-within:border-primary/50 transition-colors">
        <input
          type={isVis ? "text" : "password"}
          value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          placeholder="sk-..."
          className="flex-1 bg-transparent px-4 py-3 outline-none text-sm text-on-surface font-mono"
        />
        <button onClick={() => setIsVis(!isVis)} className="px-4 text-neutral-500 hover:text-white border-l border-white/5">
          <span className="material-symbols-outlined text-[18px]">{isVis ? 'visibility_off' : 'visibility'}</span>
        </button>
        <button onClick={handleSave} disabled={isSaving || localVal === (settings.aiKeys[provider] || '')} className="px-4 font-bold text-xs bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {isSaving ? 'SAVING...' : saved ? 'SAVED' : 'SAVE'}
        </button>
      </div>
      {saved && <p className="text-tertiary text-[10px] mt-1 font-medium">API key saved successfully</p>}
    </div>
  )
}
