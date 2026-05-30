import type { AIContext, AIContextTask, DayOfWeek } from '../../src/ai/types'

const createdAt = '2026-05-29T09:00:00.000Z'

function task(
  id: string,
  title: string,
  priority: AIContextTask['priority'],
  status: AIContextTask['status'],
  day: DayOfWeek,
  estimatedTime = '1h'
): AIContextTask {
  return {
    id,
    title,
    priority,
    status,
    day,
    estimatedTime,
  }
}

const tasks = [
  task('task-1', 'Ship AI audit fixes', 'high', 'pending', 'monday', '3h'),
  task('task-2', 'Review planning risks', 'high', 'pending', 'monday', '2h'),
  task('task-3', 'Write reflection notes', 'high', 'done', 'tuesday', '45m'),
  task('task-4', 'Trim backlog', 'medium', 'pending', 'monday', '1h'),
  task('task-5', 'Prepare weekly review', 'low', 'done', 'wednesday', '30m'),
  task('task-6', 'Schedule focus block', 'medium', 'pending', 'thursday', '1h'),
]

export function createAIRegressionContext(overrides: Partial<AIContext> = {}): AIContext {
  const base: AIContext = {
    createdAt,
    source: 'weeklyos',
    week: {
      id: 'week-audit',
      title: 'AI Architecture Audit Week',
      weekNumber: 22,
      year: 2026,
      dateRange: 'May 23 - May 29, 2026',
      score: 42,
    },
    tasks: {
      items: tasks,
      pending: 4,
      completed: 2,
      byDay: {
        monday: { total: 3, pending: 3, completed: 0 },
        tuesday: { total: 1, pending: 0, completed: 1 },
        wednesday: { total: 1, pending: 0, completed: 1 },
        thursday: { total: 1, pending: 1, completed: 0 },
      },
    },
    habits: {
      items: [
        { id: 'habit-1', name: 'Deep work', type: 'productivity', group_label: 'morning', is_active: true },
        { id: 'habit-2', name: 'Evening review', type: 'learning', group_label: 'evening', is_active: true },
      ],
      completionCount: 3,
    },
    focus: {
      sessions: [
        {
          id: 'session-1',
          user_id: 'user-1',
          task_id: 'task-1',
          start_time: '2026-05-26T08:00:00.000Z',
          end_time: '2026-05-26T08:45:00.000Z',
          duration_seconds: 2700,
          session_type: 'focus',
        },
        {
          id: 'session-2',
          user_id: 'user-1',
          task_id: 'task-3',
          start_time: '2026-05-27T09:00:00.000Z',
          end_time: '2026-05-27T09:30:00.000Z',
          duration_seconds: 1800,
          session_type: 'focus',
        },
      ],
      totalMinutes: 75,
      sessionCount: 2,
    },
    reflections: {
      wentWell: 'Focus blocks helped when they were protected.',
      struggle: 'Monday carried too much high-priority work.',
      lessons: 'Limit the number of critical items per day.',
    },
    activity: [
      { id: 'activity-1', text: 'Completed weekly review draft', time: 1779960000000, done: true },
    ],
    brainDump: {
      items: [],
      selectedCount: 0,
    },
    metrics: {
      totalPlanned: 6,
      totalCompleted: 2,
      completionRate: 33,
      pendingCount: 4,
    },
    today: {
      day: 'friday',
      label: 'Friday',
    },
  }

  return {
    ...base,
    ...overrides,
  }
}
