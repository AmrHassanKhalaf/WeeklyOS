import { type MutableRefObject, type ReactNode, useEffect, useRef, useState } from 'react'
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
import { AI_ACTIONS } from '../../ai/actions'
import { useOrchestratorSession, type SessionMessage } from '../../ai/hooks'
import { WORKSPACE_MODE_DEFINITIONS, WORKSPACE_MODE_LIST } from '../../ai/modes'
import { buildActionPrompt } from '../../ai/prompts'
import type { AIActionId, WorkspaceContextLayer, WorkspaceMode } from '../../ai/types'
import { cn } from '../../lib/cn'
import { useLayoutStore } from '../../store/useLayoutStore'
import { UIBlockList } from './blocks/BrainDumpUIBlock'
import { PlanningUIBlock } from './blocks/PlanningUIBlock'

interface AIWorkspaceProps {
  variant?: 'default' | 'evaluation'
}

// Alias to the hook's message type for local component usage
type ChatMessage = SessionMessage


const modeIcons: Record<WorkspaceMode, LucideIcon> = {
  analyze: BarChart3,
  plan: CalendarDays,
  reflect: ClipboardCheck,
  chat: MessageSquare,
}

const actionIcons: Record<AIActionId, LucideIcon> = {
  'analyze-week': BarChart3,
  'diagnose-focus': AlertTriangle,
  'find-patterns': Zap,
  'generate-plan': CalendarDays,
  'rebalance-tasks': RefreshCw,
  'suggest-focus-blocks': Clock3,
  'organize-brain-dump': Wand2,
  'plan-tomorrow': SunMedium,
  'start-reflection': ClipboardCheck,
  'generate-summary': ListTodo,
  'compare-weeks': BarChart3,
  'generate-lessons': Sparkles,
  'ask-workspace': MessageSquare,
  'create-focus-session': PlayCircle,
  'rebalance-risk-day': RefreshCw,
  'protect-focus-block': Clock3,
}

