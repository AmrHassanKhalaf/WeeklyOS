import { useMemo } from 'react'
import { buildAIContext } from '../context/buildAIContext'
import { buildWorkspaceContext } from '../context/layers/workspaceContext'
import type { AIContext, WorkspaceContextLayer } from '../types'
import { useBrainDumpStore } from '../../store/useBrainDumpStore'
import { useHabitStore } from '../../store/useHabitStore'
import { useWeekStore } from '../../store/useWeekStore'

/**
 * Returns the normalized AIContext assembled from all stores.
 * This is the canonical raw context — use it when you need access to
 * the full structured data or want to run assembleContext manually.
 */
export function useAIContext(): AIContext {
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

/**
 * Returns both the raw AIContext and the derived WorkspaceContextLayer.
 *
 * Prefer this hook inside workspace UI components that need display data
 * AND need to pass context to the AI layer. Avoids double store subscriptions.
 */
export function useWorkspaceContext(): {
  raw: AIContext
  workspace: WorkspaceContextLayer
} {
  const raw = useAIContext()
  const workspace = useMemo(() => buildWorkspaceContext(raw), [raw])
  return useMemo(() => ({ raw, workspace }), [raw, workspace])
}
