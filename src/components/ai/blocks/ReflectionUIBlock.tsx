import {
  AlertTriangle,
  Flame,
  Lightbulb,
  Target,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { OrchestratorUIBlock, OrchestratorUIBlockKind } from '../../../ai/orchestrator/types'
import { cn } from '../../../lib/cn'
import { BidiLine, BidiText } from '../../ui/BidiText'

// ─── Block Icon Map ───────────────────────────────────────────────────────────

const KIND_ICON: Partial<Record<OrchestratorUIBlockKind, LucideIcon>> = {
  reflection_summary: TrendingUp,
  reflection_score_breakdown: Target,
  reflection_wins: Zap,
  reflection_struggles: AlertTriangle,
  reflection_lessons: Lightbulb,
  reflection_improvements: TrendingUp,
  reflection_insights: Flame,
  reflection_next_week: Target,
}

const KIND_ACCENT: Partial<Record<OrchestratorUIBlockKind, string>> = {
  reflection_summary: 'border-primary/[0.22] bg-gradient-to-br from-primary/[0.1] via-primary/[0.05] to-transparent',
  reflection_score_breakdown: 'border-violet-400/[0.18] bg-gradient-to-br from-violet-400/[0.07] via-surface-container-low/[0.4] to-transparent',
  reflection_wins: 'border-emerald-400/[0.18] bg-gradient-to-br from-emerald-400/[0.07] via-surface-container-low/[0.4] to-transparent',
  reflection_struggles: 'border-red-400/[0.18] bg-gradient-to-br from-red-400/[0.07] via-surface-container-low/[0.4] to-transparent',
  reflection_lessons: 'border-amber-400/[0.18] bg-gradient-to-br from-amber-400/[0.07] via-surface-container-low/[0.4] to-transparent',
  reflection_improvements: 'border-sky-400/[0.18] bg-gradient-to-br from-sky-400/[0.07] via-surface-container-low/[0.4] to-transparent',
  reflection_insights: 'border-orange-400/[0.18] bg-gradient-to-br from-orange-400/[0.07] via-surface-container-low/[0.4] to-transparent',
  reflection_next_week: 'border-indigo-400/[0.18] bg-gradient-to-br from-indigo-400/[0.07] via-surface-container-low/[0.4] to-transparent',
}

const KIND_ICON_COLOR: Partial<Record<OrchestratorUIBlockKind, string>> = {
  reflection_summary: 'text-violet-300',
  reflection_score_breakdown: 'text-violet-300',
  reflection_wins: 'text-emerald-300',
  reflection_struggles: 'text-red-300',
  reflection_lessons: 'text-amber-300',
  reflection_improvements: 'text-sky-300',
  reflection_insights: 'text-orange-300',
  reflection_next_week: 'text-indigo-300',
}

// ─── Line Renderer ────────────────────────────────────────────────────────────

function ContentLine({ text }: { text: string }) {
  const trimmed = text.trim()
  if (!trimmed) return null

  // Bullet lines
  if (trimmed.startsWith('•')) {
    return (
      <BidiLine text={trimmed.slice(1).trim()} className="flex items-start gap-2 text-xs text-on-surface/80">
        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
        <span className="min-w-0 flex-1 leading-relaxed">{trimmed.slice(1).trim()}</span>
      </BidiLine>
    )
  }

  // Label: value lines (e.g. "Completion: 75%")
  const colonIdx = trimmed.indexOf(':')
  if (colonIdx > 0 && colonIdx < 20) {
    const label = trimmed.slice(0, colonIdx)
    const value = trimmed.slice(colonIdx + 1).trim()
    return (
      <BidiLine text={trimmed} className="flex items-baseline gap-1.5 text-xs">
        <span className="font-semibold text-on-surface-variant">{label}:</span>
        <span className="min-w-0 flex-1 text-on-surface/80">{value}</span>
      </BidiLine>
    )
  }

  return <BidiLine as="p" text={trimmed} className="text-xs leading-relaxed text-on-surface/80" />
}

// ─── Block Component ──────────────────────────────────────────────────────────

interface ReflectionUIBlockProps {
  block: OrchestratorUIBlock
  className?: string
}

/**
 * Renders a single reflection `OrchestratorUIBlock` as a styled card.
 *
 * Each block kind has its own accent color and icon. Content lines are parsed
 * minimally — bullet characters produce icon bullets, label:value pairs get
 * inline formatting. No heavy parsing; no markdown.
 */
export function ReflectionUIBlock({ block, className }: ReflectionUIBlockProps) {
  const Icon = KIND_ICON[block.kind] ?? TrendingUp
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
        <BidiText
          as="p"
          text={block.title}
          className="text-[10px] font-black uppercase tracking-[0.18em] text-on-surface-variant"
        />
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
