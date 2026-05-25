import { AppLayout } from '../components/layout/AppLayout'
import { DayCard } from '../components/DayCard'
import { useWeekStore } from '../store/useWeekStore'
import { useAiApi } from '../hooks/useApi'
import { lazy, Suspense, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  AlertCircle, 
  X, 
  Trash2, 
  Trophy, 
  Pencil, 
  Brain, 
  Sparkles, 
  Zap, 
  LineChart 
} from 'lucide-react'

import { useSettingsStore } from '../store/useSettingsStore'
import BorderGlow from '../components/effects/BorderGlow'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Section } from '../components/ui/Section'
import { Skeleton } from '../components/ui/Skeleton'
import { WeeklyChallengeCircles } from '../components/WeeklyChallengeCircles'
import { cn } from '../lib/cn'

const loadRotatingText = () => import('../components/effects/RotatingText')
const RotatingText = lazy(loadRotatingText)

function LoadingCard() {
  return <Skeleton className="h-32 border border-outline-variant/10" />
}

export function Dashboard() {
  const currentWeek = useWeekStore((state) => state.currentWeek)
  const weekSummary = useWeekStore((state) => state.weekSummary)
  const isLoadingTasks = useWeekStore((state) => state.isLoadingTasks)
  const isLoadingWeek = useWeekStore((state) => state.isLoadingWeek)
  const deleteWeekData = useWeekStore((state) => state.deleteWeekData)
  const restDays = useSettingsStore((state) => state.restDays)
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
        <div className="container-responsive py-responsive mx-auto max-w-4xl space-y-8">
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
      <div className="container-responsive py-responsive mx-auto max-w-4xl space-y-8 sm:space-y-12">
        {/* AI Error Banner */}
        {aiError && (
          <div className="flex items-center gap-3 bg-error/10 border border-error/20 rounded-xl px-5 py-3">
            <AlertCircle className="w-5 h-5 text-error shrink-0" />
            <p className="text-sm text-error flex-1">{aiError}</p>
            <button
              onClick={() => setAiError(null)}
              className="text-error/60 hover:text-error transition-colors"
              aria-label="Dismiss error"
            >
              <X className="w-[18px] h-[18px]" strokeWidth={2} />
            </button>
          </div>
        )}
        {/* Hero Stats */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-8">
          <div className="flex-1">
            {hasSummary ? (
              <>
                <p className="text-[10px] uppercase tracking-[0.28em] text-primary/80 font-extrabold mb-2 flex items-center gap-2">
                  <span className="inline-block w-6 h-px bg-primary/60" />
                  Week {summary.weekNumber}
                </p>
                <h2 className="text-responsive-h1 font-bold tracking-tight mb-3 gradient-text">{summary.title}</h2>
                <p className="text-on-surface-variant/90 text-sm max-w-lg leading-relaxed">
                  {summary.dateRange}. Status: Optimal. Strategic objectives are pacing 12% ahead of quarterly projections.
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-10 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            )}
          </div>
          <div className="flex flex-row items-center gap-4 sm:gap-6 shrink-0 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 font-medium">Week Score</p>
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
            <div className="w-px h-10 bg-surface-variant/50" />
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 font-medium">Completed</p>
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
            <div className="w-px h-10 bg-surface-variant/50" />
            <button 
              onClick={() => {
                if (confirm('Are you sure you want to clear ALL data for this week? this includes all tasks and notes.')) {
                  deleteWeekData()
                }
              }}
              disabled={!tasksReady}
              className="p-3 text-neutral-500 hover:text-error transition-colors rounded-xl hover:bg-error/5 group disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
              title="Clear Entire Week Data"
            >
              <Trash2 className="w-5 h-5 group-active:scale-95 transition-transform" strokeWidth={1.5} />
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
          <BorderGlow edgeSensitivity={30} glowColor="40 80 80" backgroundColor="transparent" borderRadius={14} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']}>
          <Section variant="glass" className="border border-primary/20 bg-primary/5 relative overflow-hidden space-y-6">
              {/* Header Section */}
              <div className="relative z-10 flex flex-col gap-6">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Trophy className="w-16 h-16 text-primary" strokeWidth={1} />
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
                      className="ml-2 text-primary hover:text-white transition-colors flex items-center justify-center w-6 h-6 rounded-md hover:bg-white/10"
                      title="Edit Challenge"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>
                  {isMotionReady ? (
                    <Suspense fallback={<h3 className="text-2xl sm:text-[2rem] font-black tracking-tight text-white [text-shadow:0_0_14px_rgba(159,179,255,0.45)]">{challengeTitle}</h3>}>
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
                        mainClassName="text-2xl sm:text-[2rem] font-black tracking-tight"
                        splitLevelClassName="overflow-hidden pb-1"
                        elementLevelClassName="inline-block text-white [text-shadow:0_0_14px_rgba(159,179,255,0.45)]"
                      />
                    </Suspense>
                  ) : (
                    <h3 className="text-2xl sm:text-[2rem] font-black tracking-tight text-white [text-shadow:0_0_14px_rgba(159,179,255,0.45)]">{challengeTitle}</h3>
                  )}
                </div>
              </div>

              {/* 7-Day Challenge Circles */}
              <div className="border-t border-white/5 pt-6 overflow-x-auto hide-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0">
                <WeeklyChallengeCircles />
              </div>

          </Section>
          </BorderGlow>
        ) : (
          <BorderGlow edgeSensitivity={30} glowColor="40 80 80" backgroundColor="transparent" borderRadius={14} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']}>
          <Section variant="glass" className="border border-dashed border-white/20 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-primary" strokeWidth={1.5} />
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
                    <Sparkles className="w-4 h-4" strokeWidth={1.5} />
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
              <BorderGlow edgeSensitivity={28} glowColor="40 80 80" backgroundColor="transparent" borderRadius={14} glowRadius={36} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']}>
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
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 pb-8 sm:pb-12">
          <BorderGlow edgeSensitivity={30} glowColor="40 80 80" backgroundColor="transparent" borderRadius={14} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']} className="col-span-1 sm:col-span-2">
          <Card variant="glass" className="col-span-1 sm:col-span-2 p-6 sm:p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-on-surface-variant font-extrabold mb-1">Deep Work</p>
                <h3 className="text-xl font-bold">Distribution</h3>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_rgb(167_139_250_/_0.7)]" /><span className="text-xs text-on-surface-variant">Focus</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_6px_rgb(34_211_238_/_0.7)]" /><span className="text-xs text-on-surface-variant">Admin</span></div>
              </div>
            </div>
            <div className="h-32 sm:h-40 md:h-48 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-4">
              {deepWorkData.map((d, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ originY: 1 }}
                  className="flex-1 flex flex-col items-stretch gap-2 group"
                >
                  <div
                    className={cn(
                      'w-full rounded-md transition-all duration-300',
                      d.isToday
                        ? 'obsidian-gradient shadow-[0_8px_18px_-6px_rgb(124_58_237_/_0.65)]'
                        : 'bg-primary/30 group-hover:bg-primary/45',
                    )}
                    style={{ height: d.height }}
                  />
                  <p className={cn('text-center text-[10px] font-extrabold tracking-wider', d.isToday ? 'text-primary' : 'text-on-surface-variant')}>
                    {d.day}
                  </p>
                </motion.div>
              ))}
            </div>
          </Card>
          </BorderGlow>
          <BorderGlow edgeSensitivity={30} glowColor="40 80 80" backgroundColor="transparent" borderRadius={14} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']} className="col-span-1">
          <Card variant="glass" className="p-6 sm:p-8 relative overflow-hidden flex flex-col">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full"
              style={{ background: 'radial-gradient(circle, rgb(34 211 238 / 0.22), transparent 65%)' }}
            />
            <Zap className="absolute top-[-20px] right-[-12px] w-28 h-28 text-tertiary opacity-10 rotate-12 pointer-events-none" strokeWidth={1} />
            <p className="text-[10px] uppercase tracking-[0.28em] text-tertiary font-extrabold mb-2">Focus Mode</p>
            <h3 className="text-xl font-bold mb-4 text-on-surface">AI Insight</h3>
            <p className="text-sm text-on-surface-variant mb-8 leading-relaxed flex-1">
              {isInsightLoading ? 'Analyzing week data...' : (insight || "You're on track. Batch your remaining tasks to clear your schedule.")}
            </p>
            <Button
              type="button"
              onClick={fetchInsight}
              disabled={isInsightLoading}
              loading={isInsightLoading}
              variant="tertiary"
              className="w-full"
              leftIcon={!isInsightLoading ? <LineChart className="w-4 h-4" strokeWidth={1.5} /> : undefined}
            >
              {isInsightLoading ? 'Generating…' : 'Analyze My Week'}
            </Button>
          </Card>
          </BorderGlow>
        </section>
        </>
        )}
      </div>
    </AppLayout>
  )
}
