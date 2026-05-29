import type { WorkspaceMode } from './types'

export interface AITelemetryEvent {
  name: string
  at?: string
  durationMs?: number
  mode?: WorkspaceMode
  provider?: string
  model?: string
  metadata?: Record<string, unknown>
}

const MAX_BUFFER_SIZE = 100
const telemetryBuffer: AITelemetryEvent[] = []

function isDevRuntime(): boolean {
  return Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV)
}

export function roundDuration(ms: number): number {
  return Math.max(0, Math.round(ms))
}

export function recordAITelemetry(event: AITelemetryEvent): AITelemetryEvent {
  const normalized = {
    ...event,
    at: event.at ?? new Date().toISOString(),
  }

  telemetryBuffer.push(normalized)
  if (telemetryBuffer.length > MAX_BUFFER_SIZE) telemetryBuffer.shift()

  if (isDevRuntime()) {
    console.debug('[ai.telemetry]', normalized)
  }

  return normalized
}

export function getAITelemetryEvents(): AITelemetryEvent[] {
  return [...telemetryBuffer]
}

export function clearAITelemetryEvents(): void {
  telemetryBuffer.length = 0
}
