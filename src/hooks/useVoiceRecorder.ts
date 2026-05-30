// ─── useVoiceRecorder (Hybrid Voice Input) ────────────────────────────────────
// PUBLIC API — used by AIWorkspace and any other composer that needs voice input.
//
// Strategy:
//   PRIMARY   Web Speech API — live interim transcript, zero upload, zero latency.
//   FALLBACK  MediaRecorder → Supabase Storage → Groq Whisper edge function.
//             Used when the browser doesn't support SpeechRecognition, or when
//             primary recognition throws a non-recoverable error.
//
// State machine:
//   idle → requesting_permission → recording → processing → idle
//                                            ↘ error → idle (via clearError)
//
// Orchestrator integration:
//   Transcripts are ONLY injected into the composer (onTranscript callback).
//   They are NEVER auto-sent or auto-triggering tools.

import { useCallback, useRef, useState } from 'react'
import { isSpeechRecognitionAvailable, useVoiceRecognition } from './useVoiceRecognition'
import { useVoiceFallback } from './useVoiceFallback'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Maximum duration for the primary (Web Speech) path. Prevents open sessions. */
const MAX_RECORDING_MS = 60_000

/** After the user stops speaking, wait this long before auto-stopping. */
const SILENCE_DEBOUNCE_MS = 2_500

// ── Types ─────────────────────────────────────────────────────────────────────

export type VoiceRecorderState =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'processing'
  | 'error'

export interface UseVoiceRecorderOptions {
  /** Fired with the final, normalized transcript. Append or set composer text here. */
  onTranscript: (text: string) => void
  /** Fired on any recoverable or fatal error with a user-friendly message. */
  onError?: (message: string) => void
}

export interface UseVoiceRecorderReturn {
  state: VoiceRecorderState
  /** Convenience alias: state === 'recording' */
  isRecording: boolean
  /** Convenience alias: state === 'processing' */
  isProcessing: boolean
  /** Live interim text from the primary path. Empty string on fallback path. */
  interimTranscript: string
  /** True when the Web Speech API primary path is available in this browser. */
  primaryAvailable: boolean
  /** Request mic access and begin recording. */
  startRecording: () => Promise<void>
  /** Stop recording and trigger transcription. */
  stopRecording: () => void
  /** Abort the current recording without transcribing. */
  cancelRecording: () => void
  /** Reset an error state back to idle. */
  clearError: () => void
}

// ── Transcript normalization ──────────────────────────────────────────────────

