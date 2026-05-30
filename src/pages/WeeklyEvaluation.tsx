import { AppLayout } from '../components/layout/AppLayout'
import { AlertCircle, X, TrendingUp, ThumbsUp, Sparkles, ThumbsDown, Lightbulb } from 'lucide-react'
import { useWeekStore } from '../store/useWeekStore'
import { useAiApi } from '../hooks/useApi'
import { useState, useEffect, useRef, useCallback } from 'react'

export function WeeklyEvaluation() {
  const currentWeek = useWeekStore(state => state.currentWeek)
  const isLoadingWeek = useWeekStore(state => state.isLoadingWeek)
  const { sendMessage } = useAiApi()
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({})
  const [aiError, setAiError] = useState<string | null>(null)

  // Local state for the inputs to allow snappy typing
  const [evalState, setEvalState] = useState({
    wentWell: '',
    struggle: '',
    lessons: ''
  })

  // Debounce timer refs for autosave
  const saveTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const currentWeekId = currentWeek?.id
  const currentEvalWentWell = currentWeek?.evalWentWell || ''
  const currentEvalStruggle = currentWeek?.evalStruggle || ''
  const currentEvalLessons = currentWeek?.evalLessons || ''

  // Sync local state when currentWeek loads
  useEffect(() => {
    if (currentWeekId) {
      setEvalState({
        wentWell: currentEvalWentWell,
        struggle: currentEvalStruggle,
        lessons: currentEvalLessons
      })
    }
  }, [currentWeekId, currentEvalWentWell, currentEvalStruggle, currentEvalLessons])

  const handleSave = useCallback((type: 'wentWell' | 'struggle' | 'lessons', value?: string) => {
    const text = value ?? evalState[type]
    useWeekStore.getState().updateEvaluation(type, text)
  }, [evalState])

  const handleChange = useCallback((type: 'wentWell' | 'struggle' | 'lessons', value: string) => {
    setEvalState(prev => ({ ...prev, [type]: value }))
    // Debounce: save 800ms after user stops typing
    if (saveTimerRef.current[type]) clearTimeout(saveTimerRef.current[type])
    saveTimerRef.current[type] = setTimeout(() => {
      useWeekStore.getState().updateEvaluation(type, value)
    }, 800)
  }, [])


  const handleGenerate = async (type: 'wentWell' | 'struggle' | 'lessons') => {
    if (!currentWeek) return
    setIsGenerating(prev => ({ ...prev, [type]: true }))
    try {
      const context = {
        title: currentWeek.title,
        score: currentWeek.score,
        completed: currentWeek.totalCompleted,
        planned: currentWeek.totalPlanned,
        days: currentWeek.days.map(d => ({
          day: d.shortName,
          completed: (d.highTask?.status === 'done' ? 1 : 0) + d.mediumTasks.filter(t => t.status==='done').length + d.smallTasks.filter(t => t.status==='done').length,
          planned: (d.highTask ? 1 : 0) + d.mediumTasks.length + d.smallTasks.length
        }))
      }
      
      let prompt = ''
      if (type === 'wentWell') prompt = 'Generate a short reflection (1-2 sentences) about what went well this week based on the completion stats. Talk directly to me (e.g. "You did well on..."). Do not use quotes.'
      if (type === 'struggle') prompt = 'Generate a short reflection (1-2 sentences) about where I might have struggled this week, looking at days where completed < planned. Talk directly to me. Do not use quotes.'
      if (type === 'lessons') prompt = 'Based on the week\'s stats, generate a short 1-2 sentence lesson learned for future productivity. Do not use quotes.'

      const res = await sendMessage('reflection', prompt, context)
      
      const newText = res.response
      setEvalState(prev => ({ ...prev, [type]: newText }))
      useWeekStore.getState().updateEvaluation(type, newText)
      
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : 'Failed to generate reflection')
    } finally {
      setIsGenerating(prev => ({ ...prev, [type]: false }))
    }
  }

  if (isLoadingWeek || !currentWeek) {
    return (
      <AppLayout aiVariant="evaluation">
        <div className="max-w-4xl mx-auto container-responsive py-responsive space-y-8 pb-32 sm:pb-16">
          <div className="h-20 bg-surface-container-low rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 h-40 bg-surface-container-low rounded-xl animate-pulse" />
            <div className="md:col-span-8 h-40 bg-surface-container-low rounded-xl animate-pulse" />
          </div>
        </div>
      </AppLayout>
    )
  }

  // Calculate real stats from the week's tasks
  const score = currentWeek.score
  const weekdays = currentWeek.days.slice(0, 5) // Mon–Fri

  const dailyStats = weekdays.map(d => {
    const total = (d.highTask ? 1 : 0) + d.mediumTasks.length + d.smallTasks.length
    const done = [d.highTask, ...d.mediumTasks, ...d.smallTasks]
      .filter(Boolean)
      .filter(t => t?.status === 'done').length
    return { day: d.shortName.toUpperCase(), completed: done, planned: total }
  })

  const maxPlanned = Math.max(...dailyStats.map(d => d.planned), 1)

  return (
    <AppLayout aiVariant="evaluation">
      <div className="max-w-4xl mx-auto container-responsive py-responsive pb-32 sm:pb-16">
        {/* AI Error Banner */}
        {aiError && (
          <div className="flex items-center gap-3 bg-error/10 border border-error/20 rounded-xl px-5 py-3 mb-8">
            <AlertCircle className="text-error text-xl shrink-0" strokeWidth={1.5} />
            <p className="text-sm text-error flex-1">{aiError}</p>
            <button onClick={() => setAiError(null)} className="text-error/60 hover:text-error transition-colors touch-target" aria-label="Dismiss">
              <X className="text-lg" strokeWidth={1.5} />
            </button>
          </div>
        )}
        {/* Header */}
        <header className="mb-8 sm:mb-12">
          <h2 className="text-responsive-h1 font-extrabold tracking-tight mb-2">Weekly Evaluation</h2>
          <p className="text-sm sm:text-base text-on-surface-variant">Reviewing {currentWeek.dateRange}. Clarity leads to mastery.</p>
        </header>

        {/* Bento Grid Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {/* Score Card */}
          <div className="md:col-span-4 bg-surface-container-low p-5 sm:p-6 rounded-xl flex flex-col justify-between">
            <span className="text-xs uppercase tracking-widest text-on-surface-variant">Weekly Score</span>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-primary">{score}%</span>
              <TrendingUp className="text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }} strokeWidth={1.5} />
            </div>
            <div className="mt-4 h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full w-full origin-left bg-gradient-to-r from-primary-container to-primary" style={{ transform: `scaleX(${score / 100})` }} />
            </div>
            <div className="mt-3 text-[10px] text-neutral-500">
              {currentWeek.totalCompleted} / {currentWeek.totalPlanned} tasks completed
            </div>
          </div>

          {/* Bar Chart */}
          <div className="md:col-span-8 bg-surface-container-low p-5 sm:p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-on-surface-variant">Completed vs. Planned</span>
              <div className="flex gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-[10px] text-on-surface-variant uppercase">Done</span></div>
                <div className="flex items-center gap-1 sm:gap-2"><div className="w-2 h-2 rounded-full bg-surface-variant" /><span className="text-[10px] text-on-surface-variant uppercase">Plan</span></div>
              </div>
            </div>
            <div className="flex items-end justify-between h-24 gap-2 sm:gap-4">
              {dailyStats.map((d) => {
                const doneH = maxPlanned > 0 ? Math.round((d.completed / maxPlanned) * 80) : 0
                const plannedH = maxPlanned > 0 ? Math.round((d.planned / maxPlanned) * 80) : 0
                const gapH = Math.max(plannedH - doneH, 0)
                return (
                  <div key={d.day} className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-full flex flex-col-reverse h-20">
                      <div className="w-full bg-primary rounded-t-sm" style={{ height: doneH }} />
                      <div className="w-full bg-surface-variant rounded-t-sm" style={{ height: gapH }} />
                    </div>
                    <span className="text-[10px] text-on-surface-variant">{d.day}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Reflection Sections */}
        <div className="space-y-12 pb-16">
          
          {/* What went well */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center">
                  <ThumbsUp className="text-tertiary text-xl" style={{ fontVariationSettings: "'FILL' 1" }} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold">What went well?</h3>
              </div>
              <button 
                onClick={() => handleGenerate('wentWell')}
                disabled={isGenerating['wentWell']}
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 px-3 py-2.5 sm:py-1.5 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50 touch-target shrink-0"
              >
                <Sparkles className="text-[14px]" strokeWidth={1.5} />
                <span className="hidden sm:inline">{isGenerating['wentWell'] ? 'Generating...' : 'Auto-Generate'}</span>
                <span className="sm:hidden">{isGenerating['wentWell'] ? 'Wait...' : 'Auto'}</span>
              </button>
            </div>
            <textarea
              value={evalState.wentWell}
              onChange={e => handleChange('wentWell', e.target.value)}
              onBlur={() => handleSave('wentWell')}
              placeholder="Reflect on your wins and successes this week..."
              className="w-full h-32 bg-surface-container-lowest border border-white/5 border-l-[3px] border-l-tertiary p-4 sm:p-5 rounded-xl text-base sm:text-sm text-on-surface focus:outline-none focus:bg-white/[0.02] focus:border-white/10 transition-[background-color,border-color,color] resize-none placeholder:text-neutral-600 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]"
            />
          </section>

          {/* Where did I struggle */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center">
                  <ThumbsDown className="text-error text-xl" style={{ fontVariationSettings: "'FILL' 1" }} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold">Where did I struggle?</h3>
              </div>
              <button 
                onClick={() => handleGenerate('struggle')}
                disabled={isGenerating['struggle']}
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 px-3 py-2.5 sm:py-1.5 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50 touch-target shrink-0"
              >
                <Sparkles className="text-[14px]" strokeWidth={1.5} />
                <span className="hidden sm:inline">{isGenerating['struggle'] ? 'Generating...' : 'Auto-Generate'}</span>
                <span className="sm:hidden">{isGenerating['struggle'] ? 'Wait...' : 'Auto'}</span>
              </button>
            </div>
            <textarea
              value={evalState.struggle}
              onChange={e => handleChange('struggle', e.target.value)}
              onBlur={() => handleSave('struggle')}
              placeholder="Note any roadblocks, distractions, or missed targets..."
              className="w-full h-32 bg-surface-container-lowest border border-white/5 border-l-[3px] border-l-error p-4 sm:p-5 rounded-xl text-base sm:text-sm text-on-surface focus:outline-none focus:bg-white/[0.02] focus:border-white/10 transition-[background-color,border-color,color] resize-none placeholder:text-neutral-600 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]"
            />
          </section>

          {/* Lessons learned */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lightbulb className="text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold">Lessons learned</h3>
              </div>
              <button 
                onClick={() => handleGenerate('lessons')}
                disabled={isGenerating['lessons']}
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 px-3 py-2.5 sm:py-1.5 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50 touch-target shrink-0"
              >
                <Sparkles className="text-[14px]" strokeWidth={1.5} />
                <span className="hidden sm:inline">{isGenerating['lessons'] ? 'Generating...' : 'Auto-Generate'}</span>
                <span className="sm:hidden">{isGenerating['lessons'] ? 'Wait...' : 'Auto'}</span>
              </button>
            </div>
            <textarea
              value={evalState.lessons}
              onChange={e => handleChange('lessons', e.target.value)}
              onBlur={() => handleSave('lessons')}
              placeholder="What changes will you make to your workflow next week?"
              className="w-full h-32 bg-surface-container-lowest border border-white/5 border-l-[3px] border-l-primary p-4 sm:p-5 rounded-xl text-base sm:text-sm text-on-surface focus:outline-none focus:bg-white/[0.02] focus:border-white/10 transition-[background-color,border-color,color] resize-none placeholder:text-neutral-600 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]"
            />
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
