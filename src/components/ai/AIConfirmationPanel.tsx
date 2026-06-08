import { CheckCircle2, ShieldCheck, X } from 'lucide-react'
import type { PendingToolConfirmation } from '../../ai/orchestrator/types'
import { cn } from '../../lib/cn'
import { BidiText } from '../ui/BidiText'

interface AIConfirmationPanelProps {
  confirmations: PendingToolConfirmation[]
  applyingConfirmationId: string | null
  onApply: (confirmationId: string) => void
  onDismiss: (confirmationId: string) => void
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function summarizeConfirmation(confirmation: PendingToolConfirmation): string {
  const output = asRecord(confirmation.proposedOutput)

  if (confirmation.toolId === 'createTask') {
    const proposedTask = asRecord(output.proposedTask)
    return typeof proposedTask.title === 'string' ? proposedTask.title : 'New task'
  }

  if (confirmation.toolId === 'updateTask') {
    const updates = asRecord(output.proposedUpdates)
    const fields = Object.keys(updates)
    return fields.length > 0 ? fields.join(', ') : 'Task update'
  }

  if (confirmation.toolId === 'rescheduleTasks') {
    const moves = Array.isArray(output.rebalanceSuggestions) ? output.rebalanceSuggestions.length : 0
    return `${moves} task move${moves === 1 ? '' : 's'}`
  }

  return confirmation.toolName
}

export function AIConfirmationPanel({
  confirmations,
  applyingConfirmationId,
  onApply,
  onDismiss,
}: AIConfirmationPanelProps) {
  if (confirmations.length === 0) return null

  return (
    <div className="mb-2 grid gap-2">
      {confirmations.map((confirmation) => {
        const isApplying = applyingConfirmationId === confirmation.confirmationId
        return (
          <div
            key={confirmation.confirmationId}
            className="rounded-2xl border border-amber-200/[0.18] bg-amber-300/[0.08] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
          >
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-100" strokeWidth={1.8} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black text-amber-50">{confirmation.toolName}</p>
                <BidiText
                  as="p"
                  text={summarizeConfirmation(confirmation)}
                  className="mt-0.5 truncate text-[11px] font-semibold text-amber-100/[0.72]"
                />
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onApply(confirmation.confirmationId)}
                  disabled={Boolean(applyingConfirmationId)}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-200/[0.24] bg-emerald-400/[0.12] text-emerald-100 transition-[background-color,border-color,opacity] hover:border-emerald-100/[0.45] hover:bg-emerald-400/[0.2] disabled:cursor-not-allowed disabled:opacity-45 focus-ring',
                    isApplying && 'animate-pulse'
                  )}
                  title="Apply"
                  aria-label={`Apply ${confirmation.toolName}`}
                >
                  <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss(confirmation.confirmationId)}
                  disabled={Boolean(applyingConfirmationId)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.12] bg-black/[0.12] text-amber-100/[0.72] transition-[background-color,border-color,color,opacity] hover:border-white/[0.24] hover:bg-black/[0.2] hover:text-white disabled:cursor-not-allowed disabled:opacity-45 focus-ring"
                  title="Dismiss"
                  aria-label={`Dismiss ${confirmation.toolName}`}
                >
                  <X className="h-4 w-4" strokeWidth={1.9} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
