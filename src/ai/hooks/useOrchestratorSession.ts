import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { WorkspaceMode } from '../types'
import { createAIOrchestrator } from '../orchestrator'
import type { OrchestratorResponse, OrchestratorUIBlock, PendingToolConfirmation } from '../orchestrator/types'
import { createEdgeProvider } from '../providers'
import { useWorkspaceContext } from './useAIContext'

// ─── Internal Types ───────────────────────────────────────────────────────────

/** Message shape aligned with AIWorkspace's existing ChatMessage format. */
export interface SessionMessage {
  role: 'ai' | 'user' | 'system'
  text: string
  provider?: string
  /** Structured UI blocks attached to this AI message (e.g. brain dump extraction cards). */
  uiBlocks?: OrchestratorUIBlock[]
}

const WELCOME_MESSAGE: SessionMessage = {
  role: 'ai',
  text: 'I am ready with your WeeklyOS context. Choose a workflow, review the staged prompt, then send when you want the assistant to act.',
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseOrchestratorSessionReturn {
  /** The full message thread for display. */
  messages: SessionMessage[]
  /** True while a request is in flight. */
  isProcessing: boolean
  /** Write-tool proposals waiting for user approval. */
  pendingConfirmations: PendingToolConfirmation[]
  /** Last error message, if any. */
  error: string | null
  /** The workspace display context (for rendering mode sub-components). */
  workspaceContext: ReturnType<typeof useWorkspaceContext>['workspace']

  /** Send a user message through the full orchestrator pipeline. */
  send: (message: string) => Promise<OrchestratorResponse | null>
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
  const [error, setError] = useState<string | null>(null)

  // Stable orchestrator — recreated only when the provider changes (never in practice)
  const orchestratorRef = useRef(
    createAIOrchestrator({ provider: createEdgeProvider() })
  )

  // Ref-based guards to avoid stale closures inside async callbacks
  const isProcessingRef = useRef(false)
  const messagesRef = useRef(messages)
  const aiContextRef = useRef(aiContext)
  const activeModeRef = useRef(activeMode)

  useEffect(() => { messagesRef.current = messages }, [messages])
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

  // ── dismissConfirmation ────────────────────────────────────────────────────
  const dismissConfirmation = useCallback((confirmationId: string) => {
    setPendingConfirmations((prev) => prev.filter((c) => c.confirmationId !== confirmationId))
  }, [])

  // ── clearError ─────────────────────────────────────────────────────────────
  const clearError = useCallback(() => setError(null), [])

  return useMemo(
    () => ({
      messages,
      isProcessing,
      pendingConfirmations,
      error,
      workspaceContext,
      send,
      dismissConfirmation,
      clearError,
    }),
    [
      messages,
      isProcessing,
      pendingConfirmations,
      error,
      workspaceContext,
      send,
      dismissConfirmation,
      clearError,
    ]
  )
}
