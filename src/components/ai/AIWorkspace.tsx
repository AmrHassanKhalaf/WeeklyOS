import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Inbox,
  ListTodo,
  MessageSquare,
  Mic,
  MicOff,
  PlayCircle,
  RefreshCw,
  Send,
  Sparkles,
  SunMedium,
  Target,
  Wand2,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useAiApi, type AiHistoryMessage } from '../../hooks/useApi'
import { cn } from '../../lib/cn'
import { useLayoutStore } from '../../store/useLayoutStore'
import { useWeekStore } from '../../store/useWeekStore'

type AIMode = 'analyze' | 'plan' | 'reflect' | 'chat'
type MessageRole = 'ai' | 'user' | 'system'
type SmartActionId =
  | 'create-tasks'
  | 'reschedule-tasks'
  | 'generate-week-plan'
  | 'create-focus-session'
  | 'start-reflection'
  | 'organize-brain-dump'

interface AIWorkspaceProps {
  variant?: 'default' | 'evaluation'
}

interface ChatMessage {
  role: MessageRole
  text: string
  provider?: string
  actions?: SmartActionId[]
}

interface PlanAction {
  id: 'week' | 'day' | 'dump'
  title: string
  description: string
  icon: LucideIcon
  tone: 'primary' | 'tertiary' | 'amber'
  prompt: string
}

interface WeeklyContext extends Record<string, unknown> {
  weekTitle: string
  weekNumber?: number
  dateRange: string
  score: number
  totalPlanned: number
  totalCompleted: number
  pendingCount: number
  doneCount: number
  todayLabel: string
  todayTaskCount: number
  focusMinutes: number
  focusSessionCount: number
  peakDay: string
  riskDay: string
  riskCount: number
  recentActivities: Array<{ id: string; text: string; time: number; done: boolean }>
  reflections: {
    wentWell?: string
    struggle?: string
    lessons?: string
  }
  tasks: Array<Record<string, unknown>>
}

const modes: Array<{ id: AIMode; label: string; icon: LucideIcon }> = [
  { id: 'analyze', label: 'Analyze', icon: BarChart3 },
  { id: 'plan', label: 'Plan', icon: CalendarDays },
  { id: 'reflect', label: 'Reflect', icon: ClipboardCheck },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
]

const smartActionMeta: Record<SmartActionId, { label: string; icon: LucideIcon }> = {
  'create-tasks': { label: 'Create Tasks', icon: ListTodo },
  'reschedule-tasks': { label: 'Reschedule Tasks', icon: RefreshCw },
  'generate-week-plan': { label: 'Generate Week Plan', icon: CalendarDays },
  'create-focus-session': { label: 'Create Focus Session', icon: PlayCircle },
  'start-reflection': { label: 'Start Reflection', icon: ClipboardCheck },
  'organize-brain-dump': { label: 'Organize Brain Dump', icon: Wand2 },
}

const planActions: PlanAction[] = [
  {
    id: 'week',
    title: 'Plan My Week',
    description: 'Prioritize pending tasks, balance workload, and protect deep work windows.',
    icon: CalendarDays,
    tone: 'primary',
    prompt:
      'Create a strategic weekly plan from my current WeeklyOS context. Prioritize pending tasks, balance workload across days, protect focus time, and call out risks.',
  },
  {
    id: 'day',
    title: 'Plan My Day',
    description: 'Build a focused day plan around priorities, habits, and energy patterns.',
    icon: SunMedium,
    tone: 'tertiary',
    prompt:
      'Create an intelligent day plan for today. Use my priorities, pending workload, focus sessions, habits, and recent activity to suggest the best sequence.',
  },
  {
    id: 'dump',
    title: 'Brain Dump -> Organize',
    description: 'Turn raw notes into tasks, reminders, habits, goals, and deadlines.',
    icon: Inbox,
    tone: 'amber',
    prompt:
      'Help me organize a brain dump into WeeklyOS objects: tasks, goals, reminders, habits, deadlines, and suggested schedule blocks.',
  },
]

const glassCardClass =
  'relative overflow-hidden rounded-3xl border border-primary/[0.16] bg-gradient-to-br from-primary/10 via-surface-container-low/[0.58] to-surface-container-lowest/[0.86] shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]'