function getActionView(actionId: AIActionId) {
  return {
    ...AI_ACTIONS[actionId],
    icon: actionIcons[actionId],
  }
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

  const [activeMode, setActiveMode] = useState<WorkspaceMode>(variant === 'evaluation' ? 'reflect' : 'plan')

  const {
    workspaceContext,
    messages: chatMessages,
    isProcessing: isAiTyping,
    error: aiError,
    send,
    clearError,
  } = useOrchestratorSession(activeMode)

  const composerRef = useRef<HTMLTextAreaElement | null>(null)
  const feedbackTimerRef = useRef<number | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [brainDump, setBrainDump] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [stagedActionLabel, setStagedActionLabel] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAIWorkspace()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeAIWorkspace])

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current)
    }
  }, [])

  const completionRate = workspaceContext.completionRate

  const stagePrompt = (prompt: string, label = 'Prompt') => {
    setChatInput(prompt)
    setStagedActionLabel(label)
    if (feedbackTimerRef.current) window.clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = window.setTimeout(() => setStagedActionLabel(null), 2600)
    window.setTimeout(() => composerRef.current?.focus(), 0)
  }

  const handleSendMessage = async (overrideText?: string) => {
    const message = (overrideText ?? chatInput).trim()
    if (!message || isAiTyping) return
    setChatInput('')
    clearError()
    await send(message)
  }

  const handleAction = (actionId: AIActionId) => {
    const action = AI_ACTIONS[actionId]
    if (action.kind === 'navigation' && action.navigationTarget) {
      navigate(action.navigationTarget)
      closeAIWorkspace()
      return
    }
    if (action.kind === 'composer') {
      composerRef.current?.focus()
      return
    }

    const nextPrompt = buildActionPrompt(actionId, { brainDumpText: brainDump })
    stagePrompt(nextPrompt, action.label)
  }

  const handleSuggestedPrompt = (prompt: string) => {
    stagePrompt(prompt, 'Suggested prompt')
  }

  return (
    <div
      className="fixed inset-0 z-[80]"
      data-testid="ai-workspace"
      aria-live="polite"
      onMouseDown={closeAIWorkspace}
    >
      <motion.div
        className="absolute inset-0 bg-background/[0.84]"
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
          'absolute flex flex-col overflow-hidden border border-primary/[0.24] bg-gradient-to-br from-primary/[0.12] via-surface-container-low/[0.98] to-surface-container-lowest text-on-surface shadow-[0_30px_90px_-26px_rgba(0,0,0,0.9),0_0_70px_rgba(124,58,237,0.18),inset_0_1px_0_rgba(255,255,255,0.07)]',
          isMobile
            ? 'inset-x-0 bottom-0 h-[94dvh] rounded-t-[1.75rem]'
            : 'right-4 top-4 bottom-4 w-[min(1080px,calc(100vw-2rem))] rounded-[1.75rem]'
        )}
      >
        <WorkspaceHeader
          weeklyContext={workspaceContext}
          isRecording={isRecording}
          onRecordingToggle={() => setIsRecording((value) => !value)}
          onClose={closeAIWorkspace}
        />

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[238px_minmax(0,1fr)]">
          <ContextSidebar weeklyContext={workspaceContext} completionRate={completionRate} onAction={handleAction} />

          <div className="flex min-h-0 flex-1 flex-col">
            <ModeNavigation activeMode={activeMode} onModeChange={setActiveMode} />

            <div className="ai-workspace-scrollbar custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pr-2 sm:p-5 sm:pr-3 lg:p-6 lg:pr-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMode}
                  initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.992 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.996 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  {activeMode === 'analyze' && (
                    <AnalyzeMode
                      weeklyContext={workspaceContext}
                      completionRate={completionRate}
                      onAction={handleAction}
                    />
                  )}
                  {activeMode === 'plan' && (
                    <PlanMode
                      weeklyContext={workspaceContext}
                      brainDump={brainDump}
                      isRecording={isRecording}
                      onBrainDumpChange={setBrainDump}
                      onAction={handleAction}
                      onRecordingToggle={() => setIsRecording((value) => !value)}
                    />
                  )}
                  {activeMode === 'reflect' && (
                    <ReflectMode weeklyContext={workspaceContext} onAction={handleAction} />
                  )}
                  {activeMode === 'chat' && (
                    <ChatMode
                      weeklyContext={workspaceContext}
                      messages={chatMessages}
                      isAiTyping={isAiTyping}
                      onAction={handleAction}
                    />
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
          stagedActionLabel={stagedActionLabel}
          aiError={aiError}
          onInputChange={setChatInput}
          onRecordingToggle={() => setIsRecording((value) => !value)}
          onSend={() => void handleSendMessage()}
          onSuggestedPrompt={handleSuggestedPrompt}
          onClearError={clearError}
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
  weeklyContext: WorkspaceContextLayer
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
  onAction,
}: {
  weeklyContext: WorkspaceContextLayer
  completionRate: number
  onAction: (action: AIActionId) => void
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
          <p className="relative mt-2 text-sm font-black text-on-surface">{weeklyContext.signalTitle}</p>
          <p className="relative mt-1 text-xs leading-relaxed text-on-surface-variant">
            {weeklyContext.signalBody}
          </p>
          <div className="relative mt-3 grid gap-2">
            <SignalActionButton action="rebalance-risk-day" onAction={onAction} />
            <SignalActionButton action="protect-focus-block" onAction={onAction} />
          </div>
        </div>

        <div className={cn(glassPanelClass, 'rounded-2xl p-3')}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Productivity State
          </p>
          <div className="mt-3 space-y-2">
            <StateLine label="Today load" value={`${weeklyContext.todayTaskCount} tasks`} />
            <StateLine label="Date range" value={weeklyContext.dateRange || 'Current'} />
            <StateLine label="Done" value={`${weeklyContext.completedCount}/${weeklyContext.totalPlanned}`} />
          </div>
        </div>

        <div className={cn(glassPanelClass, 'rounded-2xl p-3')}>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Continuity
          </p>
          <div className="mt-3 space-y-2">
            <StateLine label="Plan memory" value={weeklyContext.continuity.lastPlanLabel.replace('Last generated plan: ', '')} />
            <StateLine label="Focus signal" value={weeklyContext.continuity.focusQualityLabel.replace('Focus quality: ', '')} />
            <StateLine label="Rollover" value={weeklyContext.continuity.rolloverLabel.replace('Rollover pressure: ', '')} />
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
  activeMode: WorkspaceMode
  onModeChange: (mode: WorkspaceMode) => void
}) {
  return (
    <nav className="shrink-0 overflow-x-auto border-b border-primary/10 bg-surface-container-lowest/20 px-3 py-3 sm:px-5">
      <div className="flex min-w-max gap-2">
        {WORKSPACE_MODE_LIST.map((mode) => {
          const Icon = modeIcons[mode.id]
          const active = activeMode === mode.id
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => onModeChange(mode.id)}
              className={cn(
                'relative inline-flex h-10 items-center gap-2 rounded-2xl px-3.5 text-sm font-bold transition-[background-color,border-color,color,transform] focus-ring',
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
  weeklyContext: WorkspaceContextLayer
  completionRate: number
  onAction: (action: AIActionId) => void
}) {
  const mode = WORKSPACE_MODE_DEFINITIONS.analyze

  return (
    <ModeStack>
      <ModeHero
        eyebrow="Analyze"
        title="Read the week before changing it."
        body={`Score ${weeklyContext.score}% with ${weeklyContext.pendingCount} pending tasks. The workspace can identify what is driving output, focus, and risk before planning anything new.`}
        icon={BarChart3}
        primaryAction={mode.primaryAction}
        primaryLabel={getActionView(mode.primaryAction).label}
        metaItems={[weeklyContext.continuity.focusQualityLabel, weeklyContext.continuity.rolloverLabel]}
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
        secondaryActions={mode.secondaryActions}
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
  weeklyContext: WorkspaceContextLayer
  brainDump: string
  isRecording: boolean
  onBrainDumpChange: (value: string) => void
  onRecordingToggle: () => void
  onAction: (action: AIActionId) => void
}) {
  const mode = WORKSPACE_MODE_DEFINITIONS.plan

  return (
    <ModeStack>
      <ModeHero
        eyebrow="Plan"
        title="Build the next plan from real context."
        body={`${weeklyContext.pendingCount} pending tasks, ${weeklyContext.todayTaskCount} today, and ${weeklyContext.focusMinutes} focus minutes tracked. Generate one plan first, then rebalance only if needed.`}
        icon={CalendarDays}
        primaryAction={mode.primaryAction}
        primaryLabel={getActionView(mode.primaryAction).label}
        metaItems={[weeklyContext.continuity.lastPlanLabel, weeklyContext.continuity.rolloverLabel]}
        onAction={onAction}
      />

      {weeklyContext.totalPlanned === 0 ? (
        <EmptyStateCard
          icon={ListTodo}
          title="No weekly plan yet"
          body="Add tasks or use the brain dump intake, then generate the first structure from that raw context."
        />
      ) : (
        <section className={cn(glassPanelClass, 'p-4 sm:p-5')}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-200/[0.72]">
                Planning Sequence
              </p>
              <h3 className="mt-2 text-base font-black text-on-surface">Objective to schedule</h3>
            </div>
            <span className="rounded-full border border-primary/[0.14] bg-primary/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-100/[0.66]">
              guided flow
            </span>
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr]">
            <WorkflowStep
              index="01"
              icon={Target}
              title="Objective"
              body={`Choose the main result before filling the day. ${weeklyContext.pendingCount} pending tasks are available for prioritization.`}
              emphasis
            />
            <WorkflowStep
              index="02"
              icon={AlertTriangle}
              title="Workload Insight"
              body={
                weeklyContext.riskCount > 0
                  ? `${weeklyContext.riskDay} carries the heaviest load with ${weeklyContext.riskCount} pending tasks.`
                  : 'No overloaded day is visible. Keep the plan light and intentional.'
              }
            />
            <WorkflowStep
              index="03"
              icon={Clock3}
              title="Focus Allocation"
              body={`Protect ${weeklyContext.peakDay} as the strongest output window and convert heavy work into focus blocks.`}
            />
          </div>
        </section>
      )}

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
              'inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-xs font-bold uppercase tracking-[0.12em] transition-[background-color,border-color,color] focus-ring',
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
          secondaryActions={mode.secondaryActions}
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
  weeklyContext: WorkspaceContextLayer
  onAction: (action: AIActionId) => void
}) {
  const mode = WORKSPACE_MODE_DEFINITIONS.reflect
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
        primaryAction={mode.primaryAction}
        primaryLabel={getActionView(mode.primaryAction).label}
        metaItems={[weeklyContext.continuity.focusQualityLabel, `${weeklyContext.totalCompleted} completed tasks`]}
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
        secondaryActions={mode.secondaryActions}
        onAction={onAction}
      />
    </ModeStack>
  )
}

function ChatMode({
  weeklyContext,
  messages,
  isAiTyping,
  onAction,
}: {
  weeklyContext: WorkspaceContextLayer
  messages: ChatMessage[]
  isAiTyping: boolean
  onAction: (action: AIActionId) => void
}) {
  const mode = WORKSPACE_MODE_DEFINITIONS.chat

  return (
    <ModeStack>
      <ModeHero
        eyebrow="Chat"
        title="Ask from inside your productivity system."
        body="Use open conversation when the workflow does not fit Analyze, Plan, or Reflect. The assistant still sees WeeklyOS context."
        icon={MessageSquare}
        primaryAction={mode.primaryAction}
        primaryLabel={getActionView(mode.primaryAction).label}
        metaItems={['Context-aware composer', weeklyContext.continuity.lastPlanLabel]}
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
              {message.text && <FormattedMessage text={message.text} />}
              {message.uiBlocks && message.uiBlocks.length > 0 && (
                <UIBlockList blocks={message.uiBlocks} PlanningBlockComponent={PlanningUIBlock} />
              )}
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
  stagedActionLabel,
  aiError,
  onInputChange,
  onRecordingToggle,
  onSend,
  onSuggestedPrompt,
  onClearError,
}: {
  activeMode: WorkspaceMode
  chatInput: string
  composerRef: MutableRefObject<HTMLTextAreaElement | null>
  isAiTyping: boolean
  isRecording: boolean
  stagedActionLabel: string | null
  aiError: string | null
  onInputChange: (value: string) => void
  onRecordingToggle: () => void
  onSend: () => void
  onSuggestedPrompt: (prompt: string) => void
  onClearError: () => void
}) {
  return (
    <footer className="relative shrink-0 border-t border-primary/[0.12] bg-surface-container-lowest/[0.72] p-3 shadow-[0_-18px_42px_-30px_rgba(0,0,0,0.95)] sm:p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/[0.35] to-transparent"
      />

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="shrink-0 text-[10px] font-black uppercase tracking-[0.18em] text-violet-100/[0.45]">
          Suggested
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {WORKSPACE_MODE_DEFINITIONS[activeMode].suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSuggestedPrompt(prompt)}
              className="shrink-0 rounded-full border border-primary/[0.16] bg-primary/[0.08] px-3 py-1.5 text-[11px] font-semibold text-violet-100/[0.78] transition-[border-color,color] hover:border-primary/[0.36] hover:text-white focus-ring"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {aiError && (
        <div className="mb-2 flex items-center gap-2 rounded-2xl border border-red-300/[0.22] bg-red-500/[0.12] px-3 py-2 text-xs font-semibold text-red-100">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.8} />
          <span className="flex-1 min-w-0 truncate">{aiError}</span>
          <button
            type="button"
            onClick={onClearError}
            className="shrink-0 rounded-lg p-0.5 hover:bg-red-300/20 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      )}

      {stagedActionLabel && (
        <div className="mb-2 flex items-center gap-2 rounded-2xl border border-emerald-300/[0.16] bg-emerald-400/[0.08] px-3 py-2 text-xs font-semibold text-emerald-100">
          <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
          {stagedActionLabel} staged in the composer.
        </div>
      )}

      {isAiTyping && (
        <div className="mb-2 overflow-hidden rounded-2xl border border-primary/[0.14] bg-primary/[0.06] px-3 py-2">
          <div className="h-2 w-40 animate-pulse rounded-full bg-violet-100/[0.16]" />
          <div className="mt-2 h-2 w-64 max-w-full animate-pulse rounded-full bg-violet-100/[0.1]" />
        </div>
      )}

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
            'mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-[background-color,border-color,color] focus-ring',
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
          className="obsidian-gradient mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_14px_34px_-14px_rgba(124,58,237,0.95)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45 focus-ring"
          title={isAiTyping ? 'Processing…' : 'Send message'}
          id="ai-workspace-send-btn"
          aria-label="Send message"
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
  metaItems,
  onAction,
}: {
  eyebrow: string
  title: string
  body: string
  icon: LucideIcon
  primaryAction: AIActionId
  primaryLabel: string
  metaItems?: string[]
  onAction: (action: AIActionId) => void
}) {
  const PrimaryIcon = getActionView(primaryAction).icon
  return (
    <section className={cn(glassCardClass, 'min-h-[260px] p-5 shadow-[0_24px_70px_-42px_rgba(124,58,237,0.9),inset_0_1px_0_rgba(255,255,255,0.065)] sm:p-6')}>
      <PanelShine />
      <div className="relative grid h-full gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
        <div className="max-w-2xl">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/[0.24] bg-primary/[0.12] text-violet-100 shadow-[0_0_24px_rgba(124,58,237,0.16)]">
            <Icon className="h-5 w-5" strokeWidth={1.7} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-200/[0.75]">{eyebrow}</p>
          <h3 className="mt-2 max-w-xl text-2xl font-black leading-tight tracking-tight text-on-surface sm:text-3xl">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">{body}</p>
          {metaItems && metaItems.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {metaItems.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-primary/[0.14] bg-black/[0.16] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-100/[0.68]"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-primary/[0.16] bg-black/[0.18] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
          <button
            type="button"
            onClick={() => onAction(primaryAction)}
            className="obsidian-gradient inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-black text-white shadow-[0_20px_46px_-18px_rgba(124,58,237,1)] transition-opacity hover:opacity-90 focus-ring"
          >
            <PrimaryIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
            {primaryLabel}
          </button>
          <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-100/[0.56]">
            stages a reviewed workspace prompt
          </p>
        </div>
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
  secondaryActions: AIActionId[]
  onAction: (action: AIActionId) => void
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
  action: AIActionId
  onAction: (action: AIActionId) => void
}) {
  const actionView = getActionView(action)
  const Icon = actionView.icon
  return (
    <button
      type="button"
      onClick={() => onAction(action)}
      className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-primary/[0.16] bg-primary/[0.07] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-100/[0.76] transition-[background-color,border-color,color] hover:border-primary/[0.34] hover:bg-primary/[0.12] hover:text-white focus-ring"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
      <span>{actionView.label}</span>
    </button>
  )
}

function SignalActionButton({
  action,
  onAction,
}: {
  action: AIActionId
  onAction: (action: AIActionId) => void
}) {
  const actionView = getActionView(action)
  const Icon = actionView.icon
  return (
    <button
      type="button"
      onClick={() => onAction(action)}
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-primary/[0.14] bg-black/[0.18] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-violet-100/[0.74] transition-[background-color,border-color,color] hover:border-primary/[0.34] hover:bg-primary/[0.1] hover:text-white focus-ring"
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
      <span>{actionView.label}</span>
    </button>
  )
}

function WorkflowStep({
  index,
  icon: Icon,
  title,
  body,
  emphasis = false,
}: {
  index: string
  icon: LucideIcon
  title: string
  body: string
  emphasis?: boolean
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]',
        emphasis
          ? 'border-primary/[0.22] bg-gradient-to-br from-primary/[0.14] via-primary/[0.07] to-surface-container-lowest/[0.72]'
          : 'border-white/10 bg-black/[0.16]'
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-primary/[0.18] bg-primary/10 text-violet-100">
          <Icon className="h-4 w-4" strokeWidth={1.7} />
        </div>
        <span className="font-mono text-[11px] font-black text-violet-100/[0.48]">{index}</span>
      </div>
      <p className="text-sm font-black text-on-surface">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{body}</p>
    </div>
  )
}

function EmptyStateCard({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <section className={cn(glassPanelClass, 'p-5')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/[0.18] bg-primary/10 text-violet-100">
          <Icon className="h-5 w-5" strokeWidth={1.7} />
        </div>
        <div>
          <p className="text-sm font-black text-on-surface">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{body}</p>
        </div>
      </div>
    </section>
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
        'flex h-10 w-10 items-center justify-center rounded-2xl border transition-[background-color,border-color,color] focus-ring',
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
