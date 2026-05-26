import type {
  AIContext,
  DayOfWeek,
  OverloadedDayInfo,
  Priority,
  WorkspaceContextLayer,
} from '../../types'

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_DAYS: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

const DAY_SHORT_NAMES: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

const MAX_RECENT_ACTIVITIES = 5
const MAX_TOP_PENDING_TASKS = 7

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Derives the full workspace productivity layer from a normalized AIContext.
 *
 * All expensive aggregations live here — overload detection, peak day analysis,
 * continuity signals, and compact task summaries. No raw database rows are
 * included in the output; only structured summaries intended for AI consumption
 * and workspace display.
 */
export function buildWorkspaceContext(context: AIContext): WorkspaceContextLayer {
  const { week, tasks, focus, habits, brainDump, reflections, activity, metrics, today } = context

  // ─── Per-day analysis ─────────────────────────────────────────────────────
  let peakDay = 'Today'
  let peakCompleted = -1
  let riskDay = 'Today'
  let riskCount = 0
  let riskHighEffortCount = 0
  let riskTaskTitles: string[] = []
  let overloadedDay: OverloadedDayInfo | null = null

  for (const day of ALL_DAYS) {
    const dayMetrics = tasks.byDay[day]
    if (!dayMetrics) continue

    if (dayMetrics.completed > peakCompleted) {
      peakCompleted = dayMetrics.completed
      peakDay = DAY_SHORT_NAMES[day]
    }

    if (dayMetrics.pending > riskCount) {
      riskCount = dayMetrics.pending
      riskDay = DAY_SHORT_NAMES[day]

      const pendingDayTasks = tasks.items.filter((t) => t.day === day && t.status === 'pending')
      riskHighEffortCount = pendingDayTasks.filter((t) => t.priority === 'high').length
      riskTaskTitles = pendingDayTasks
        .slice(0, 2)
        .map((t) => t.title)
        .filter(Boolean)

      overloadedDay = {
        day,
        shortName: DAY_SHORT_NAMES[day],
        pendingCount: riskCount,
        highPriorityCount: riskHighEffortCount,
        topTaskTitles: riskTaskTitles,
      }
    }
  }

  // Clear overload signal if no day has any pending tasks
  if (riskCount === 0) overloadedDay = null

  // ─── Today context ────────────────────────────────────────────────────────
  const todayLabel = today?.label ?? 'Today'
  const todayDayMetrics = today ? (tasks.byDay[today.day] ?? null) : null
  const todayTaskCount = todayDayMetrics?.total ?? 0

  // ─── Derived AI signals ───────────────────────────────────────────────────
  const signalTitle =
    riskCount > 0
      ? `${riskDay} overload detected`
      : focus.sessionCount > 0
        ? 'Focus rhythm active'
        : 'Planning baseline ready'

  const riskTaskHint = riskTaskTitles.length ? `: ${riskTaskTitles.join(', ')}.` : '.'
  const signalBody =
    riskCount > 0
      ? `${riskCount} pending tasks are stacked together${
          riskHighEffortCount > 0
            ? `, including ${riskHighEffortCount} high-effort ${riskHighEffortCount === 1 ? 'item' : 'items'}`
            : ''
        }${riskTaskHint}`
      : `No overloaded day is visible. Peak output is ${peakDay}; keep that window clean for deep work.`

  // ─── Continuity signals ───────────────────────────────────────────────────
  const lastPlanActivity = activity.find((a) => /plan|planned|generated/i.test(a.text))
  const continuity = {
    lastPlanLabel: lastPlanActivity
      ? 'Last generated plan: recent activity'
      : 'Last generated plan: not logged yet',
    focusQualityLabel:
      focus.sessionCount > 0
        ? 'Focus quality: signal captured this week'
        : 'Focus quality: waiting for sessions',
    rolloverLabel:
      tasks.pending > tasks.completed
        ? `Rollover pressure: ${tasks.pending} unresolved tasks`
        : 'Rollover pressure: under control',
  }

  // ─── Top pending tasks (compact, sorted by priority) ─────────────────────
  const topPendingTasks = tasks.items
    .filter((t) => t.status === 'pending')
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, MAX_TOP_PENDING_TASKS)
    .map((t) => ({ title: t.title, priority: t.priority, day: t.day }))

  return {
    // Week
    weekTitle: week.title,
    weekNumber: week.weekNumber,
    dateRange: week.dateRange,
    score: week.score,

    // Task metrics
    totalPlanned: metrics.totalPlanned,
    totalCompleted: metrics.totalCompleted,
    pendingCount: metrics.pendingCount,
    completedCount: tasks.completed,
    completionRate: metrics.completionRate,

    // Today
    todayLabel,
    todayTaskCount,

    // Focus
    focusMinutes: focus.totalMinutes,
    focusSessionCount: focus.sessionCount,

    // Risk / Analysis
    peakDay,
    riskDay,
    riskCount,
    riskHighEffortCount,
    riskTaskTitles,
    overloadedDay,

    // Signals
    signalTitle,
    signalBody,
    continuity,

    // Activity & reflections
    recentActivities: activity.slice(0, MAX_RECENT_ACTIVITIES),
    reflections: {
      wentWell: reflections.wentWell,
      struggle: reflections.struggle,
      lessons: reflections.lessons,
    },

    // Compact aggregates
    habitCount: habits.items.length,
    habitCompletionCount: habits.completionCount,
    brainDumpCount: brainDump.items.length,
    brainDumpSelectedCount: brainDump.selectedCount,
    topPendingTasks,
  }
}
