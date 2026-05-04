import { AppLayout } from '../components/layout/AppLayout'
import { DayCard } from '../components/DayCard'
import { useWeekStore } from '../store/useWeekStore'
import { useAiApi } from '../hooks/useApi'
import { lazy, Suspense, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import { useSettingsStore } from '../store/useSettingsStore'
import BorderGlow from '../components/effects/BorderGlow'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Section } from '../components/ui/Section'
import { Skeleton } from '../components/ui/Skeleton'
import { WeeklyChallengeCircles } from '../components/WeeklyChallengeCircles'

const loadRotatingText = () => import('../components/effects/RotatingText')
const RotatingText = lazy(loadRotatingText)

function LoadingCard() {
  return <Skeleton className="h-32 border border-outline-variant/10" />
}

export function Dashboard() {
  const { currentWeek, weekSummary, isLoadingTasks, isLoadingWeek, deleteWeekData } = useWeekStore()
  const { restDays } = useSettingsStore()
  const { sendMessage } = useAiApi()
  const [insight, setInsight] = useState<string>('')
  const [isInsightLoading, setIsInsightLoading] = useState(false)
  const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false)
  const [isEditingChallenge, setIsEditingChallenge] = useState(false)
  const [manualChallenge, setManualChallenge] = useState('')
  const [aiError, setAiError] = useState<string | null>(null)
  const [isMotionReady, setIsMotionReady] = useState(false)

  useEffect(() => {
    let idleId: number | null = null
    const warm = () => {
      void loadRotatingText()
      setIsMotionReady(true)
    }
    if (window.requestIdleCallback) {
      idleId = window.requestIdleCallback(warm, { timeout: 1500 }) as unknown as number
    } else {
      idleId = window.setTimeout(warm, 800)
    }
    return () => {
      if (idleId === null) return
      if (window.cancelIdleCallback) {
        window.cancelIdleCallback(idleId)
      } else {
        window.clearTimeout(idleId)
      }
    }
  }, [])

  const summary = weekSummary ?? currentWeek
  const hasSummary = !!summary
  const tasksReady = !!currentWeek && !isLoadingTasks
  const challengeTitle = currentWeek?.challengeTitle ?? summary?.challengeTitle

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

  const deepWorkData = tasksReady ? currentWeek.days.map(d => {
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

  if (!hasSummary && isLoadingWeek) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-8 space-y-8">
          <Skeleton className="h-20" />
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
            {hasSummary ? (
              <>
                <h2 className="text-4xl font-extrabold tracking-tight mb-2">{summary.title}</h2>
                <p className="text-on-surface-variant max-w-lg">
                  {summary.dateRange}. Week {summary.weekNumber} status: Optimal. Strategic objectives are pacing 12% ahead of quarterly projections.
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Week Score</p>
              {hasSummary ? (
                <motion.p
                  key={summary.score}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 260 }}
                  className="text-3xl font-mono font-bold text-tertiary"
                >
                  {summary.score}/100
                </motion.p>
              ) : (
                <Skeleton className="h-8 w-16" />
              )}
            </div>
            <div className="w-px h-10 bg-surface-variant" />
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Completed</p>
              {tasksReady ? (
                <motion.p
                  key={`${currentWeek.totalCompleted}-${currentWeek.totalPlanned}`}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 260 }}
                  className="text-3xl font-mono font-bold text-primary"
                >
                  {currentWeek.totalCompleted}/{currentWeek.totalPlanned}
                </motion.p>
              ) : (
                <Skeleton className="h-8 w-20" />
              )}
            </div>
            <div className="w-px h-10 bg-surface-variant" />
            <button 
              onClick={() => {
                if (confirm('Are you sure you want to clear ALL data for this week? this includes all tasks and notes.')) {
                  deleteWeekData()
                }
              }}
              disabled={!tasksReady}
              className="p-3 text-on-surface-variant hover:text-error transition-colors rounded-xl hover:bg-error/5 group disabled:opacity-40 disabled:cursor-not-allowed"
              title="Clear Entire Week Data"
            >
              <span className="material-symbols-outlined text-2xl group-active:scale-95 transition-transform">delete_forever</span>
            </button>
          </div>
        </section>

        {!tasksReady ? (
          <div className="space-y-6">
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </div>
        ) : (
          <>

        {/* Weekly Challenge - Unified */}
        {challengeTitle && !isEditingChallenge ? (
          <BorderGlow edgeSensitivity={30} glowColor="40 80 80" backgroundColor="#0d0d0d" borderRadius={14} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']}>
          <Section variant="glass" className="border border-primary/20 bg-primary/5 relative overflow-hidden space-y-6">
              {/* Header Section */}
              <div className="relative z-10 flex flex-col gap-6">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-6xl text-primary">emoji_events</span>
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Weekly Challenge</span>
                    <span className="w-1 h-1 rounded-full bg-primary/40" />
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
                      Fri -&gt; Thu
                    </span>
                    <button 
                      onClick={() => { setManualChallenge(challengeTitle || ''); setIsEditingChallenge(true); }}
                      className="ml-2 text-primary hover:text-white transition-colors flex items-center justify-center w-5 h-5 rounded-full hover:bg-white/10"
                      title="Edit Challenge"
                    >
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                    </button>
                  </div>
                  {isMotionReady ? (
                    <Suspense fallback={<h3 className="text-[2rem] font-black tracking-tight text-white [text-shadow:0_0_14px_rgba(159,179,255,0.45)]">{challengeTitle}</h3>}>
                      <RotatingText
                        texts={[challengeTitle]}
                        auto={false}
                        splitBy="characters"
                        staggerFrom="last"
                        staggerDuration={0.012}
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '-120%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 380 }}
                        mainClassName="text-[2rem] font-black tracking-tight"
                        splitLevelClassName="overflow-hidden pb-1"
                        elementLevelClassName="inline-block text-white [text-shadow:0_0_14px_rgba(159,179,255,0.45)]"
                      />
                    </Suspense>
                  ) : (
                    <h3 className="text-[2rem] font-black tracking-tight text-white [text-shadow:0_0_14px_rgba(159,179,255,0.45)]">{challengeTitle}</h3>
                  )}
                </div>
              </div>

              {/* 7-Day Challenge Circles */}
              <div className="border-t border-white/5 pt-6">
                <WeeklyChallengeCircles />
              </div>

          </Section>
          </BorderGlow>
        ) : (
          <BorderGlow edgeSensitivity={30} glowColor="40 80 80" backgroundColor="#0d0d0d" borderRadius={14} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']}>
          <Section variant="glass" className="border border-dashed border-white/20 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl text-primary">psychology</span>
                <div>
                  <h3 className="text-on-surface font-bold text-lg">Define Weekly Challenge</h3>
                  <p className="text-sm text-on-surface-variant">Set a goal manually or let AI generate one based on your pending tasks.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Input
                  type="text"
                  value={manualChallenge}
                  onChange={e => setManualChallenge(e.target.value)}
                  placeholder="E.g., Clear the backlog or Focus on Priority Project X..."
                  className="text-sm"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && manualChallenge.trim()) {
                      useWeekStore.getState().updateChallenge(manualChallenge.trim(), '')
                      setIsEditingChallenge(false)
                    }
                  }}
                />
                <div className="flex flex-wrap gap-3 items-center">
                  <Button
                    onClick={() => {
                      if (manualChallenge.trim()) {
                        useWeekStore.getState().updateChallenge(manualChallenge.trim(), '')
                        setIsEditingChallenge(false)
                      }
                    }}
                    disabled={!manualChallenge.trim()}
                    variant="secondary"
                    size="sm"
                    className="text-sm font-semibold disabled:opacity-50"
                  >
                    Save Manual Challenge
                  </Button>
                  <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">OR</span>
                  <Button
                    onClick={async () => {
                      await generateChallenge()
                      setIsEditingChallenge(false)
                    }} 
                    disabled={isGeneratingChallenge}
                    variant="primary"
                    size="sm"
                    className="text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    {isGeneratingChallenge ? 'Generating...' : 'Auto-Generate via AI'}
                  </Button>
                  {isEditingChallenge && currentWeek.challengeTitle && (
                    <Button
                      onClick={() => setIsEditingChallenge(false)} 
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-sm"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
          </Section>
          </BorderGlow>
        )}

        {/* Day Cards */}
        <section className="space-y-6">
          {currentWeek.days.map((dayData, i) => (
            <motion.div
              key={dayData.day}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.04 + i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <BorderGlow edgeSensitivity={28} glowColor="40 80 80" backgroundColor="#0d0d0d" borderRadius={14} glowRadius={36} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']}>
                <DayCard
                  day={{
                    ...dayData,
                    isRestDay: (restDays || []).includes(dayData.day),
                  }}
                />
              </BorderGlow>
            </motion.div>
          ))}
        </section>

        {/* Bottom Stats */}
        <section className="grid grid-cols-3 gap-8 pb-12">
          <BorderGlow edgeSensitivity={30} glowColor="40 80 80" backgroundColor="#0d0d0d" borderRadius={14} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']} className="col-span-2">
          <Card variant="glass" className="col-span-2 p-8">
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
          </Card>
          </BorderGlow>
          <BorderGlow edgeSensitivity={30} glowColor="40 80 80" backgroundColor="#0d0d0d" borderRadius={14} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']}>
          <Card variant="glass" className="bg-tertiary-container text-on-tertiary-container p-8 relative overflow-hidden flex flex-col">
            <span className="material-symbols-outlined absolute top-[-20px] right-[-20px] text-9xl opacity-10 rotate-12">bolt</span>
            <h3 className="text-xl font-bold mb-4">Focus Mode</h3>
            <p className="text-sm opacity-90 mb-8 leading-relaxed">
              {isInsightLoading ? 'Analyzing week data...' : (insight || "You're on track. Batch your remaining tasks to clear your schedule.")}
            </p>
            <div className="mt-auto">
              <Button
                type="button"
                onClick={fetchInsight}
                disabled={isInsightLoading}
                variant="secondary"
                className="w-full text-tertiary-container border-tertiary/30 bg-tertiary/15 hover:bg-tertiary/25 py-3 text-sm disabled:opacity-50"
              >
                {isInsightLoading ? 'Generating...' : 'Analyze My Week'}
              </Button>
            </div>
          </Card>
          </BorderGlow>
        </section>
        </>
        )}
      </div>
    </AppLayout>
  )
}