function normalizeTranscript(text: string): string {
  return text
    .trim()
    .replace(/\s{2,}/g, ' ')       // collapse multiple spaces
    .replace(/(\. )\1+/g, '. ')    // deduplicate repeated ". "
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVoiceRecorder({
  onTranscript,
  onError,
}: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [state, setState]               = useState<VoiceRecorderState>('idle')
  const [interimTranscript, setInterim] = useState('')
  const primaryAvailable                = isSpeechRecognitionAvailable()

  // ── Stable refs ─────────────────────────────────────────────────────────────
  const stateRef          = useRef<VoiceRecorderState>('idle')
  const finalBufferRef    = useRef('')   // accumulates final segments during primary session
  const maxTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const silenceTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const usingFallbackRef  = useRef(false)

  const setStateBoth = useCallback((s: VoiceRecorderState) => {
    stateRef.current = s
    setState(s)
  }, [])

  const clearTimers = useCallback(() => {
    if (maxTimerRef.current)     clearTimeout(maxTimerRef.current)
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    maxTimerRef.current     = null
    silenceTimerRef.current = null
  }, [])

  const handleError = useCallback((msg: string) => {
    clearTimers()
    setStateBoth('error')
    setInterim('')
    onError?.(msg)
    console.error('[useVoiceRecorder]', msg)
  }, [clearTimers, onError, setStateBoth])

  // ── Primary: Web Speech API callbacks ────────────────────────────────────────

  const handleInterim = useCallback((text: string) => {
    setInterim(text)
    // Reset silence timer on every interim result (user is still speaking)
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = setTimeout(() => {
      // Auto-stop after sustained silence
      if (stateRef.current === 'recording' && !usingFallbackRef.current) {
        primaryRecognition.stop()
      }
    }, SILENCE_DEBOUNCE_MS)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFinalSegment = useCallback((text: string) => {
    finalBufferRef.current += (finalBufferRef.current ? ' ' : '') + text
  }, [])

  const handleRecognitionError = useCallback((errorCode: string) => {
    clearTimers()
    if (stateRef.current !== 'recording') return

    // 'network' is the most common non-trivial error on Chrome
    if (errorCode === 'network') {
      handleError('Voice recognition failed — check your internet connection.')
    } else if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
      handleError('Microphone permission denied. Please allow microphone access.')
    } else {
      // Silently fall back to upload path for other errors
      usingFallbackRef.current = true
      setInterim('')
      void fallback.startRecording()
    }
  }, [clearTimers, handleError]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRecognitionEnd = useCallback(() => {
    clearTimers()
    if (stateRef.current !== 'recording') return

    const final = normalizeTranscript(finalBufferRef.current)
    finalBufferRef.current = ''
    setInterim('')

    if (final) {
      onTranscript(final)
      setStateBoth('idle')
    } else {
      // No final text captured — try the fallback if not already using it
      if (!usingFallbackRef.current) {
        usingFallbackRef.current = true
        void fallback.startRecording()
      } else {
        handleError('No speech detected. Please try again.')
      }
    }
  }, [clearTimers, handleError, onTranscript, setStateBoth]) // eslint-disable-line react-hooks/exhaustive-deps

  // Primary recognition instance
  const primaryRecognition = useVoiceRecognition({
    onInterimTranscript: handleInterim,
    onFinalTranscript:   handleFinalSegment,
    onError:             handleRecognitionError,
    onEnd:               handleRecognitionEnd,
  })

  // ── Fallback: upload → edge function callbacks ────────────────────────────────

  const handleFallbackTranscript = useCallback((text: string) => {
    const normalized = normalizeTranscript(text)
    if (normalized) onTranscript(normalized)
    setStateBoth('idle')
  }, [onTranscript, setStateBoth])

  const handleFallbackError = useCallback((msg: string) => {
    handleError(msg)
  }, [handleError])

  const fallback = useVoiceFallback({
    onTranscript: handleFallbackTranscript,
    onError:      handleFallbackError,
  })

  // ── Public API ───────────────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    if (stateRef.current !== 'idle') return

    setStateBoth('requesting_permission')
    finalBufferRef.current = ''
    usingFallbackRef.current = false

    if (primaryAvailable) {
      // Primary path: Web Speech API
      const started = primaryRecognition.start()
      if (started) {
        setStateBoth('recording')
        // Safety: auto-stop after max duration
        maxTimerRef.current = setTimeout(() => {
          if (stateRef.current === 'recording') {
            primaryRecognition.stop()
          }
        }, MAX_RECORDING_MS)
      } else {
        // Should not happen if isSpeechRecognitionAvailable() is true, but handle gracefully
        usingFallbackRef.current = true
        try {
          await fallback.startRecording()
          setStateBoth('recording')
        } catch {
          handleError('Could not start recording. Please check your microphone.')
        }
      }
    } else {
      // Fallback path: upload-based
      usingFallbackRef.current = true
      try {
        await fallback.startRecording()
        setStateBoth('recording')
      } catch {
        handleError('Could not start recording. Please check your microphone.')
      }
    }
  }, [fallback, handleError, primaryAvailable, primaryRecognition, setStateBoth])

  const stopRecording = useCallback(() => {
    if (stateRef.current !== 'recording') return
    clearTimers()

    if (!usingFallbackRef.current) {
      // Primary path: stopping triggers onend → handleRecognitionEnd
      primaryRecognition.stop()
      setStateBoth('processing')
    } else {
      // Fallback path: triggers upload → transcription pipeline
      setStateBoth('processing')
      fallback.stopRecording()
    }
  }, [clearTimers, fallback, primaryRecognition, setStateBoth])

  const cancelRecording = useCallback(() => {
    clearTimers()
    if (!usingFallbackRef.current) {
      primaryRecognition.abort()
    } else {
      fallback.cancelRecording()
    }
    finalBufferRef.current = ''
    usingFallbackRef.current = false
    setInterim('')
    setStateBoth('idle')
  }, [clearTimers, fallback, primaryRecognition, setStateBoth])

  const clearError = useCallback(() => {
    if (stateRef.current === 'error') {
      setStateBoth('idle')
    }
  }, [setStateBoth])

  return {
    state,
    isRecording:       state === 'recording',
    isProcessing:      state === 'processing',
    interimTranscript,
    primaryAvailable,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError,
  }
}
