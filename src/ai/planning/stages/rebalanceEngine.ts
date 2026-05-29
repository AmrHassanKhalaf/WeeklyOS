import type { AIContext, DayOfWeek } from '../../types'
import type { RebalanceProposal, WorkloadAnalysis } from '../types'
import { ALL_DAYS, DAY_SHORT_NAMES } from '../utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_MAX_PROPOSALS = 3

// ─── Destination Finder ───────────────────────────────────────────────────────

/** Finds the least-loaded destination day that is not the source day. */
function findDestinationDay(
  sourceDay: DayOfWeek,
  workload: WorkloadAnalysis
): DayOfWeek | null {
  // Prefer quiet days first
  const quietCandidate = workload.quietDays.find((d) => d !== sourceDay)
  if (quietCandidate) return quietCandidate

  // Fall back to the non-overloaded day with fewest pending tasks
  const candidate = workload.dayPressures
    .filter((d) => d.day !== sourceDay && !d.isOverloaded)
    .sort((a, b) => a.totalPending - b.totalPending)[0]

  return candidate?.day ?? null
}

// ─── Impact Level ─────────────────────────────────────────────────────────────

function determineImpact(priority: string): 'minimal' | 'moderate' {
  return priority === 'medium' ? 'minimal' : 'moderate'
}

// ─── Rebalance Engine ─────────────────────────────────────────────────────────

/**
 * Generates concrete task-move proposals to relieve overloaded days.
 *
 * Strategy:
 * 1. Process overloaded days sorted by pressure (worst first)
 * 2. Move non-high-priority tasks from overloaded → lightest available day
 * 3. Never move high-priority tasks (they must stay or be manually moved)
 * 4. Include explicit reasoning for every proposed move
 * 5. Stop after maxProposals to avoid overwhelming the user
 *
 * All proposals require user confirmation — nothing writes to the store here.
 */
export function generateRebalanceProposals(
  context: AIContext,
  workload: WorkloadAnalysis,
  maxProposals: number = DEFAULT_MAX_PROPOSALS
): RebalanceProposal[] {
  const proposals: RebalanceProposal[] = []

  // Sort overloaded days by pressure descending — address worst first
  const sortedOverloaded = [...workload.overloadedDays].sort(
    (a, b) => b.pressureScore - a.pressureScore
  )

  for (const overloadedDay of sortedOverloaded) {
    if (proposals.length >= maxProposals) break

    const destinationDay = findDestinationDay(overloadedDay.day, workload)
    if (!destinationDay) continue

    // Candidates: pending, non-high-priority, on the overloaded day
    const moveCandidates = context.tasks.items
      .filter(
        (t) =>
          t.status === 'pending' &&
          t.day === overloadedDay.day &&
          t.priority !== 'high'
      )
      .sort((a, b) => {
        // Move low-priority first, then medium
        const order = { low: 0, medium: 1, high: 2 }
        return (order[a.priority] ?? 1) - (order[b.priority] ?? 1)
      })

    for (const task of moveCandidates) {
      if (proposals.length >= maxProposals) break

      const fromLabel = DAY_SHORT_NAMES[overloadedDay.day]
      const toLabel = DAY_SHORT_NAMES[destinationDay]

      proposals.push({
        taskId: task.id,
        taskTitle: task.title,
        taskPriority: task.priority,
        fromDay: overloadedDay.day,
        fromDayLabel: fromLabel,
        toDay: destinationDay,
        toDayLabel: toLabel,
        reason:
          `${fromLabel} has ${overloadedDay.totalPending} pending tasks (pressure: ${overloadedDay.pressureScore}/100). ` +
          `Moving "${task.title}" to ${toLabel} which has lighter load.`,
        impactLevel: determineImpact(task.priority),
      })
    }
  }

  return proposals
}

// ─── Carry-over Proposals ─────────────────────────────────────────────────────

/**
 * Generates proposals specifically for carry-over tasks (tasks scheduled for
 * past days that are still pending). These are higher urgency than normal
 * rebalance proposals.
 */
export function generateCarryOverProposals(
  context: AIContext,
  workload: WorkloadAnalysis,
  maxProposals: number = 2
): RebalanceProposal[] {
  if (workload.carryOverCount === 0) return []

  const todayDayIndex = context.today
    ? (ALL_DAYS.indexOf(context.today.day))
    : -1

  if (todayDayIndex < 0) return []

  const pastDays = ALL_DAYS.slice(0, todayDayIndex)
  const carryOverTasks = context.tasks.items.filter(
    (t) => t.status === 'pending' && t.day != null && pastDays.includes(t.day)
  )

  const proposals: RebalanceProposal[] = []
  const destination = context.today?.day ?? workload.quietDays[0] ?? 'friday'
  const destLabel = DAY_SHORT_NAMES[destination as DayOfWeek] ?? 'Today'

  for (const task of carryOverTasks.slice(0, maxProposals)) {
    if (!task.day) continue
    proposals.push({
      taskId: task.id,
      taskTitle: task.title,
      taskPriority: task.priority,
      fromDay: task.day,
      fromDayLabel: DAY_SHORT_NAMES[task.day],
      toDay: destination as DayOfWeek,
      toDayLabel: destLabel,
      reason: `"${task.title}" was scheduled for ${DAY_SHORT_NAMES[task.day]} but wasn't completed — reschedule to today (${destLabel}).`,
      impactLevel: 'minimal',
    })
  }

  return proposals
}
