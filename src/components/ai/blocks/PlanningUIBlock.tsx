import {
  AlertTriangle,
  BarChart3,
  Brain,
  Clock3,
  Lightbulb,
  ListTodo,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import type { OrchestratorUIBlock, OrchestratorUIBlockKind } from '../../../ai/orchestrator/types'
import { cn } from '../../../lib/cn'
import { BidiLine, BidiText } from '../../ui/BidiText'

// ─── Block Configuration ──────────────────────────────────────────────────────

const KIND_ICON: Partial<Record<OrchestratorUIBlockKind, LucideIcon>> = {
  planning_summary: BarChart3,
  planning_tasks: ListTodo,
  planning_focus_blocks: Clock3,
  planning_overload: AlertTriangle,
  planning_rebalance: RefreshCw,
  planning_recommendations: Lightbulb,
}

const KIND_ACCENT: Partial<Record<OrchestratorUIBlockKind, string>> = {
  planning_summary: 'border-primary/[0.22] bg-gradient-to-br from-primary/[0.12] via-primary/[0.05] to-transparent',
  planning_tasks: 'border-emerald-400/[0.18] bg-gradient-to-br from-emerald-400/[0.07] to-transparent',
  planning_focus_blocks: 'border-cyan-400/[0.18] bg-gradient-to-br from-cyan-400/[0.07] to-transparent',
  planning_overload: 'border-red-400/[0.22] bg-gradient-to-br from-red-400/[0.1] to-transparent',
  planning_rebalance: 'border-amber-400/[0.22] bg-gradient-to-br from-amber-400/[0.08] to-transparent',
  planning_recommendations: 'border-indigo-400/[0.18] bg-gradient-to-br from-indigo-400/[0.07] to-transparent',
}

const KIND_ICON_COLOR: Partial<Record<OrchestratorUIBlockKind, string>> = {
  planning_summary: 'text-violet-300',
  planning_tasks: 'text-emerald-300',
  planning_focus_blocks: 'text-cyan-300',
  planning_overload: 'text-red-300',
  planning_rebalance: 'text-amber-300',
  planning_recommendations: 'text-indigo-300',
}

// ─── Content Parsers ──────────────────────────────────────────────────────────

interface ParsedLine {
  type: 'bullet' | 'indent' | 'stat_row' | 'plain'
  text: string
}

function parseLine(raw: string): ParsedLine {
  const trimmed = raw.trim()
  if (!trimmed) return { type: 'plain', text: '' }

  if (trimmed.startsWith('↳ ') || trimmed.startsWith('  ↳')) {
    return { type: 'indent', text: trimmed.replace(/^↳\s*/, '').trim() }
  }
  if (trimmed.startsWith('•')) {
    return { type: 'bullet', text: trimmed.slice(1).trim() }
  }
  // "Key: value" pattern for stat rows
  const colonIdx = trimmed.indexOf(':')
  if (colonIdx > 0 && colonIdx < 24 && /^[A-Z]/.test(trimmed)) {
    return { type: 'stat_row', text: trimmed }
  }
  return { type: 'plain', text: trimmed }
}

// ─── Line Renderer ────────────────────────────────────────────────────────────

function ContentLine({ raw }: { raw: string }) {
  const parsed = parseLine(raw)
  if (!parsed.text) return <div className="h-1" />

  if (parsed.type === 'indent') {
    return (
      <BidiLine as="p" text={parsed.text} className="ml-4 text-[11px] leading-relaxed text-on-surface-variant/70 italic">
        {parsed.text}
      </BidiLine>
    )
  }

  if (parsed.type === 'bullet') {
    // Check for inline tags like [high], [carry-over], [deep work]
    const tagMatch = parsed.text.match(/^(.+?)(\s*\[.+?\])+(.*)$/)
    if (tagMatch) {
      const tags = [...parsed.text.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1])
      const cleanText = parsed.text.replace(/\s*\[[^\]]+\]/g, '').trim()
      return (
        <BidiLine text={cleanText} className="flex items-start gap-2 text-xs">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
          <div className="flex-1 min-w-0">
            <span className="text-on-surface/85">{cleanText}</span>
            <span className="ml-1.5 inline-flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide border border-current/20 bg-current/[0.08]"
                >
                  {tag}
                </span>
              ))}
            </span>
          </div>
        </BidiLine>
      )
    }
    return (
      <BidiLine text={parsed.text} className="flex items-start gap-2 text-xs">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
        <p className="min-w-0 flex-1 text-on-surface/85 leading-relaxed">{parsed.text}</p>
      </BidiLine>
    )
  }

  if (parsed.type === 'stat_row') {
    const colonIdx = parsed.text.indexOf(':')
    const label = parsed.text.slice(0, colonIdx).trim()
    const value = parsed.text.slice(colonIdx + 1).trim()
    return (
      <BidiLine text={parsed.text} className="flex items-baseline gap-1.5 text-xs">
        <span className="font-semibold text-on-surface-variant">{label}:</span>
        <span className="min-w-0 flex-1 text-on-surface/85">{value}</span>
      </BidiLine>
    )
  }

  return <BidiLine as="p" text={parsed.text} className="text-xs leading-relaxed text-on-surface/80" />
}

// ─── Block Component ──────────────────────────────────────────────────────────

interface PlanningUIBlockProps {
  block: OrchestratorUIBlock
  className?: string
}

export function PlanningUIBlock({ block, className }: PlanningUIBlockProps) {
  const Icon = KIND_ICON[block.kind] ?? Brain
  const accentClass = KIND_ACCENT[block.kind] ?? 'border-primary/[0.16] bg-surface-container-lowest/40'
  const iconColor = KIND_ICON_COLOR[block.kind] ?? 'text-violet-300'

  const lines = block.content.split('\n')

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

      {/* Content */}
      <div className="space-y-1.5">
        {lines.map((line, idx) => (
          <ContentLine key={idx} raw={line} />
        ))}
      </div>
    </div>
  )
}
