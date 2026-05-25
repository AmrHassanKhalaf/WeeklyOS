import { type MutableRefObject, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
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
type WorkspaceActionId =
  | 'analyze-week'
  | 'diagnose-focus'
  | 'find-patterns'
  | 'generate-plan'
  | 'rebalance-tasks'
  | 'suggest-focus-blocks'
  | 'organize-brain-dump'
  | 'plan-tomorrow'
  | 'start-reflection'
  | 'generate-summary'
  | 'compare-weeks'
  | 'generate-lessons'
  | 'ask-workspace'
  | 'create-focus-session'

interface AIWorkspaceProps {
  variant?: 'default' | 'evaluation'
}

interface ChatMessage {
  role: MessageRole
  text: string
  provider?: string
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

const actionCopy: Record<WorkspaceActionId, { label: string; prompt: string; icon: LucideIcon }> = {
  'analyze-week': {
    label: 'Analyze Week',
    icon: BarChart3,
    prompt:
      'Analyze this week using my WeeklyOS context. Focus on workload, completion rate, focus sessions, energy patterns, and the clearest risk.',
  },
  'diagnose-focus': {
    label: 'Diagnose Focus Drop',
    icon: AlertTriangle,
    prompt:
      'Diagnose what may be causing low focus in my current week. Use tasks, focus sessions, workload distribution, and recent activity.',
  },
  'find-patterns': {
    label: 'Find Patterns',
    icon: Zap,
    prompt:
      'Find the most useful productivity patterns in this week and explain what I should repeat or avoid next week.',
  },
  'generate-plan': {
    label: 'Generate Plan',
    icon: CalendarDays,
    prompt:
      'Generate a calm WeeklyOS plan. Prioritize pending tasks, rebalance workload, protect focus blocks, and summarize the plan by day.',
  },
  'rebalance-tasks': {
    label: 'Rebalance Tasks',
    icon: RefreshCw,
    prompt:
      'Review my pending tasks and suggest a lighter reschedule plan. Explain what should move, merge, or become a focus block.',
  },
  'suggest-focus-blocks': {
    label: 'Suggest Focus Blocks',
    icon: Clock3,
    prompt:
      'Suggest focus blocks for the next work period using task priority, energy pattern, and current pending workload.',
  },
  'organize-brain-dump': {
    label: 'Organize Brain Dump',
    icon: Wand2,
    prompt:
      'Organize my brain dump into tasks, reminders, goals, habits, deadlines, and suggested WeeklyOS placement.',
  },
  'plan-tomorrow': {
    label: 'Plan Tomorrow',
    icon: SunMedium,
    prompt:
      'Plan tomorrow from my current WeeklyOS context. Choose the top priority, support tasks, quick wins, and suggested focus blocks.',
  },
  'start-reflection': {
    label: 'Start Reflection',
    icon: ClipboardCheck,
    prompt: 'Open the weekly reflection flow.',
  },
  'generate-summary': {
    label: 'Generate Summary',
    icon: ListTodo,
    prompt:
      'Generate a concise weekly review summary from my score, tasks, focus sessions, activity, and reflection notes.',
  },
  'compare-weeks': {
    label: 'Compare Weeks',
    icon: BarChart3,
    prompt:
      'Compare this week against my recent pattern. Highlight the main change in output, focus, and task completion.',
  },
  'generate-lessons': {
    label: 'Generate Lessons',
    icon: Sparkles,
    prompt:
      'Generate three practical lessons from this week and turn each lesson into a small behavior for next week.',
  },
  'ask-workspace': {
    label: 'Ask Workspace',
    icon: MessageSquare,
    prompt: '',
  },
  'create-focus-session': {
    label: 'Create Focus Session',
    icon: PlayCircle,
    prompt: 'Open Focused Day to start a focus session.',
  },
}

const modePrompts: Record<AIMode, string[]> = {
  analyze: ['Analyze my week', 'What caused low focus?', 'Find my strongest work pattern'],
  plan: ['Plan tomorrow', 'Rebalance my tasks', 'Suggest focus blocks'],
  reflect: ['Generate weekly reflection', 'Create lessons from this week', 'Compare this week'],
  chat: ['Organize my brain dump', 'What should I do next?', 'Create a calmer plan'],
}

const glassCardClass =
  'relative overflow-hidden rounded-3xl border border-primary/[0.16] bg-gradient-to-br from-primary/10 via-surface-container-low/[0.58] to-surface-container-lowest/[0.86] shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]'

const glassPanelClass =
  'relative overflow-hidden rounded-3xl border border-white/10 bg-surface-container-lowest/[0.58] shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]'

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

export function AIWorkspace({ variant = 'default' }: AIWorkspaceProps) {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const closeAIWorkspace = useLayoutStore((state) => state.closeAIWorkspace)
  const isMobile = useLayoutStore((state) => state.isMobile)
  const currentWeek = useWeekStore((state) => state.currentWeek)
  const focusSessions = useWeekStore((state) => state.focusSessions)
  const { sendMessage } = useAiApi()

  const composerRef = useRef<HTMLTextAreaElement | null>(null)
  const [activeMode, setActiveMode] = useState<AIMode>(variant === 'evaluation' ? 'reflect' : 'plan')
  const [chatInput, setChatInput] = useState('')
  const [brainDump, setBrainDump] = useState('')
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text:
        'I am ready with your WeeklyOS context. Choose a workflow, review the staged prompt, then send when you want the assistant to act.',
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

  const stagePrompt = (prompt: string) => {
    setChatInput(prompt)
    window.setTimeout(() => composerRef.current?.focus(), 0)
  }

  const handleSendMessage = async (overrideText?: string) => {
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
      setChatMessages((prev) => [...prev, { role: 'ai', text: response.response, provider: response.providerUsed }])
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Unexpected AI workspace error'
      setChatMessages((prev) => [...prev, { role: 'system', text: `AI request failed: ${text}` }])
    } finally {
      setIsAiTyping(false)
    }
  }

  const handleAction = (actionId: WorkspaceActionId) => {
    if (actionId === 'start-reflection') {
      navigate('/weekly-evaluation')
      closeAIWorkspace()
      return
    }
    if (actionId === 'create-focus-session') {
      navigate('/focused-day')
      closeAIWorkspace()
      return
    }
    if (actionId === 'ask-workspace') {
      composerRef.current?.focus()
      return
    }

    const nextPrompt =
      actionId === 'organize-brain-dump' && brainDump.trim()
        ? `Organize this brain dump into tasks, goals, habits, reminders, and deadlines:\n\n${brainDump.trim()}`
        : actionCopy[actionId].prompt
    stagePrompt(nextPrompt)
  }

  const handleSuggestedPrompt = (prompt: string) => {
    stagePrompt(prompt)
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
        <WorkspaceHeader
          weeklyContext={weeklyContext}
          isRecording={isRecording}
          onRecordingToggle={() => setIsRecording((value) => !value)}
          onClose={closeAIWorkspace}
        />

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[238px_minmax(0,1fr)]">
          <ContextSidebar weeklyContext={weeklyContext} completionRate={completionRate} />

          <div className="flex min-h-0 flex-1 flex-col">
            <ModeNavigation activeMode={activeMode} onModeChange={setActiveMode} />

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
                      onAction={handleAction}
                    />
                  )}
                  {activeMode === 'plan' && (
                    <PlanMode
                      weeklyContext={weeklyContext}
                      brainDump={brainDump}
                      isRecording={isRecording}
                      onBrainDumpChange={setBrainDump}
                      onAction={handleAction}
                      onRecordingToggle={() => setIsRecording((value) => !value)}
                    />
                  )}
                  {activeMode === 'reflect' && (
                    <ReflectMode weeklyContext={weeklyContext} onAction={handleAction} />
                  )}
                  {activeMode === 'chat' && (
                    <ChatMode messages={chatMessages} isAiTyping={isAiTyping} onAction={handleAction} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <ConversationDock
          activeMode={activeMode}
          chatInput={chatInput}
          composerRef={composerRef}
          isAiTyping={isAiTyping}
          isRecording={isRecording}
          onInputChange={setChatInput}
          onRecordingToggle={() => setIsRecording((value) => !value)}
          onSend={() => void handleSendMessage()}
          onSuggestedPrompt={handleSuggestedPrompt}
        />
      </motion.section>
    </div>
  )
}

function WorkspaceHeader({
  weeklyContext,
  isRecording,
  onRecordingToggle,
  onClose,
}: {
  weeklyContext: WeeklyContext
  isRecording: boolean
  onRecordingToggle: () => void
  onClose: () => void
}) {
  return (
    <header className="relative shrink-0 border-b border-primary/[0.12] bg-surface-container-lowest/[0.36] px-4 py-4 sm:px-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/10 via-primary/[0.03] to-transparent"
      />
      <div className="relative flex items-start justify-between gap-4">
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
            <StatusChip label={`Week ${weeklyContext.weekNumber ?? '--'}`} />
            <StatusChip label={`${weeklyContext.pendingCount} pending`} />
            <StatusChip label={`${weeklyContext.focusMinutes} focus min`} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            active={isRecording}
            title={isRecording ? 'Stop voice capture' : 'Start voice capture'}
            onClick={onRecordingToggle}
            icon={isRecording ? MicOff : Mic}
          />
          <IconButton title="Close AI Workspace" onClick={onClose} icon={X} testId="ai-workspace-close" />
        </div>
      </div>
    </header>
  )
}

function ContextSidebar({
  weeklyContext,
  completionRate,
}: {
  weeklyContext: WeeklyContext
  completionRate: number
}) {
  return (
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
            <ContextMetric icon={ListTodo} label="Pending" value={String(weeklyContext.pendingCount)} />
          </div>
        </div>

        <div className={cn(glassCardClass, 'rounded-2xl p-3')}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/[0.35] to-transparent" />
          <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200/[0.76]">
            AI Signal
          </p>
          <p className="relative mt-2 text-sm font-semibold text-on-surface">
            {weeklyContext.riskCount > 0 ? `${weeklyContext.riskDay} needs attention` : 'Workload is steady'}
          </p>
          <p className="relative mt-1 text-xs leading-relaxed text-on-surface-variant">
            Peak output is currently on {weeklyContext.peakDay}. Planning should protect that energy window.
          </p>
        </div>

        <div className={cn(glassPanelClass, 'rounded-2xl p-3')}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Productivity State
          </p>
          <div className="mt-3 space-y-2">
            <StateLine label="Today load" value={`${weeklyContext.todayTaskCount} tasks`} />
            <StateLine label="Date range" value={weeklyContext.dateRange || 'Current'} />
            <StateLine label="Done" value={`${weeklyContext.doneCount}/${weeklyContext.totalPlanned}`} />
          </div>
        </div>
      </div>
    </aside>
  )
}

function ModeNavigation({
  activeMode,
  onModeChange,
}: {
  activeMode: AIMode
  onModeChange: (mode: AIMode) => void
}) {
  return (
    <nav className="shrink-0 overflow-x-auto border-b border-primary/10 bg-surface-container-lowest/20 px-3 py-3 sm:px-5">
      <div className="flex min-w-max gap-2">
        {modes.map((mode) => {
          const Icon = mode.icon
          const active = activeMode === mode.id
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onModeChange(mode.id)}
              className={cn(
                'relative inline-flex h-10 items-center gap-2 rounded-2xl px-3.5 text-sm font-bold transition-all focus-ring',
                active ? 'text-white' : 'text-violet-100/[0.64] hover:bg-primary/10 hover:text-violet-100'
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
  )
}

function AnalyzeMode({
  weeklyContext,
  completionRate,
  onAction,
}: {
  weeklyContext: WeeklyContext
  completionRate: number
  onAction: (action: WorkspaceActionId) => void
}) {
  return (
    <ModeStack>
      <ModeHero
        eyebrow="Analyze"
        title="Read the week before changing it."
        body={`Score ${weeklyContext.score}% with ${weeklyContext.pendingCount} pending tasks. The workspace can identify what is driving output, focus, and risk before planning anything new.`}
        icon={BarChart3}
        primaryAction="analyze-week"
        primaryLabel="Analyze Week"
        onAction={onAction}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Weekly Score" value={`${weeklyContext.score}%`} detail={`${completionRate}% complete`} icon={Target} />
        <StatTile label="Pending Load" value={String(weeklyContext.pendingCount)} detail={`${weeklyContext.totalPlanned} planned`} icon={ListTodo} />
        <StatTile label="Focus" value={`${weeklyContext.focusMinutes}m`} detail={`${weeklyContext.focusSessionCount} sessions`} icon={Clock3} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <InsightPanel
          icon={Zap}
          title="Energy Pattern"
          body={`Current strongest output signal is ${weeklyContext.peakDay}. Use that day for deeper work and avoid filling it with admin tasks.`}
        />
        <InsightPanel
          icon={weeklyContext.riskCount > 0 ? AlertTriangle : CheckCircle2}
          title={weeklyContext.riskCount > 0 ? 'Workload Risk' : 'Pacing Clear'}
          body={
            weeklyContext.riskCount > 0
              ? `${weeklyContext.riskDay} has ${weeklyContext.riskCount} pending tasks. Rebalancing may prevent spillover.`
              : 'No major pending-task spike is visible right now.'
          }
        />
      </div>

      <ActionPanel
        title="Analysis Actions"
        description="Use these only when you want a narrower diagnostic pass."
        secondaryActions={['diagnose-focus', 'find-patterns']}
        onAction={onAction}
      />
    </ModeStack>
  )
}

function PlanMode({
  weeklyContext,
  brainDump,
  isRecording,
  onBrainDumpChange,
  onAction,
  onRecordingToggle,
}: {
  weeklyContext: WeeklyContext
  brainDump: string
  isRecording: boolean
  onBrainDumpChange: (value: string) => void
  onAction: (action: WorkspaceActionId) => void
  onRecordingToggle: () => void
}) {
  return (
    <ModeStack>
      <ModeHero
        eyebrow="Plan"
        title="Build the next plan from real context."
        body={`${weeklyContext.pendingCount} pending tasks, ${weeklyContext.todayTaskCount} today, and ${weeklyContext.focusMinutes} focus minutes tracked. Generate one plan first, then rebalance only if needed.`}
        icon={CalendarDays}
        primaryAction="generate-plan"
        primaryLabel="Generate Plan"
        onAction={onAction}
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <SupportCard icon={Target} title="Priority" body="Choose the highest-leverage task before filling the day." />
        <SupportCard icon={Clock3} title="Focus Allocation" body="Turn heavy work into protected blocks, not scattered reminders." />
        <SupportCard icon={SunMedium} title="Day Shape" body="Balance main objective, support tasks, and quick wins." />
      </div>

      <section className={cn(glassCardClass, 'p-4 sm:p-5')}>
        <PanelShine />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-on-surface">Brain Dump Intake</h3>
            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
              Capture raw material here. Organizing it is a secondary action, not the whole mode.
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
            <span>{isRecording ? 'Listening' : 'Voice'}</span>
          </button>
        </div>
        <textarea
          value={brainDump}
          onChange={(event) => onBrainDumpChange(event.target.value)}
          placeholder="Drop thoughts, commitments, deadlines, ideas, worries, or raw meeting notes..."
          className="ai-workspace-scrollbar custom-scrollbar relative mt-4 min-h-36 w-full resize-y rounded-2xl border border-primary/[0.16] bg-black/[0.22] px-4 py-3 text-sm leading-relaxed text-on-surface outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition-colors placeholder:text-on-surface-variant/[0.45] focus:border-primary/[0.45] focus:bg-primary/5"
        />
        <ActionPanel
          compact
          title="Planning Tools"
          description="Secondary planning passes."
          secondaryActions={['rebalance-tasks', 'suggest-focus-blocks', 'organize-brain-dump']}
          onAction={onAction}
        />
      </section>
    </ModeStack>
  )
}

function ReflectMode({
  weeklyContext,
  onAction,
}: {
  weeklyContext: WeeklyContext
  onAction: (action: WorkspaceActionId) => void
}) {
  const reflections = [
    { label: 'Wins', text: weeklyContext.reflections.wentWell },
    { label: 'Struggles', text: weeklyContext.reflections.struggle },
    { label: 'Lessons', text: weeklyContext.reflections.lessons },
  ]

  return (
    <ModeStack>
      <ModeHero
        eyebrow="Reflect"
        title="Turn the week into lessons."
        body={`Review ${weeklyContext.totalCompleted} completed tasks, ${weeklyContext.focusSessionCount} focus sessions, and the notes already captured in WeeklyOS.`}
        icon={ClipboardCheck}
        primaryAction="start-reflection"
        primaryLabel="Start Reflection"
        onAction={onAction}
      />

      <div className="grid gap-3 lg:grid-cols-3">
        {reflections.map((item) => (
          <div key={item.label} className={cn(glassPanelClass, 'p-4')}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">{item.label}</p>
            <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-on-surface/[0.86]">
              {item.text || 'No reflection logged yet.'}
            </p>
          </div>
        ))}
      </div>

      <ActionPanel
        title="Review Actions"
        description="Use after the reflection flow has enough signal."
        secondaryActions={['generate-summary', 'compare-weeks', 'generate-lessons']}
        onAction={onAction}
      />
    </ModeStack>
  )
}

function ChatMode({
  messages,
  isAiTyping,
  onAction,
}: {
  messages: ChatMessage[]
  isAiTyping: boolean
  onAction: (action: WorkspaceActionId) => void
}) {
  return (
    <ModeStack>
      <ModeHero
        eyebrow="Chat"
        title="Ask from inside your productivity system."
        body="Use open conversation when the workflow does not fit Analyze, Plan, or Reflect. The assistant still sees WeeklyOS context."
        icon={MessageSquare}
        primaryAction="ask-workspace"
        primaryLabel="Ask Workspace"
        onAction={onAction}
      />

      <div className="space-y-4">
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
    </ModeStack>
  )
}

function ConversationDock({
  activeMode,
  chatInput,
  composerRef,
  isAiTyping,
  isRecording,
  onInputChange,
  onRecordingToggle,
  onSend,
  onSuggestedPrompt,
}: {
  activeMode: AIMode
  chatInput: string
  composerRef: MutableRefObject<HTMLTextAreaElement | null>
  isAiTyping: boolean
  isRecording: boolean
  onInputChange: (value: string) => void
  onRecordingToggle: () => void
  onSend: () => void
  onSuggestedPrompt: (prompt: string) => void
}) {
  return (
    <footer className="relative shrink-0 border-t border-primary/[0.12] bg-surface-container-lowest/[0.72] p-3 shadow-[0_-18px_42px_-30px_rgba(0,0,0,0.95)] sm:p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/[0.35] to-transparent"
      />

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {modePrompts[activeMode].map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSuggestedPrompt(prompt)}
            className="shrink-0 rounded-full border border-primary/[0.16] bg-primary/[0.08] px-3 py-1.5 text-[11px] font-semibold text-violet-100/[0.78] transition-all hover:border-primary/[0.36] hover:text-white focus-ring"
          >
            {prompt}
          </button>
        ))}
      </div>

      {isRecording && (
        <div className="mb-2 flex items-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100">
          <span className="h-2 w-2 rounded-full bg-red-300 shadow-[0_0_12px_rgba(252,165,165,0.8)]" />
          Listening. Transcript will appear in the composer.
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={onRecordingToggle}
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
          ref={composerRef}
          value={chatInput}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              onSend()
            }
          }}
          rows={1}
          placeholder="Stage a workflow prompt or ask the workspace directly..."
          className="ai-workspace-scrollbar custom-scrollbar min-h-11 max-h-28 flex-1 resize-none rounded-2xl border border-primary/[0.18] bg-black/20 px-4 py-3 text-sm text-on-surface outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors placeholder:text-on-surface-variant/[0.55] focus:border-primary/[0.45] focus:bg-primary/5"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!chatInput.trim() || isAiTyping}
          className="obsidian-gradient mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_14px_34px_-14px_rgba(124,58,237,0.95)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 focus-ring"
          title="Send"
        >
          <Send className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </button>
      </div>
    </footer>
  )
}

