import { useMemo } from 'react'
import { getWorkspaceModeDefinition } from '../modes'
import { defaultAIToolRegistry } from '../tools'
import type { WorkspaceMode } from '../types'
import { useAIContext } from './useAIContext'
import { useAIMode } from './useAIMode'

export function useAIWorkspace(initialMode: WorkspaceMode = 'plan') {
  const context = useAIContext()
  const mode = useAIMode(initialMode)
  const tools = useMemo(
    () => defaultAIToolRegistry.resolve(getWorkspaceModeDefinition(mode.activeMode).allowedToolIds),
    [mode.activeMode]
  )

  return {
    context,
    tools,
    ...mode,
  }
}