const glassPanelClass =
  'relative overflow-hidden rounded-3xl border border-white/10 bg-surface-container-lowest/[0.58] shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]'

function toneClasses(tone: PlanAction['tone']) {
  if (tone === 'tertiary') {
    return {
      border: 'border-primary/[0.18] hover:border-cyan-300/40',
      text: 'text-cyan-100',
      icon: 'bg-cyan-400/[0.12] text-cyan-100 border-cyan-300/20',
      glow: 'group-hover:shadow-[0_0_34px_rgba(124,58,237,0.18),0_0_24px_rgba(34,211,238,0.12)]',
    }
  }
  if (tone === 'amber') {
    return {
      border: 'border-primary/[0.18] hover:border-amber-300/[0.36]',
      text: 'text-amber-100',
      icon: 'bg-amber-300/[0.12] text-amber-100 border-amber-300/20',
      glow: 'group-hover:shadow-[0_0_34px_rgba(124,58,237,0.18),0_0_22px_rgba(251,191,36,0.1)]',
    }
  }
  return {
    border: 'border-primary/20 hover:border-primary/[0.48]',
    text: 'text-violet-100',
    icon: 'bg-violet-400/[0.14] text-violet-100 border-violet-300/[0.22]',
    glow: 'group-hover:shadow-[0_0_36px_rgba(124,58,237,0.24)]',
  }
}