function ModeStack({ children }: { children: ReactNode }) {
  return <div className="space-y-5 pb-4">{children}</div>
}

function ModeHero({
  eyebrow,
  title,
  body,
  icon: Icon,
  primaryAction,
  primaryLabel,
  onAction,
}: {
  eyebrow: string
  title: string
  body: string
  icon: LucideIcon
  primaryAction: WorkspaceActionId
  primaryLabel: string
  onAction: (action: WorkspaceActionId) => void
}) {
  const PrimaryIcon = actionCopy[primaryAction].icon
  return (
    <section className={cn(glassCardClass, 'p-5 sm:p-6')}>
      <PanelShine />
      <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/[0.24] bg-primary/[0.12] text-violet-100 shadow-[0_0_24px_rgba(124,58,237,0.16)]">
            <Icon className="h-5 w-5" strokeWidth={1.7} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-200/[0.75]">{eyebrow}</p>
          <h3 className="mt-2 max-w-xl text-2xl font-black leading-tight tracking-tight text-on-surface sm:text-3xl">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{body}</p>
        </div>

        <button
          type="button"
          onClick={() => onAction(primaryAction)}
          className="obsidian-gradient inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white shadow-[0_18px_40px_-18px_rgba(124,58,237,0.95)] transition-all hover:brightness-110 focus-ring"
        >
          <PrimaryIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
          {primaryLabel}
        </button>
      </div>
    </section>
  )
}

