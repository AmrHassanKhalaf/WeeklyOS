import type { AIContext } from '../../types'
import type { FocusType, PrioritizedTask, WorkloadAnalysis } from '../types'
import { WEEK_ORDER } from '../utils'

// ─── Score Weights ────────────────────────────────────────────────────────────

const PRIORITY_BASE: Record<string, number> = { high: 60, medium: 35, low: 15 }
const CARRY_OVER_BONUS = 25
const HIGH_PRIORITY_BONUS = 10
const UNSCHEDULED_BONUS = 8
const OVERLOAD_DAY_PENALTY = -12

const MAX_TASKS = 10

// ─── Focus Type Detection ─────────────────────────────────────────────────────

const DEEP_WORK_PATTERN =
  /\b(?:build|implement|design|research|debug|write|develop|architect|refactor|analyze|migrate|create|code|engineer|draft|model|prototype|configure|integrate)\b/i

const QUICK_WIN_PATTERN =
  /\b(?:send|call|reply|check|confirm|verify|book|schedule|update|notify|share|post|review|approve|submit|close|ping|ack|acknowledge)\b/i

function parseEstimatedMinutes(est: string): number | null {
  const hourMatch = est.match(/(\d+(?:\.\d+)?)\s*h/i)
  const minMatch = est.match(/(\d+)\s*m/i)
  if (hourMatch) return Math.round(parseFloat(hourMatch[1]) * 60)
  if (minMatch) return parseInt(minMatch[1])
  return null
}

function inferFocusType(title: string, estimatedTime?: string): FocusType {
  if (estimatedTime) {
    const mins = parseEstimatedMinutes(estimatedTime)
    if (mins !== null && mins <= 30) return 'quick_win'
  }
  if (QUICK_WIN_PATTERN.test(title)) return 'quick_win'
  if (DEEP_WORK_PATTERN.test(title)) return 'deep'
  return 'shallow'
}

// ─── Prioritizer ─────────────────────────────────────────────────────────────

/**
 * Scores and ranks all pending tasks into a prioritized list with explicit
 * reasoning for each score.
 *
 * Scoring formula:
 *   base (priority level) + carry-over bonus + high-priority bonus
 *   + unscheduled bonus - overloaded-day penalty
 *
 * The reasoning is transparent: every signal that affected the score is
 * recorded in `urgencySignals` and surfaced in the UI.
 */
export function prioritizeTasks(
  context: AIContext,
  workload: WorkloadAnalysis
): PrioritizedTask[] {
  const todayOrder = context.today ? (WEEK_ORDER[context.today.day] ?? -1) : -1
  const overloadedDaySet = new Set(workload.overloadedDays.map((d) => d.day))

  return context.tasks.items
    .filter((t) => t.status === 'pending')
    .map((task): PrioritizedTask => {
      let score = PRIORITY_BASE[task.priority] ?? 35
      const urgencySignals: string[] = []
      const reasons: string[] = []

      // ── Carry-over: task scheduled for a past day ────────────────────────
      const isCarryOver =
        task.day != null &&
        todayOrder >= 0 &&
        (WEEK_ORDER[task.day] ?? 999) < todayOrder

      if (isCarryOver) {
        score += CARRY_OVER_BONUS
        urgencySignals.push(`Carry-over from ${task.day}`)
        reasons.push(`Originally scheduled for ${task.day} — still unresolved`)
      }

      // ── High priority boost ──────────────────────────────────────────────
      if (task.priority === 'high') {
        score += HIGH_PRIORITY_BONUS
        urgencySignals.push('High priority')
      }

      // ── No day assigned ───────────────────────────────────────────────────
      if (!task.day) {
        score += UNSCHEDULED_BONUS
        urgencySignals.push('Not yet scheduled')
        reasons.push('No day assigned — needs placement this week')
      }

      // ── Overloaded day — signals candidate for rescheduling ─────────────
      if (task.day && overloadedDaySet.has(task.day)) {
        score += OVERLOAD_DAY_PENALTY
        urgencySignals.push(`On overloaded ${task.day}`)
        reasons.push(`${task.day} is overloaded — consider moving this to a lighter day`)
      }

      const reason =
        reasons[0] ??
        (task.priority === 'high'
          ? 'High-priority task requiring focused attention'
          : 'Pending task for this week')

      return {
        taskId: task.id,
        title: task.title,
        priority: task.priority,
        day: task.day,
        score: Math.max(0, Math.min(100, score)),
        reason,
        urgencySignals,
        focusType: inferFocusType(task.title, task.estimatedTime),
        estimatedTime: task.estimatedTime,
        isCarryOver: isCarryOver || undefined,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_TASKS)
}