function formatActivityTime(time: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000))
  if (minutes < 1) return 'Now'
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h`
}

function FormattedMessage({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed text-on-surface/90" dir="auto">
      {text.split('\n').map((line, index) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={index} className="h-1" />
        if (/^[-*]\s+/.test(trimmed)) {
          return (
            <div key={index} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
              <p>{trimmed.replace(/^[-*]\s+/, '')}</p>
            </div>
          )
        }
        return <p key={index}>{trimmed}</p>
      })}
    </div>
  )
}

function SmartActionRow({
  actions,
  onAction,
  compact = false,
}: {
  actions: SmartActionId[]
  onAction: (action: SmartActionId) => void
  compact?: boolean
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', compact ? 'pt-2' : 'pt-4')}>
      {actions.map((action) => {
        const meta = smartActionMeta[action]
        const Icon = meta.icon
        return (
          <button
            key={action}
            type="button"
            onClick={() => onAction(action)}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-primary/[0.18] bg-gradient-to-br from-primary/10 via-surface-container-low/70 to-surface-container-lowest/70 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-100/[0.86] shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] transition-all hover:border-primary/[0.42] hover:text-white hover:shadow-[0_0_22px_rgba(124,58,237,0.16)] focus-ring"
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
            <span>{meta.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function AIWorkspace({ variant = 'default' }: AIWorkspaceProps) {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const closeAIWorkspace = useLayoutStore((state) => state.closeAIWorkspace)
  const isMobile = useLayoutStore((state) => state.isMobile)
  const currentWeek = useWeekStore((state) => state.currentWeek)
  const focusSessions = useWeekStore((state) => state.focusSessions)
  const { sendMessage } = useAiApi()

  const [activeMode, setActiveMode] = useState<AIMode>(variant === 'evaluation' ? 'reflect' : 'plan')
  const [chatInput, setChatInput] = useState('')
  const [brainDump, setBrainDump] = useState('')
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text:
        'I am connected to your WeeklyOS context: tasks, focus sessions, weekly score, activity, and reflections. Choose a planning action or ask directly.',
      actions: ['generate-week-plan', 'organize-brain-dump', 'start-reflection'],
    },
  ])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAIWorkspace()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeAIWorkspace])

  const weekTasks = useMemo(() => {
    if (!currentWeek) return []
    return currentWeek.days.flatMap((day) => [
      ...(day.highTask ? [day.highTask] : []),
      ...day.mediumTasks,
      ...day.smallTasks,
    ])
  }, [currentWeek])

  const weeklyContext = useMemo<WeeklyContext>(() => {
    const pendingTasks = weekTasks.filter((task) => task.status === 'pending')
    const doneTasks = weekTasks.filter((task) => task.status === 'done')
    const today = currentWeek?.days.find((day) => day.isToday) ?? currentWeek?.days[0]
    const focusSeconds = focusSessions.reduce((total, session) => total + session.duration_seconds, 0)

    let peakDay = currentWeek?.days[0]?.shortName ?? 'Today'
    let peakDone = -1
    let riskDay = currentWeek?.days[0]?.shortName ?? 'Today'
    let riskCount = 0

    currentWeek?.days.forEach((day) => {
      const dayTasks = [
        ...(day.highTask ? [day.highTask] : []),
        ...day.mediumTasks,
        ...day.smallTasks,
      ]
      const completed = dayTasks.filter((task) => task.status === 'done').length
      const pending = dayTasks.filter((task) => task.status === 'pending').length
      if (completed > peakDone) {
        peakDone = completed
        peakDay = day.shortName
      }
      if (pending > riskCount) {
        riskCount = pending
        riskDay = day.shortName
      }
    })

    return {
      weekTitle: currentWeek?.title ?? 'Current Week',
      weekNumber: currentWeek?.weekNumber,
      dateRange: currentWeek?.dateRange ?? '',
      score: currentWeek?.score ?? 0,
      totalPlanned: currentWeek?.totalPlanned ?? weekTasks.length,
      totalCompleted: currentWeek?.totalCompleted ?? doneTasks.length,
      pendingCount: pendingTasks.length,
      doneCount: doneTasks.length,
      todayLabel: today?.shortName ?? 'Today',
      todayTaskCount: today
        ? [today.highTask, ...today.mediumTasks, ...today.smallTasks].filter(Boolean).length
        : 0,
      focusMinutes: Math.round(focusSeconds / 60),
      focusSessionCount: focusSessions.length,
      peakDay,
      riskDay,
      riskCount,
      recentActivities: currentWeek?.activities?.slice(0, 5) ?? [],
      reflections: {
        wentWell: currentWeek?.evalWentWell,
        struggle: currentWeek?.evalStruggle,
        lessons: currentWeek?.evalLessons,
      },
      tasks: weekTasks.map((task) => ({
        title: task.title,
        priority: task.priority,
        status: task.status,
        day: task.day,
        estimatedTime: task.estimatedTime,
        actualDuration: task.actualDuration,
      })),
    }
  }, [currentWeek, focusSessions, weekTasks])

  const completionRate = weeklyContext.totalPlanned
    ? Math.round((weeklyContext.totalCompleted / weeklyContext.totalPlanned) * 100)
    : 0

  const handleSendMessage = async (overrideText?: string, actions?: SmartActionId[]) => {
    const message = (overrideText ?? chatInput).trim()
    if (!message || isAiTyping) return

    setChatInput('')
    setActiveMode('chat')
    setChatMessages((prev) => [...prev, { role: 'user', text: message }])
    setIsAiTyping(true)

    try {
      const history: AiHistoryMessage[] = chatMessages
        .filter((entry) => entry.role !== 'system')
        .map((entry) => ({
          role: entry.role === 'ai' ? 'assistant' : entry.role,
          content: entry.text,
        }))

      const response = await sendMessage('workspace', message, weeklyContext, undefined, history)
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: response.response,
          provider: response.providerUsed,
          actions: actions ?? ['create-tasks', 'reschedule-tasks', 'create-focus-session'],
        },
      ])
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Unexpected AI workspace error'
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'system',
          text: `AI request failed: ${text}`,
          actions: ['generate-week-plan', 'organize-brain-dump'],
        },
      ])
    } finally {
      setIsAiTyping(false)
    }
  }

  const handlePlanAction = (action: PlanAction) => {
    void handleSendMessage(action.prompt, action.id === 'dump' ? ['organize-brain-dump', 'create-tasks'] : ['generate-week-plan', 'reschedule-tasks'])
  }

  const handleSmartAction = (action: SmartActionId) => {
    if (action === 'create-focus-session') {
      navigate('/focused-day')
      closeAIWorkspace()
      return
    }
    if (action === 'start-reflection') {
      navigate('/weekly-evaluation')
      closeAIWorkspace()
      return
    }
    if (action === 'organize-brain-dump') {
      const input = brainDump.trim()
      void handleSendMessage(
        input
          ? `Organize this brain dump into tasks, goals, habits, reminders, and deadlines:\n\n${input}`
          : planActions[2].prompt,
        ['create-tasks', 'reschedule-tasks']
      )
      return
    }
    if (action === 'generate-week-plan') {
      void handleSendMessage(planActions[0].prompt, ['create-tasks', 'reschedule-tasks', 'create-focus-session'])
      return
    }
    if (action === 'reschedule-tasks') {
      void handleSendMessage(
        'Review my pending tasks and suggest a calmer reschedule plan. Explain which tasks should move, merge, or become focus sessions.',
        ['generate-week-plan', 'create-focus-session']
      )
      return
    }
    void handleSendMessage(
      'Convert the recommended plan into concrete WeeklyOS tasks. Group them by priority, suggested day, estimated time, and next action.',
      ['reschedule-tasks', 'create-focus-session']
    )
  }

  return (
    <div
      className="fixed inset-0 z-[80]"
      data-testid="ai-workspace"
      aria-live="polite"
      onMouseDown={closeAIWorkspace}
    >
      <motion.div
        className="absolute inset-0 bg-background/[0.72] backdrop-blur-md"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      />

      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label="AI Workspace"
        onMouseDown={(event) => event.stopPropagation()}
        initial={
          reduceMotion
            ? false
            : isMobile
              ? { y: '100%', opacity: 1 }
              : { x: 36, opacity: 0, scale: 0.985 }
        }
        animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
        exit={reduceMotion ? undefined : isMobile ? { y: '100%' } : { x: 28, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 260 }}
        className={cn(
          'absolute flex flex-col overflow-hidden border border-primary/[0.24] bg-gradient-to-br from-primary/[0.12] via-surface-container-low/[0.96] to-surface-container-lowest/[0.98] text-on-surface shadow-[0_30px_90px_-26px_rgba(0,0,0,0.9),0_0_70px_rgba(124,58,237,0.18),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl backdrop-saturate-150',
          isMobile
            ? 'inset-x-0 bottom-0 h-[94dvh] rounded-t-[1.75rem]'
            : 'right-4 top-4 bottom-4 w-[min(1080px,calc(100vw-2rem))] rounded-[1.75rem]'
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/10 via-primary/[0.03] to-transparent"
        />
        <header className="relative shrink-0 border-b border-primary/[0.12] bg-surface-container-lowest/[0.36] px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="obsidian-gradient flex h-9 w-9 items-center justify-center rounded-2xl text-white shadow-[0_10px_26px_-10px_rgba(124,58,237,0.75)]">
                  <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
                <div className="min-w-0">
                  <h2 className="gradient-text truncate text-lg font-black tracking-tight sm:text-xl">AI Workspace</h2>
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
                    Command Center
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-violet-100/[0.82]">
                <span className="rounded-full border border-primary/[0.18] bg-primary/10 px-2.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  Week {weeklyContext.weekNumber ?? '--'}
                </span>
                <span className="rounded-full border border-primary/[0.18] bg-primary/10 px-2.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  {weeklyContext.pendingCount} pending tasks
                </span>
                <span className="rounded-full border border-primary/[0.18] bg-primary/10 px-2.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  {weeklyContext.focusMinutes} focus min
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRecording((value) => !value)}
                aria-pressed={isRecording}
                title={isRecording ? 'Stop voice capture' : 'Start voice capture'}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl border transition-all focus-ring',
                  isRecording
                    ? 'border-red-300/[0.35] bg-red-500/15 text-red-200 shadow-[0_0_24px_rgba(248,113,113,0.18)]'
                    : 'border-primary/[0.18] bg-primary/10 text-violet-100/[0.76] hover:border-primary/[0.38] hover:text-white hover:shadow-[0_0_22px_rgba(124,58,237,0.16)]'
                )}
              >
                {isRecording ? <MicOff className="h-[18px] w-[18px]" strokeWidth={1.7} /> : <Mic className="h-[18px] w-[18px]" strokeWidth={1.7} />}
              </button>
              <button
                type="button"
                onClick={closeAIWorkspace}
                data-testid="ai-workspace-close"
                title="Close AI Workspace"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/[0.18] bg-primary/10 text-violet-100/[0.76] transition-all hover:border-primary/[0.38] hover:text-white focus-ring"
              >
                <X className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="hidden min-h-0 border-r border-primary/10 bg-black/[0.08] p-4 lg:block">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-violet-200/[0.72]">
                  Live Context
                </p>
                <div className="space-y-2 text-xs">
                  <ContextMetric icon={Target} label="Weekly score" value={`${weeklyContext.score}%`} />
                  <ContextMetric icon={CheckCircle2} label="Completion" value={`${completionRate}%`} />
                  <ContextMetric icon={Clock3} label="Sessions" value={String(weeklyContext.focusSessionCount)} />
                </div>
              </div>

              <div className={cn(glassCardClass, 'rounded-2xl p-3')}>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/[0.35] to-transparent" />
                <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200/[0.76]">
                  Signal
                </p>
                <p className="relative mt-2 text-sm font-semibold text-on-surface">
                  {weeklyContext.riskCount > 0 ? `${weeklyContext.riskDay} needs attention` : 'Workload is clear'}
                </p>
                <p className="relative mt-1 text-xs leading-relaxed text-on-surface-variant">
                  Peak output is currently on {weeklyContext.peakDay}. The workspace will use that pattern while planning.
                </p>
              </div>

              <SmartActionRow
                compact
                actions={['generate-week-plan', 'organize-brain-dump', 'start-reflection']}
                onAction={handleSmartAction}
              />
            </div>
          </aside>

          <div className="flex min-h-0 flex-1 flex-col">
            <nav className="shrink-0 overflow-x-auto border-b border-primary/10 bg-surface-container-lowest/20 px-3 py-3 sm:px-5">
              <div className="flex min-w-max gap-2">
                {modes.map((mode) => {
                  const Icon = mode.icon
                  const active = activeMode === mode.id
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setActiveMode(mode.id)}
                      className={cn(
                        'relative inline-flex h-10 items-center gap-2 rounded-2xl px-3.5 text-sm font-bold transition-all focus-ring',
                        active
                          ? 'text-white'
                          : 'text-violet-100/[0.64] hover:bg-primary/10 hover:text-violet-100'
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="ai-workspace-mode"
                          className="absolute inset-0 rounded-2xl border border-primary/[0.34] bg-gradient-to-br from-primary/[0.22] via-primary/10 to-tertiary/10 shadow-[0_0_24px_rgba(124,58,237,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]"
                          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        />
                      )}
                      <Icon className="relative h-4 w-4" strokeWidth={1.7} />
                      <span className="relative">{mode.label}</span>
                    </button>
                  )
                })}
              </div>
            </nav>

            <div className="ai-workspace-scrollbar custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pr-2 sm:p-5 sm:pr-3 lg:p-6 lg:pr-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMode}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  {activeMode === 'analyze' && (
                    <AnalyzeMode
                      weeklyContext={weeklyContext}
                      completionRate={completionRate}
                      onAction={handleSmartAction}
                    />
                  )}
                  {activeMode === 'plan' && (
                    <PlanMode
                      brainDump={brainDump}
                      isRecording={isRecording}
                      onBrainDumpChange={setBrainDump}
                      onPlanAction={handlePlanAction}
                      onAction={handleSmartAction}
                      onRecordingToggle={() => setIsRecording((value) => !value)}
                    />
                  )}
                  {activeMode === 'reflect' && (
                    <ReflectMode weeklyContext={weeklyContext} onAction={handleSmartAction} />
                  )}
                  {activeMode === 'chat' && (
                    <ChatMode
                      messages={chatMessages}
                      isAiTyping={isAiTyping}
                      onAction={handleSmartAction}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <footer className="relative shrink-0 border-t border-primary/[0.12] bg-surface-container-lowest/[0.72] p-3 shadow-[0_-18px_42px_-30px_rgba(0,0,0,0.95)] sm:p-4">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/[0.35] to-transparent"
          />
          {isRecording && (
            <div className="mb-2 flex items-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100">
              <span className="h-2 w-2 rounded-full bg-red-300 shadow-[0_0_12px_rgba(252,165,165,0.8)]" />
              Recording draft
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => setIsRecording((value) => !value)}
              aria-pressed={isRecording}
              className={cn(
                'mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all focus-ring',
                isRecording
                  ? 'border-red-300/[0.35] bg-red-500/15 text-red-200'
                  : 'border-primary/[0.18] bg-primary/10 text-violet-100/[0.76] hover:border-primary/[0.38] hover:text-white'
              )}
              title={isRecording ? 'Stop voice capture' : 'Start voice capture'}
            >
              {isRecording ? <MicOff className="h-[18px] w-[18px]" strokeWidth={1.7} /> : <Mic className="h-[18px] w-[18px]" strokeWidth={1.7} />}
            </button>
            <textarea
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void handleSendMessage()
                }
              }}
              rows={1}
              placeholder="Ask the workspace to analyze, plan, reflect, or organize..."
              className="ai-workspace-scrollbar custom-scrollbar min-h-11 max-h-28 flex-1 resize-none rounded-2xl border border-primary/[0.18] bg-black/20 px-4 py-3 text-sm text-on-surface outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors placeholder:text-on-surface-variant/[0.55] focus:border-primary/[0.45] focus:bg-primary/5"
            />
            <button
              type="button"
              onClick={() => void handleSendMessage()}
              disabled={!chatInput.trim() || isAiTyping}
              className="obsidian-gradient mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_14px_34px_-14px_rgba(124,58,237,0.95)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 focus-ring"
              title="Send"
            >
              <Send className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>
          </div>
        </footer>
      </motion.section>
    </div>
  )
}

function ContextMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/[0.14] bg-gradient-to-br from-primary/[0.08] via-surface-container-low/[0.48] to-surface-container-lowest/[0.72] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <span className="flex min-w-0 items-center gap-2 text-violet-100/[0.74]">
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.7} />
        <span className="truncate">{label}</span>
      </span>
      <span className="font-mono text-xs font-black text-violet-100">{value}</span>
    </div>
  )
}

function PlanMode({
  brainDump,
  isRecording,
  onBrainDumpChange,
  onPlanAction,
  onAction,
  onRecordingToggle,
}: {
  brainDump: string
  isRecording: boolean
  onBrainDumpChange: (value: string) => void
  onPlanAction: (action: PlanAction) => void
  onAction: (action: SmartActionId) => void
  onRecordingToggle: () => void
}) {
  return (
    <div className="space-y-5 pb-4">
      <div className="grid gap-3 lg:grid-cols-3">
        {planActions.map((action) => {
          const Icon = action.icon
          const tone = toneClasses(action.tone)
          return (
            <button
              key={action.id}
              type="button"
              data-testid={`ai-action-${action.id}`}
              onClick={() => onPlanAction(action)}
              className={cn(
                glassCardClass,
                'group min-h-44 p-4 text-left transition-all hover:-translate-y-0.5 focus-ring',
                tone.border,
                tone.glow
              )}
            >
              <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/[0.45] to-transparent opacity-70" />
              <span className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border', tone.icon)}>
                <Icon className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <span className={cn('relative block text-base font-black', tone.text)}>{action.title}</span>
              <span className="relative mt-2 block text-sm leading-relaxed text-on-surface-variant">{action.description}</span>
            </button>
          )
        })}
      </div>

      <section className={cn(glassCardClass, 'p-4 sm:p-5')}>
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/[0.45] to-transparent opacity-70" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-on-surface">Brain Dump Intake</h3>
            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
              Capture loose context first, then let the workspace structure it.
            </p>
          </div>
          <button
            type="button"
            onClick={onRecordingToggle}
            aria-pressed={isRecording}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-xs font-bold uppercase tracking-[0.12em] transition-all focus-ring',
              isRecording
                ? 'border-red-300/30 bg-red-500/[0.12] text-red-100'
                : 'border-primary/[0.18] bg-primary/10 text-violet-100/[0.78] hover:border-primary/[0.38] hover:text-white'
            )}
          >
            {isRecording ? <MicOff className="h-4 w-4" strokeWidth={1.7} /> : <Mic className="h-4 w-4" strokeWidth={1.7} />}
            <span>{isRecording ? 'Recording' : 'Voice'}</span>
          </button>
        </div>
        <textarea
          value={brainDump}
          onChange={(event) => onBrainDumpChange(event.target.value)}
          placeholder="Drop thoughts, commitments, deadlines, ideas, worries, or raw meeting notes..."
          className="ai-workspace-scrollbar custom-scrollbar relative mt-4 min-h-44 w-full resize-y rounded-2xl border border-primary/[0.16] bg-black/[0.22] px-4 py-3 text-sm leading-relaxed text-on-surface outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition-colors placeholder:text-on-surface-variant/[0.45] focus:border-primary/[0.45] focus:bg-primary/5"
        />
        <SmartActionRow actions={['organize-brain-dump', 'create-tasks', 'reschedule-tasks']} onAction={onAction} />
      </section>
    </div>
  )
}

function AnalyzeMode({
  weeklyContext,
  completionRate,
  onAction,
}: {
  weeklyContext: WeeklyContext
  completionRate: number
  onAction: (action: SmartActionId) => void
}) {
  return (
    <div className="space-y-5 pb-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Weekly Score" value={`${weeklyContext.score}%`} detail={`${completionRate}% complete`} icon={Target} />
        <StatTile label="Pending Load" value={String(weeklyContext.pendingCount)} detail={`${weeklyContext.totalPlanned} planned`} icon={ListTodo} />
        <StatTile label="Focus Today" value={`${weeklyContext.focusMinutes}m`} detail={`${weeklyContext.focusSessionCount} sessions`} icon={Clock3} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightPanel
          icon={Zap}
          title="Energy Pattern"
          tone="cyan"
          body={`Your strongest tracked output is on ${weeklyContext.peakDay}. Use that day for deeper work and protect lighter admin work for lower-output slots.`}
        />
        <InsightPanel
          icon={weeklyContext.riskCount > 0 ? AlertTriangle : CheckCircle2}
          title={weeklyContext.riskCount > 0 ? 'Deadline Risk' : 'Pacing Clear'}
          tone={weeklyContext.riskCount > 0 ? 'violet' : 'cyan'}
          body={
            weeklyContext.riskCount > 0
              ? `${weeklyContext.riskDay} has ${weeklyContext.riskCount} pending tasks. A reschedule pass can reduce spillover.`
              : 'Pending workload is currently distributed without a strong risk spike.'
          }
        />
      </div>

      <section className={cn(glassCardClass, 'p-4 sm:p-5')}>
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/[0.45] to-transparent opacity-70" />
        <h3 className="text-sm font-black text-on-surface">Recent Activity</h3>
        <div className="mt-4 space-y-3">
          {weeklyContext.recentActivities.length > 0 ? (
            weeklyContext.recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-3 text-sm">
                <span className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', activity.done ? 'bg-cyan-300' : 'bg-neutral-600')} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-on-surface">{activity.text}</p>
                  <p className="text-xs text-on-surface-variant">{formatActivityTime(activity.time)} ago</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-on-surface-variant">No recent activity logged.</p>
          )}
        </div>
        <SmartActionRow actions={['generate-week-plan', 'reschedule-tasks', 'create-focus-session']} onAction={onAction} />
      </section>
    </div>
  )
}

function ReflectMode({
  weeklyContext,
  onAction,
}: {
  weeklyContext: WeeklyContext
  onAction: (action: SmartActionId) => void
}) {
  const reflections = [
    { label: 'Went Well', text: weeklyContext.reflections.wentWell },
    { label: 'Struggle', text: weeklyContext.reflections.struggle },
    { label: 'Lessons', text: weeklyContext.reflections.lessons },
  ]

  return (
    <div className="space-y-5 pb-4">
      <section className={cn(glassCardClass, 'p-4 sm:p-5')}>
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/[0.45] to-transparent opacity-70" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-on-surface">Weekly Review Layer</h3>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
              The workspace can compare score, activity, focus sessions, and notes before writing the review.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onAction('start-reflection')}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-primary/[0.28] bg-primary/[0.12] px-4 text-xs font-bold uppercase tracking-[0.12em] text-violet-100 transition-all hover:bg-primary/[0.18] hover:text-white focus-ring"
          >
            <ClipboardCheck className="h-4 w-4" strokeWidth={1.7} />
            Start Reflection
          </button>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        {reflections.map((item) => (
          <div key={item.label} className={cn(glassPanelClass, 'p-4')}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">{item.label}</p>
            <p className="mt-3 text-sm leading-relaxed text-on-surface/[0.86]">{item.text || 'No reflection logged yet.'}</p>
          </div>
        ))}
      </div>

      <InsightPanel
        icon={Bot}
        title="Reflection Prompt"
        tone="violet"
        body={`Current week score is ${weeklyContext.score} with ${weeklyContext.pendingCount} pending tasks. Ask the workspace to summarize what to repeat, what to drop, and what to schedule differently.`}
      />
    </div>
  )
}

function ChatMode({
  messages,
  isAiTyping,
  onAction,
}: {
  messages: ChatMessage[]
  isAiTyping: boolean
  onAction: (action: SmartActionId) => void
}) {
  return (
    <div className="space-y-4 pb-6">
      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
        >
          <div
            className={cn(
              'max-w-[92%] rounded-3xl border px-4 py-3 sm:max-w-[78%]',
              message.role === 'user'
                ? 'border-primary/[0.28] bg-gradient-to-br from-primary/[0.18] via-primary/10 to-tertiary/[0.08] text-on-surface rounded-br-lg shadow-[0_16px_34px_-24px_rgba(124,58,237,0.8)]'
                : message.role === 'system'
                  ? 'border-red-300/[0.18] bg-red-500/10 text-red-100 rounded-bl-lg'
                  : 'border-primary/[0.14] bg-gradient-to-br from-primary/[0.08] via-surface-container-low/[0.58] to-surface-container-lowest/[0.78] text-on-surface rounded-bl-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
            )}
          >
            <FormattedMessage text={message.text} />
            {message.provider && (
              <p className="mt-3 border-t border-outline-variant/[0.12] pt-2 text-right text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-300/[0.65]">
                via {message.provider}
              </p>
            )}
            {message.actions && <SmartActionRow compact actions={message.actions} onAction={onAction} />}
          </div>
        </div>
      ))}

      {isAiTyping && (
        <div className="flex justify-start">
          <div className="inline-flex items-center gap-3 rounded-3xl rounded-bl-lg border border-primary/[0.14] bg-gradient-to-br from-primary/[0.08] via-surface-container-low/[0.58] to-surface-container-lowest/[0.78] px-4 py-3 text-sm text-on-surface-variant">
            <Bot className="h-4 w-4 text-cyan-200" strokeWidth={1.7} />
            <span className="animate-pulse">Processing WeeklyOS context...</span>
          </div>
        </div>
      )}
    </div>
  )
}

function StatTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  icon: LucideIcon
}) {
  return (
    <div className={cn(glassCardClass, 'p-4')}>
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/[0.45] to-transparent opacity-70" />
      <div className="relative mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/[0.22] bg-primary/[0.12] text-violet-100">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
      </div>
      <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">{label}</p>
      <p className="relative mt-2 text-2xl font-black text-on-surface">{value}</p>
      <p className="relative mt-1 text-xs text-on-surface-variant">{detail}</p>
    </div>
  )
}

function InsightPanel({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: LucideIcon
  title: string
  body: string
  tone: 'violet' | 'cyan'
}) {
  return (
    <section
      className={cn(
        glassCardClass,
        'p-4 sm:p-5',
        tone === 'cyan' ? 'hover:border-cyan-300/[0.24]' : 'hover:border-violet-300/[0.24]'
      )}
    >
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/[0.45] to-transparent opacity-70" />
      <div className={cn('relative mb-3 flex items-center gap-2', tone === 'cyan' ? 'text-cyan-100' : 'text-violet-100')}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
        <h3 className="text-sm font-black uppercase tracking-[0.14em]">{title}</h3>
      </div>
      <p className="relative text-sm leading-relaxed text-on-surface-variant">{body}</p>
    </section>
  )
}