function ActionPanel({
  title,
  description,
  secondaryActions,
  onAction,
  compact = false,
}: {
  title: string
  description: string
  secondaryActions: WorkspaceActionId[]
  onAction: (action: WorkspaceActionId) => void
  compact?: boolean
}) {
  return (
    <div className={cn(compact ? 'pt-4' : cn(glassPanelClass, 'p-4 sm:p-5'))}>
      {!compact && (
        <>
          <p className="text-sm font-black text-on-surface">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{description}</p>
        </>
      )}
      <div className={cn('flex flex-wrap gap-2', compact ? '' : 'mt-4')}>
        {secondaryActions.map((action) => (
          <SecondaryActionButton key={action} action={action} onAction={onAction} />
        ))}
      </div>
    </div>
  )
}

function SecondaryActionButton({
  action,
  onAction,
}: {
  action: WorkspaceActionId
  onAction: (action: WorkspaceActionId) => void
}) {
  const Icon = actionCopy[action].icon
  return (
    <button
      type="button"
      onClick={() => onAction(action)}
      className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-primary/[0.16] bg-primary/[0.07] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-100/[0.76] transition-all hover:border-primary/[0.34] hover:bg-primary/[0.12] hover:text-white focus-ring"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
      <span>{actionCopy[action].label}</span>
    </button>
  )
}

