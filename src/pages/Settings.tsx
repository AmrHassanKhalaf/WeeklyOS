import { AppLayout } from '../components/layout/AppLayout'
import { useSettingsStore, AIProvider } from '../store/useSettingsStore'
import { useState } from 'react'

export function Settings() {
  const settings = useSettingsStore()
  const [keysVis, setKeysVis] = useState<Record<string, boolean>>({})

  const toggleKeyVis = (prov: string) => setKeysVis(p => ({ ...p, [prov]: !p[prov] }))

  const ProviderInput = ({ provider, label }: { provider: AIProvider, label: string }) => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">{label} API Key</label>
      <div className="flex bg-surface-container-low rounded-xl border border-white/5 overflow-hidden focus-within:border-primary/50 transition-colors">
        <input
          type={keysVis[provider] ? "text" : "password"}
          value={settings.aiKeys[provider] || ''}
          onChange={e => settings.setAiKey(provider, e.target.value)}
          placeholder={`sk-...`}
          className="flex-1 bg-transparent px-4 py-3 outline-none text-sm text-on-surface font-mono"
        />
        <button onClick={() => toggleKeyVis(provider)} className="px-4 text-neutral-500 hover:text-white">
          <span className="material-symbols-outlined text-[18px]">{keysVis[provider] ? 'visibility_off' : 'visibility'}</span>
        </button>
      </div>
    </div>
  )

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
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Primary Provider</label>
                <select 
                  value={settings.activeProvider}
                  onChange={e => settings.setActiveProvider(e.target.value as AIProvider)}
                  className="w-full bg-surface-container-low px-4 py-3 rounded-xl border border-white/5 outline-none text-sm text-on-surface"
                >
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="grok">Grok (xAI)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                </select>
              </div>

              <div className="space-y-4 py-4 border-y border-white/5">
                <ProviderInput provider="openai" label="OpenAI" />
                <ProviderInput provider="gemini" label="Google Gemini" />
                <ProviderInput provider="grok" label="xAI Grok" />
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
                onClick={settings.exportWeeklyReport}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-white/10 text-neutral-400 font-bold text-sm hover:text-white hover:border-white/30 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export All Weekly Data
              </button>
            </div>

          </section>

        </div>
      </div>
    </AppLayout>
  )
}
