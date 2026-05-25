import { useMemo } from 'react'
import { defaultAIToolRegistry } from '../tools'
import type { AIToolId } from '../types'

export function useAITools(toolIds?: AIToolId[]) {
  return useMemo(
    () => ({
      registry: defaultAIToolRegistry,
      tools: toolIds ? defaultAIToolRegistry.resolve(toolIds) : defaultAIToolRegistry.list(),
    }),
    [toolIds]
  )
}
