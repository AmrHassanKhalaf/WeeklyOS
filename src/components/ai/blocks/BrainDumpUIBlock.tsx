import {
  AlertTriangle,
  Brain,
  Calendar,
  CheckCircle2,
  Flame,
  HelpCircle,
  Lightbulb,
  ListTodo,
  Target,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { OrchestratorUIBlock, OrchestratorUIBlockKind } from '../../../ai/orchestrator/types'
import { cn } from '../../../lib/cn'
import { ReflectionUIBlock } from './ReflectionUIBlock'

// ─── Block Icon Map ───────────────────────────────────────────────────────────

const KIND_ICON: Partial<Record<OrchestratorUIBlockKind, LucideIcon>> = {
  brain_dump_summary: Brain,
  brain_dump_tasks: ListTodo,
  brain_dump_habits: Flame,
  brain_dump_goals: Target,
  brain_dump_reminders: CheckCircle2,
  brain_dump_events: Calendar,
  brain_dump_ambiguous: HelpCircle,
  brain_dump_suggestions: Lightbulb,
  insight: Zap,
  warning: AlertTriangle,
}

const KIND_ACCENT: Partial<Record<OrchestratorUIBlockKind, string>> = {
  brain_dump_summary: 'border-primary/[0.22] bg-gradient-to-br from-primary/[0.1] via-primary/[0.05] to-transparent',
  brain_dump_tasks: 'border-emerald-400/[0.18] bg-gradient-to-br from-emerald-400/[0.07] via-surface-container-low/[0.4] to-transparent',
  brain_dump_habits: 'border-orange-400/[0.18] bg-gradient-to-br from-orange-400/[0.07] via-surface-container-low/[0.4] to-transparent',
  brain_dump_goals: 'border-violet-400/[0.22] bg-gradient-to-br from-violet-400/[0.08] via-surface-container-low/[0.4] to-transparent',
  brain_dump_reminders: 'border-sky-400/[0.18] bg-gradient-to-br from-sky-400/[0.07] via-surface-container-low/[0.4] to-transparent',
  brain_dump_events: 'border-cyan-400/[0.18] bg-gradient-to-br from-cyan-400/[0.07] via-surface-container-low/[0.4] to-transparent',
  brain_dump_ambiguous: 'border-amber-400/[0.24] bg-gradient-to-br from-amber-400/[0.1] via-surface-container-low/[0.4] to-transparent',
  brain_dump_suggestions: 'border-indigo-400/[0.18] bg-gradient-to-br from-indigo-400/[0.07] via-surface-container-low/[0.4] to-transparent',
  warning: 'border-red-400/[0.22] bg-gradient-to-br from-red-400/[0.08] via-surface-container-low/[0.4] to-transparent',
}

const KIND_ICON_COLOR: Partial<Record<OrchestratorUIBlockKind, string>> = {
  brain_dump_summary: 'text-violet-300',
  brain_dump_tasks: 'text-emerald-300',
  brain_dump_habits: 'text-orange-300',
  brain_dump_goals: 'text-violet-300',
  brain_dump_reminders: 'text-sky-300',
  brain_dump_events: 'text-cyan-300',
  brain_dump_ambiguous: 'text-amber-300',
  brain_dump_suggestions: 'text-indigo-300',
  warning: 'text-red-300',
}

// ─── Line Renderer ────────────────────────────────────────────────────────────

function ContentLine({ text }: { text: string }) {
  const trimmed = text.trim()
  if (!trimmed) return null

  // Bullet lines
  if (trimmed.startsWith('•')) {
    return (
      <div className="flex items-start gap-2 text-xs text-on-surface/80">
        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
        <span className="leading-relaxed">{trimmed.slice(1).trim()}</span>
      </div>
    )
  }

  // Label: value lines (e.g. "Extracted: 3 tasks • 1 habit")
  const colonIdx = trimmed.indexOf(':')
  if (colonIdx > 0 && colonIdx < 20) {
    const label = trimmed.slice(0, colonIdx)
    const value = trimmed.slice(colonIdx + 1).trim()
    return (
      <div className="flex items-baseline gap-1.5 text-xs">
        <span className="font-semibold text-on-surface-variant">{label}:</span>
        <span className="text-on-surface/80">{value}</span>
      </div>
    )
  }

  return <p className="text-xs leading-relaxed text-on-surface/80">{trimmed}</p>
}

// ─── Block Component ──────────────────────────────────────────────────────────

interface BrainDumpUIBlockProps {
  block: OrchestratorUIBlock
  className?: string
}

/**
 * Renders a single `OrchestratorUIBlock` as a styled card.
 *
 * Each block kind has its own accent color and icon. Content lines are parsed
 * minimally — bullet characters produce icon bullets, label:value pairs get
 * inline formatting. No heavy parsing; no markdown.
 */
export function BrainDumpUIBlock({ block, className }: BrainDumpUIBlockProps) {
  const Icon = KIND_ICON[block.kind] ?? Brain
  const accentClass = KIND_ACCENT[block.kind] ?? 'border-primary/[0.16] bg-surface-container-lowest/40'
  const iconColor = KIND_ICON_COLOR[block.kind] ?? 'text-violet-300'

  const lines = block.content.split('\n').filter((l) => l.trim())

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        accentClass,
        className
      )}
    >
      {/* Header */}
      <div className="mb-2.5 flex items-center gap-2">
        <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center', iconColor)}>
          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
          {block.title}
        </p>
      </div>

      {/* Content lines */}
      <div className="space-y-1.5">
        {lines.map((line, idx) => (
          <ContentLine key={idx} text={line} />
        ))}
      </div>
    </div>
  )
}

// ─── Multi-block renderer — routes to the correct component by kind ──────────

const PLANNING_KINDS = new Set([
  'planning_summary',
  'planning_tasks',
  'planning_focus_blocks',
  'planning_overload',
  'planning_rebalance',
  'planning_recommendations',
])

const REFLECTION_KINDS = new Set([
  'reflection_summary',
  'reflection_score_breakdown',
  'reflection_wins',
  'reflection_struggles',
  'reflection_lessons',
  'reflection_improvements',
  'reflection_insights',
  'reflection_next_week',
])

interface UIBlockListProps {
  blocks: OrchestratorUIBlock[]
  /** Optional lazy renderer for planning blocks — avoids circular imports. */
  PlanningBlockComponent?: React.ComponentType<{ block: OrchestratorUIBlock }>
}

export function UIBlockList({ blocks, PlanningBlockComponent }: UIBlockListProps) {
  if (blocks.length === 0) return null
  return (
    <div className="mt-3 space-y-2">
      {blocks.map((block, idx) => {
        if (PLANNING_KINDS.has(block.kind) && PlanningBlockComponent) {
          return <PlanningBlockComponent key={`${block.kind}-${idx}`} block={block} />
        }
        if (REFLECTION_KINDS.has(block.kind)) {
          return <ReflectionUIBlock key={`${block.kind}-${idx}`} block={block} />
        }
        return <BrainDumpUIBlock key={`${block.kind}-${idx}`} block={block} />
      })}
    </div>
  )
}
