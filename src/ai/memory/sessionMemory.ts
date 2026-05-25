import type { AIMessage } from '../types'

export interface AIMemorySnapshot {
  messages: AIMessage[]
  updatedAt: string
}

export function createEmptyAIMemorySnapshot(): AIMemorySnapshot {
  return {
    messages: [],
    updatedAt: new Date().toISOString(),
  }
}
