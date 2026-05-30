import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { WorkspaceMode } from '../types'
import { applyToolConfirmation } from '../confirmations/applyToolConfirmation'
import { createAIOrchestrator } from '../orchestrator'
import type { OrchestratorResponse, OrchestratorUIBlock, PendingToolConfirmation } from '../orchestrator/types'
import { createEdgeProvider } from '../providers'
import { recordAITelemetry, roundDuration } from '../telemetry'
import { useWorkspaceContext } from './useAIContext'

// ─── Internal Types ───────────────────────────────────────────────────────────

/** Message shape aligned with AIWorkspace's existing ChatMessage format. */
export interface SessionMessage {
  role: 'ai' | 'user' | 'system'
  text: string
  provider?: string
  latencyMs?: number
  /** Structured UI blocks attached to this AI message (e.g. brain dump extraction cards). */
  uiBlocks?: OrchestratorUIBlock[]
}

const WELCOME_MESSAGE: SessionMessage = {
  role: 'ai',
  text: 'I am ready with your WeeklyOS context. Choose a workflow, review the staged prompt, then send when you want the assistant to act.',
}

function readResponseLatencyMs(response: OrchestratorResponse, fallbackStartedAt: number) {
  const telemetry = response.metadata?.telemetry
  if (telemetry && typeof telemetry === 'object' && 'totalMs' in telemetry) {
    const totalMs = (telemetry as { totalMs?: unknown }).totalMs
    if (typeof totalMs === 'number') return totalMs
  }
  return roundDuration(performance.now() - fallbackStartedAt)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseOrchestratorSessionReturn {
  /** The full message thread for display. */
  messages: SessionMessage[]
  /** True while a request is in flight. */
  isProcessing: boolean
  /** Write-tool proposals waiting for user approval. */
  pendingConfirmations: PendingToolConfirmation[]
  /** Confirmation currently being applied to the store, if any. */
  applyingConfirmationId: string | null
  /** Last error message, if any. */
  error: string | null
  /** The workspace display context (for rendering mode sub-components). */
  workspaceContext: ReturnType<typeof useWorkspaceContext>['workspace']

  /** Send a user message through the full orchestrator pipeline. */
  send: (message: string) => Promise<OrchestratorResponse | null>
  /** Apply a pending confirmation and commit the proposed store mutation. */
  applyConfirmation: (confirmationId: string) => Promise<void>
  /** Dismiss a pending confirmation without executing. */
  dismissConfirmation: (confirmationId: string) => void
  /** Clear the last error. */
  clearError: () => void
}

/**
 * Manages a full orchestrator conversation session.
 *
 * Responsibilities:
 * - Owns message thread state (initialized with a welcome message)
 * - Creates and reuses the orchestrator + edge provider
 * - Passes assembled AIContext from stores on every send()
 * - Manages pending tool confirmations
 * - Handles errors gracefully
 *
 * The `activeMode` parameter is read at send() time so switching modes between
 * sends always reflects the current workspace mode.
 */
export function useOrchestratorSession(activeMode: WorkspaceMode): UseOrchestratorSessionReturn {
  const { raw: aiContext, workspace: workspaceContext } = useWorkspaceContext()

  const [messages, setMessages] = useState<SessionMessage[]>([WELCOME_MESSAGE])
  const [isProcessing, setIsProcessing] = useState(false)
  const [pendingConfirmations, setPendingConfirmations] = useState<PendingToolConfirmation[]>([])
  const [applyingConfirmationId, setApplyingConfirmationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Stable orchestrator — recreated only when the provider changes (never in practice)
  const orchestratorRef = useRef(
    createAIOrchestrator({ provider: createEdgeProvider() })
  )

  // Ref-based guards to avoid stale closures inside async callbacks
  const isProcessingRef = useRef(false)
  const applyingConfirmationRef = useRef<string | null>(null)
  const messagesRef = useRef(messages)
  const pendingConfirmationsRef = useRef(pendingConfirmations)
  const aiContextRef = useRef(aiContext)
  const activeModeRef = useRef(activeMode)

  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { pendingConfirmationsRef.current = pendingConfirmations }, [pendingConfirmations])
  useEffect(() => { aiContextRef.current = aiContext }, [aiContext])
  useEffect(() => { activeModeRef.current = activeMode }, [activeMode])

  // ── send ───────────────────────────────────────────────────────────────────
  const send = useCallback(async (userMessage: string): Promise<OrchestratorResponse | null> => {
    if (isProcessingRef.current) return null
    isProcessingRef.current = true
    setIsProcessing(true)
    setError(null)

    // Optimistically append user message
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }])

    try {
      const requestStartedAt = performance.now()
      // Build history from the current thread (exclude system messages)
      const history = messagesRef.current
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'ai' ? 'assistant' : (m.role as 'user' | 'assistant'),
          content: m.text,
        }))

      const response = await orchestratorRef.current.execute({
        userMessage,
        mode: activeModeRef.current,
        context: aiContextRef.current,
        history,
      })

      // Append AI response (with optional structured UI blocks)
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: response.message,
          provider: response.provider,
          latencyMs: readResponseLatencyMs(response, requestStartedAt),
          uiBlocks: response.uiBlocks,
        },
      ])

      // Handle pending confirmations
      if (response.pendingConfirmations?.length) {
        setPendingConfirmations((prev) => [...prev, ...(response.pendingConfirmations ?? [])])
        const count = response.pendingConfirmations.length
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            text: `${count} action${count > 1 ? 's' : ''} staged for review. Confirm or dismiss them before proceeding.`,
          },
        ])
      }

      return response
    } catch (err) {
      const errText = err instanceof Error ? err.message : 'Unexpected orchestrator error'
      setError(errText)
      setMessages((prev) => [
        ...prev,
        { role: 'system', text: `AI request failed: ${errText}` },
      ])
      return null
    } finally {
      isProcessingRef.current = false
      setIsProcessing(false)
    }
  }, []) // stable — uses refs for all dynamic values

  // ── applyConfirmation ──────────────────────────────────────────────────────
  const applyConfirmation = useCallback(async (confirmationId: string) => {
    if (applyingConfirmationRef.current) return

    const confirmation = pendingConfirmationsRef.current.find((item) => item.confirmationId === confirmationId)
    if (!confirmation) return

    const startedAt = performance.now()
    applyingConfirmationRef.current = confirmationId
    setApplyingConfirmationId(confirmationId)
    setError(null)

    try {
      const result = await applyToolConfirmation(confirmation)
      setPendingConfirmations((prev) => prev.filter((item) => item.confirmationId !== confirmationId))
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          text: result.message,
        },
      ])
      recordAITelemetry({
        name: 'ai.confirmation.apply',
        durationMs: roundDuration(performance.now() - startedAt),
        mode: activeModeRef.current,
        metadata: {
          toolId: confirmation.toolId,
          appliedCount: result.appliedCount,
        },
      })
    } catch (err) {
      const errText = err instanceof Error ? err.message : 'Failed to apply confirmation'
      setError(errText)
      setMessages((prev) => [
        ...prev,
        { role: 'system', text: `Confirmation failed: ${errText}` },
      ])
    } finally {
      applyingConfirmationRef.current = null
      setApplyingConfirmationId(null)
    }
  }, [])

  // ── dismissConfirmation ────────────────────────────────────────────────────
  const dismissConfirmation = useCallback((confirmationId: string) => {
    const confirmation = pendingConfirmationsRef.current.find((item) => item.confirmationId === confirmationId)
    setPendingConfirmations((prev) => prev.filter((c) => c.confirmationId !== confirmationId))
    if (confirmation) {
      setMessages((prev) => [
        ...prev,
        { role: 'system', text: `Dismissed ${confirmation.toolName}.` },
      ])
      recordAITelemetry({
        name: 'ai.confirmation.dismiss',
        mode: activeModeRef.current,
        metadata: { toolId: confirmation.toolId },
      })
    }
  }, [])

  // ── clearError ─────────────────────────────────────────────────────────────
  const clearError = useCallback(() => setError(null), [])

  return useMemo(
    () => ({
      messages,
      isProcessing,
      pendingConfirmations,
      applyingConfirmationId,
      error,
      workspaceContext,
      send,
      applyConfirmation,
      dismissConfirmation,
      clearError,
    }),
    [
      messages,
      isProcessing,
      pendingConfirmations,
      applyingConfirmationId,
      error,
      workspaceContext,
      send,
      applyConfirmation,
      dismissConfirmation,
      clearError,
    ]
  )
}
