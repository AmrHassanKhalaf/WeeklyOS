import { useMemo, useState } from 'react'
import { getWorkspaceModeDefinition } from '../modes'
import type { WorkspaceMode } from '../types'

export function useAIMode(initialMode: WorkspaceMode = 'plan') {
  const [activeMode, setActiveMode] = useState<WorkspaceMode>(initialMode)
  const modeDefinition = useMemo(() => getWorkspaceModeDefinition(activeMode), [activeMode])

  return {
    activeMode,
    modeDefinition,
    setActiveMode,
  }
}
