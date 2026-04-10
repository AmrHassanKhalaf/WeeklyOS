import { AppLayout } from '../components/layout/AppLayout'
import { DayCard } from '../components/DayCard'
import { useWeekStore } from '../store/useWeekStore'
import { useAiApi } from '../hooks/useApi'
import { useState } from 'react'

import { useSettingsStore } from '../store/useSettingsStore'
import BorderGlow from '../components/effects/BorderGlow'
import { GlowButton } from '../components/effects/GlowButton'
import { WeeklyChallengeCircles } from '../components/WeeklyChallengeCircles'

function LoadingCard() {
  return (
    <div className="rounded-xl bg-surface-container-low border border-white/5 h-32 animate-pulse" />
  )
}

export function Dashboard() {
  const { currentWeek, isLoadingWeek, deleteWeekData, toggleChallengeComplete, updateChallengeProgress } = useWeekStore()
  const { restDays } = useSettingsStore()
  const { sendMessage } = useAiApi()
  const [insight, setInsight] = useState<string>('')
  const [isInsightLoading, setIsInsightLoading] = useState(false)
  const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false)
  const [isEditingChallenge, setIsEditingChallenge] = useState(false)
  const [manualChallenge, setManualChallenge] = useState('')
  const [aiError, setAiError] = useState<string | null>(null)

  const generateChallenge = async () => {
    if (!currentWeek || isGeneratingChallenge) return
    setIsGeneratingChallenge(true)
    setAiError(null)
    try {
      const pendingTasks = currentWeek.days.flatMap(d => [d.highTask, ...d.mediumTasks, ...d.smallTasks])
        .filter(t => t?.status === 'pending')
        .map(t => t?.title)
        .join(', ')
      
      const res = await sendMessage('challenge', '', { tasks: pendingTasks })
      // Expected response format: 2 lines
      const parts = res.response.split('\n').filter((s: string) => s.trim())
      const title = parts[0]?.replace(/^1\.\s*/, '').replace(/\*+/g, '') || 'Clear the Backlog'
      const desc = parts[1]?.replace(/^2\.\s*/, '').replace(/\*+/g, '') || 'Finish all your pending tasks before your rest days.'
      
      await useWeekStore.getState().updateChallenge(title, desc)
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : 'Failed to generate challenge')
    } finally {
      setIsGeneratingChallenge(false)
    }
  }

  const fetchInsight = async () => {
    if (!currentWeek || isInsightLoading) return
    setIsInsightLoading(true)
    setAiError(null)
    const context = { title: currentWeek.title, score: currentWeek.score, completed: currentWeek.totalCompleted, planned: currentWeek.totalPlanned }
    try {
      const res = await sendMessage('insight', 'Give me a very short 2-sentence encouraging insight about my productivity this week based on the context data. Do not use quotes.', context)
      setInsight(res.response)
    } catch {
      setInsight("You're on track. Batch your remaining tasks to clear your schedule.")
    } finally {
      setIsInsightLoading(false)
    }
  }

  const deepWorkData = currentWeek ? currentWeek.days.map(d => {
    let completedCount = 0
    if (d.highTask?.status === 'done') completedCount++
    completedCount += d.mediumTasks.filter(t => t.status === 'done').length
    completedCount += d.smallTasks.filter(t => t.status === 'done').length

    return {
      day: d.shortName.charAt(0),
      height: Math.min(160, 24 + (completedCount * 32)),
      isToday: !!d.isToday
    }
  }) : []

  if (isLoadingWeek || !currentWeek) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-8 space-y-8">
          <div className="h-20 bg-surface-container-low rounded-xl animate-pulse" />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      </AppLayout>
    )
  }


  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-8 space-y-12">
        {/* AI Error Banner */}
        {aiError && (
          <div className="flex items-center gap-3 bg-error/10 border border-error/20 rounded-xl px-5 py-3">
            <span className="material-symbols-outlined text-error text-xl shrink-0">error</span>
            <p className="text-sm text-error flex-1">{aiError}</p>
            <button
              onClick={() => setAiError(null)}
              className="text-error/60 hover:text-error transition-colors"
              aria-label="Dismiss error"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        )}
        {/* Hero Stats */}
        <section className="flex justify-between items-end gap-8">
          <div className="flex-1">
            <h2 className="text-4xl font-extrabold tracking-tight mb-2">{currentWeek.title}</h2>
            <p className="text-on-surface-variant max-w-lg">
              {currentWeek.dateRange}. Week {currentWeek.weekNumber} status: Optimal. Strategic objectives are pacing 12% ahead of quarterly projections.
            </p>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Week Score</p>
              <p className="text-3xl font-mono font-bold text-tertiary">{currentWeek.score}/100</p>
            </div>
            <div className="w-px h-10 bg-surface-variant" />
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Completed</p>
              <p className="text-3xl font-mono font-bold text-primary">{currentWeek.totalCompleted}/{currentWeek.totalPlanned}</p>
            </div>
            <div className="w-px h-10 bg-surface-variant" />
            <button 
              onClick={() => {
                if (confirm('Are you sure you want to clear ALL data for this week? this includes all tasks and notes.')) {
                  deleteWeekData()
                }
              }}
              className="p-3 text-on-surface-variant hover:text-error transition-colors rounded-xl hover:bg-error/5 group"
              title="Clear Entire Week Data"
            >
              <span className="material-symbols-outlined text-2xl group-active:scale-95 transition-transform">delete_forever</span>
            </button>
          </div>
        </section>

        {/* Weekly Challenge */}
        {currentWeek.challengeTitle && !isEditingChallenge ? (
          <BorderGlow edgeSensitivity={30} glowColor="40 80 80" backgroundColor="#0d0d0d" borderRadius={14} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']}>
          <section>
            <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-primary">emoji_events</span>
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Weekly Challenge</span>
                    <span className="w-1 h-1 rounded-full bg-primary/40" />
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                      Ends in {currentWeek.challengeEndsIn}
                    </span>
                    <button 
                      onClick={() => { setManualChallenge(currentWeek.challengeTitle || ''); setIsEditingChallenge(true); }}
                      className="ml-2 text-primary hover:text-white transition-colors flex items-center justify-center w-5 h-5 rounded-full hover:bg-white/10"
                      title="Edit Challenge"
                    >
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                    </button>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface">{currentWeek.challengeTitle}</h3>
                  {currentWeek.challengeDescription && (
                    <p className="text-sm text-on-surface-variant mt-2 max-w-xl">{currentWeek.challengeDescription}</p>
                  )}
                </div>
                <div className="w-full md:w-64 space-y-2 shrink-0">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-primary">
                    <div className="flex items-center gap-4">
                      <span>Progress</span>
                      <div className="flex items-center gap-2 group cursor-pointer" onClick={() => toggleChallengeComplete()}>
                        <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${currentWeek.challengeCompleted ? 'bg-primary border-primary text-background' : 'border-primary/40 hover:border-primary'}`}>
                          {currentWeek.challengeCompleted && <span className="material-symbols-outlined text-[10px] font-bold">check</span>}
                        </div>
                        <span className={currentWeek.challengeCompleted ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary transition-colors'}>
                          {currentWeek.challengeCompleted ? 'DONE FOR TODAY' : 'NOT DONE TODAY'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 ml-4">
                      <button 
                        onClick={() => updateChallengeProgress((currentWeek.challengeProgress || 0) - 5)}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xs">remove</span>
                      </button>
                      <button 
                        onClick={() => updateChallengeProgress((currentWeek.challengeProgress || 0) + 5)}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xs">add</span>
                      </button>
                    </div>
                    <span>{currentWeek.challengeProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${currentWeek.challengeProgress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </section>
          </BorderGlow>
        ) : (
          <BorderGlow edgeSensitivity={30} glowColor="40 80 80" backgroundColor="#0d0d0d" borderRadius={14} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']}>
          <section>
            <div className="bg-surface-container-low rounded-xl border border-dashed border-white/20 p-6 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl text-primary">psychology</span>
                <div>
                  <h3 className="text-on-surface font-bold text-lg">Define Weekly Challenge</h3>
                  <p className="text-sm text-on-surface-variant">Set a goal manually or let AI generate one based on your pending tasks.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  value={manualChallenge}
                  onChange={e => setManualChallenge(e.target.value)}
                  placeholder="E.g., Clear the backlog or Focus on Priority Project X..."
                  className="bg-surface-container-highest border border-white/10 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-primary/50 focus:outline-none w-full"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && manualChallenge.trim()) {
                      useWeekStore.getState().updateChallenge(manualChallenge.trim(), '')
                      setIsEditingChallenge(false)
                    }
                  }}
                />
                <div className="flex flex-wrap gap-3 items-center">
                  <button 
                    onClick={() => {
                      if (manualChallenge.trim()) {
                        useWeekStore.getState().updateChallenge(manualChallenge.trim(), '')
                        setIsEditingChallenge(false)
                      }
                    }}
                    disabled={!manualChallenge.trim()}
                    className="bg-surface-container-highest hover:bg-surface-variant text-on-surface font-bold px-6 py-2 rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    Save Manual Challenge
                  </button>
                  <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">OR</span>
                  <button 
                    onClick={async () => {
                      await generateChallenge()
                      setIsEditingChallenge(false)
                    }} 
                    disabled={isGeneratingChallenge}
                    className="bg-primary/10 text-primary font-bold px-6 py-2 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    {isGeneratingChallenge ? 'Generating...' : 'Auto-Generate via AI'}
                  </button>
                  {isEditingChallenge && currentWeek.challengeTitle && (
                    <button 
                      onClick={() => setIsEditingChallenge(false)} 
                      className="ml-auto text-neutral-500 hover:text-white text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
          </BorderGlow>
        )}

        {/* 7-Day Challenge Circles */}
        {currentWeek.challengeTitle && (
          <BorderGlow edgeSensitivity={30} glowColor="40 80 80" backgroundColor="#0d0d0d" borderRadius={14} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']}>
          <section className="bg-primary/5 rounded-xl border border-primary/20 p-6">
            <WeeklyChallengeCircles />
          </section>
          </BorderGlow>
        )}

        {/* Day Cards */}
        <section className="space-y-6">
          {currentWeek.days.map((dayData) => (
            <BorderGlow key={dayData.day} edgeSensitivity={28} glowColor="40 80 80" backgroundColor="#0d0d0d" borderRadius={14} glowRadius={36} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']}>
              <DayCard 
                day={{
                  ...dayData, 
                  isRestDay: (restDays || []).includes(dayData.day)
                }} 
              />
            </BorderGlow>
          ))}
        </section>

        {/* Bottom Stats */}
        <section className="grid grid-cols-3 gap-8 pb-12">
          <BorderGlow edgeSensitivity={30} glowColor="40 80 80" backgroundColor="#0d0d0d" borderRadius={14} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']} className="col-span-2">
          <div className="col-span-2 bg-surface-container-low rounded-xl p-8 border border-white/5">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold">Deep Work Distribution</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-xs text-on-surface-variant">Focus</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-tertiary" /><span className="text-xs text-on-surface-variant">Admin</span></div>
              </div>
            </div>
            <div className="h-48 flex items-end justify-between gap-4 px-4">
              {deepWorkData.map((d, i) => (
                <div key={i} className="flex-1 space-y-2 group">
                  <div className="w-full bg-primary/30 rounded-sm" style={{ height: d.height }} />
                  <p className={`text-center text-[10px] font-bold ${d.isToday ? 'text-primary' : 'text-on-surface-variant'}`}>{d.day}</p>
                </div>
              ))}
            </div>
          </div>
          </BorderGlow>
          <BorderGlow edgeSensitivity={30} glowColor="40 80 80" backgroundColor="#0d0d0d" borderRadius={14} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']}>
          <div className="bg-tertiary-container text-on-tertiary-container rounded-xl p-8 relative overflow-hidden flex flex-col">
            <span className="material-symbols-outlined absolute top-[-20px] right-[-20px] text-9xl opacity-10 rotate-12">bolt</span>
            <h3 className="text-xl font-bold mb-4">Focus Mode</h3>
            <p className="text-sm opacity-90 mb-8 leading-relaxed">
              {isInsightLoading ? 'Analyzing week data...' : (insight || "You're on track. Batch your remaining tasks to clear your schedule.")}
            </p>
            <div className="mt-auto">
              <GlowButton
                type="button"
                onClick={fetchInsight}
                disabled={isInsightLoading}
                variant="secondary"
                className="w-full text-tertiary-container py-3 text-sm disabled:opacity-50"
              >
                {isInsightLoading ? 'Generating...' : 'Analyze My Week'}
              </GlowButton>
            </div>
          </div>
          </BorderGlow>
        </section>
      </div>
    </AppLayout>
  )
}