function SupportCard({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className={cn(glassPanelClass, 'p-4')}>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl border border-primary/[0.18] bg-primary/10 text-violet-100">
        <Icon className="h-4 w-4" strokeWidth={1.7} />
      </div>
      <p className="text-sm font-black text-on-surface">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{body}</p>
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

function StateLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-on-surface-variant">{label}</span>
      <span className="truncate text-right font-semibold text-on-surface">{value}</span>
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
      <PanelShine />
      <div className="relative mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/[0.22] bg-primary/[0.12] text-violet-100">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
      </div>
      <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">{label}</p>
      <p className="relative mt-2 text-2xl font-black text-on-surface">{value}</p>
      <p className="relative mt-1 text-xs text-on-surface-variant">{detail}</p>
    </div>
  )
}

function InsightPanel({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <section className={cn(glassCardClass, 'p-4 sm:p-5')}>
      <PanelShine />
      <div className="relative mb-3 flex items-center gap-2 text-violet-100">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
        <h3 className="text-sm font-black uppercase tracking-[0.14em]">{title}</h3>
      </div>
      <p className="relative text-sm leading-relaxed text-on-surface-variant">{body}</p>
    </section>
  )
}

function StatusChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-primary/[0.18] bg-primary/10 px-2.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      {label}
    </span>
  )
}

function IconButton({
  icon: Icon,
  title,
  active,
  onClick,
  testId,
}: {
  icon: LucideIcon
  title: string
  active?: boolean
  onClick: () => void
  testId?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-pressed={active}
      title={title}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-2xl border transition-all focus-ring',
        active
          ? 'border-red-300/[0.35] bg-red-500/15 text-red-200 shadow-[0_0_24px_rgba(248,113,113,0.18)]'
          : 'border-primary/[0.18] bg-primary/10 text-violet-100/[0.76] hover:border-primary/[0.38] hover:text-white hover:shadow-[0_0_22px_rgba(124,58,237,0.16)]'
      )}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
    </button>
  )
}

function PanelShine() {
  return (
    <span
      aria-hidden
      className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/[0.45] to-transparent opacity-70"
    />
  )
}
