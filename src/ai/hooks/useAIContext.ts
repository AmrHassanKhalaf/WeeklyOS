import { useMemo } from 'react'
import { buildAIContext } from '../context'
import { useBrainDumpStore } from '../../store/useBrainDumpStore'
import { useHabitStore } from '../../store/useHabitStore'
import { useWeekStore } from '../../store/useWeekStore'

export function useAIContext() {
  const currentWeek = useWeekStore((state) => state.currentWeek)
  const focusSessions = useWeekStore((state) => state.focusSessions)
  const habits = useHabitStore((state) => state.habits)
  const habitCompletions = useHabitStore((state) => state.completions)
  const brainDumpItems = useBrainDumpStore((state) => state.brainDumpItems)

  return useMemo(
    () =>
      buildAIContext({
        week: currentWeek,
        focusSessions,
        habits,
        habitCompletions,
        brainDumpItems,
      }),
    [brainDumpItems, currentWeek, focusSessions, habitCompletions, habits]
  )
}
