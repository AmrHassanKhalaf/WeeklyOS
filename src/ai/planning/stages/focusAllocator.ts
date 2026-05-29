import type { AIContext } from '../../types'
import type { FocusArea, PrioritizedTask, SuggestedFocusBlock, WorkloadAnalysis } from '../types'
import { DAY_SHORT_NAMES } from '../utils'

// ─── Theme Patterns ───────────────────────────────────────────────────────────

const THEME_PATTERNS: Array<{ theme: string; pattern: RegExp }> = [
  {
    theme: 'Backend & API',
    pattern:
      /\b(?:api|backend|server|database|db|sql|endpoint|service|microservice|route|schema|migration|query)\b/i,
  },
  {
    theme: 'Frontend & Design',
    pattern:
      /\b(?:frontend|ui|ux|design|component|interface|css|style|layout|figma|visual|page|screen|modal|button)\b/i,
  },
  {
    theme: 'Writing & Docs',
    pattern:
      /\b(?:write|writing|document|documentation|blog|article|content|draft|outline|report|readme|spec)\b/i,
  },
  {
    theme: 'Communication',
    pattern:
      /\b(?:email|slack|message|reply|call|meeting|respond|send|follow[\s-]up|notify|feedback|ping)\b/i,
  },
  {
    theme: 'Review & Testing',
    pattern:
      /\b(?:review|code[\s-]review|test|testing|qa|bug|fix|issue|pr|pull[\s-]request|validate|verify)\b/i,
  },
  {
    theme: 'Research & Learning',
    pattern: /\b(?:research|explore|study|learn|investigate|read|analyze|evaluate|understand|prototype)\b/i,
  },
  {
    theme: 'Planning & Admin',
    pattern:
      /\b(?:plan|schedule|organize|setup|configure|manage|track|update|admin|prepare|coordinate|arrange)\b/i,
  },
]

function detectTheme(title: string): string {
  for (const { theme, pattern } of THEME_PATTERNS) {
    if (pattern.test(title)) return theme
  }
  return 'General Work'
}

// ─── Focus Allocator ──────────────────────────────────────────────────────────

/**
 * Groups prioritized tasks into thematic focus areas and suggests batched
 * focus blocks to minimize context switching.
 *
 * Design decisions:
 * - Only themes with ≥ 2 tasks become explicit focus areas
 * - Single-task themes are absorbed into "General Work"
 * - Focus blocks are recommended for the peak day when available
 * - Duration estimates are based on task count × 45 min for deep work
 */
export function allocateFocusBlocks(
  prioritizedTasks: PrioritizedTask[],
  workload: WorkloadAnalysis,
  context: AIContext
): { focusAreas: FocusArea[]; suggestedFocusBlocks: SuggestedFocusBlock[] } {
  // Group tasks by theme
  const themeMap = new Map<string, PrioritizedTask[]>()

  for (const task of prioritizedTasks) {
    const theme = detectTheme(task.title)
    const existing = themeMap.get(theme) ?? []
    themeMap.set(theme, [...existing, task])
  }

  // Build focus areas (themes with ≥ 2 tasks)
  const focusAreas: FocusArea[] = []
  const suggestedFocusBlocks: SuggestedFocusBlock[] = []

  for (const [theme, tasks] of themeMap.entries()) {
    if (tasks.length < 2) continue

    focusAreas.push({
      theme,
      taskCount: tasks.length,
      taskTitles: tasks.map((t) => t.title),
      reason: `${tasks.length} related tasks — batch them to reduce context switching`,
    })
  }

  // Build focus block suggestions for each area
  const peakDay = workload.peakDay
  const peakDayLabel = workload.peakDayLabel
  const overloadedDaySet = new Set(workload.overloadedDays.map((d) => d.day))

  for (const area of focusAreas) {
    const deepTasks = (themeMap.get(area.theme) ?? []).filter(
      (t) => t.focusType === 'deep'
    )
    const isDeeWorkTheme = deepTasks.length > 0

    // Recommend the peak day unless it's overloaded; otherwise leave unset
    const recDay =
      peakDay && !overloadedDaySet.has(peakDay) && isDeeWorkTheme ? peakDay : undefined
    const recDayLabel = recDay ? (DAY_SHORT_NAMES[recDay] ?? undefined) : undefined

    const durationMinutes = Math.min(
      isDeeWorkTheme ? 90 : 60,
      area.taskCount * (isDeeWorkTheme ? 45 : 30)
    )

    const reason = recDay
      ? `${peakDayLabel} is your peak output day — ideal for ${area.theme} focus`
      : `Grouping ${area.taskCount} ${area.theme} tasks reduces context switching`

    suggestedFocusBlocks.push({
      label: `${area.theme} Block`,
      theme: area.theme,
      recommendedDay: recDay,
      recommendedDayLabel: recDayLabel,
      durationMinutes,
      reason,
      taskTitles: area.taskTitles.slice(0, 3),
    })
  }

  // Add a deep-work protection block for the highest-priority deep task
  const topDeepTask = prioritizedTasks.find((t) => t.focusType === 'deep' && t.priority === 'high')
  if (topDeepTask && !focusAreas.some((a) => a.taskTitles.includes(topDeepTask.title))) {
    const recDay =
      peakDay && !overloadedDaySet.has(peakDay) ? peakDay : workload.quietDays[0]
    suggestedFocusBlocks.push({
      label: `Protected Deep Work`,
      theme: 'High-Priority Focus',
      recommendedDay: recDay,
      recommendedDayLabel: recDay ? DAY_SHORT_NAMES[recDay] : undefined,
      durationMinutes: 90,
      reason: `"${topDeepTask.title}" is high-priority deep work — needs an uninterrupted window`,
      taskTitles: [topDeepTask.title],
    })
  }

  // If no focus sessions logged, suggest establishing a baseline
  if (context.focus.sessionCount === 0 && prioritizedTasks.length > 0) {
    suggestedFocusBlocks.push({
      label: 'First Focus Session',
      theme: 'Focus Baseline',
      durationMinutes: 25,
      reason: 'No focus sessions logged this week — start with one 25-min Pomodoro to build momentum',
      taskTitles: prioritizedTasks.slice(0, 1).map((t) => t.title),
    })
  }

  return { focusAreas, suggestedFocusBlocks }
}
