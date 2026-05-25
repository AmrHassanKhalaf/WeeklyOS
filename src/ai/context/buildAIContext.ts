import type {
  AIContext,
  AIContextDayTaskMetrics,
  AIContextInput,
  AIContextTask,
  DayOfWeek,
} from '../types'

const dayNames: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function createDayMetrics(): Record<DayOfWeek, AIContextDayTaskMetrics> {
  return dayNames.reduce(
    (metrics, day) => ({
      ...metrics,
      [day]: { total: 0, pending: 0, completed: 0 },
    }),
    {} as Record<DayOfWeek, AIContextDayTaskMetrics>
  )
}

export function buildAIContext(input: AIContextInput): AIContext {
  const week = input.week
  const taskItems: AIContextTask[] =
    week?.days.flatMap((day) =>
      [day.highTask, ...day.mediumTasks, ...day.smallTasks]
        .filter((task): task is NonNullable<typeof task> => Boolean(task))
        .map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          day: task.day,
          type: task.type,
          estimatedTime: task.estimatedTime,
          actualDurationSeconds: task.actualDuration,
          tags: task.tags,
        }))
    ) ?? []

  const byDay = createDayMetrics()
  taskItems.forEach((task) => {
    if (!task.day) return
    byDay[task.day].total += 1
    if (task.status === 'done') byDay[task.day].completed += 1
    if (task.status === 'pending') byDay[task.day].pending += 1
  })

  const completed = taskItems.filter((task) => task.status === 'done').length
  const pending = taskItems.filter((task) => task.status === 'pending').length
  const totalPlanned = week?.totalPlanned ?? taskItems.length
  const totalCompleted = week?.totalCompleted ?? completed
  const focusSeconds = input.focusSessions.reduce((total, session) => total + session.duration_seconds, 0)
  const brainDumpItems = input.brainDumpItems ?? []

  return {
    createdAt: input.createdAt ?? new Date().toISOString(),
    source: 'weeklyos',
    week: {
      id: week?.id,
      title: week?.title ?? 'Current Week',
      weekNumber: week?.weekNumber,
      year: week?.year,
      dateRange: week?.dateRange ?? '',
      score: week?.score ?? 0,
    },
    tasks: {
      items: taskItems,
      pending,
      completed,
      byDay,
    },
    habits: {
      items:
        input.habits?.map((habit) => ({
          id: habit.id,
          name: habit.name,
          type: habit.type,
          group_label: habit.group_label,
          is_active: habit.is_active,
        })) ?? [],
      completionCount: input.habitCompletions?.length ?? 0,
    },
    focus: {
      sessions: input.focusSessions,
      totalMinutes: Math.round(focusSeconds / 60),
      sessionCount: input.focusSessions.length,
    },
    reflections: {
      wentWell: week?.evalWentWell,
      struggle: week?.evalStruggle,
      lessons: week?.evalLessons,
    },
    activity: week?.activities ?? [],
    brainDump: {
      items: brainDumpItems,
      selectedCount: brainDumpItems.filter((item) => item.selected).length,
    },
    metrics: {
      totalPlanned,
      totalCompleted,
      completionRate: totalPlanned ? Math.round((totalCompleted / totalPlanned) * 100) : 0,
      pendingCount: pending,
    },
  }
}
