// ─── useVoiceRecognition ───────────────────────────────────────────────────────
// Thin wrapper around the Web Speech API (SpeechRecognition / webkitSpeechRecognition).
//
// Responsibilities:
//   • Detect browser support
//   • Create and configure the recognition instance
//   • Surface live interim + final transcripts via callbacks
//   • Clean up on stop / unmount
//
// This hook is INTERNAL — consumed only by useVoiceRecorder (the public API).

import { useCallback, useEffect, useRef } from 'react'

// ── Ambient Web Speech API types ─────────────────────────────────────────────
// The Web Speech API isn't always in scope when tsconfig "types" is set.
// We declare only the subset we use rather than pulling in a separate @types pkg.

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
}

export function isSpeechRecognitionAvailable(): boolean {
  return !!(typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition))
}

function getSpeechRecognitionConstructor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}


// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseVoiceRecognitionOptions {
  /** Called on every interim transcript update (live display). */
  onInterimTranscript: (text: string) => void
  /** Called when a final transcript segment is available. */
  onFinalTranscript: (text: string) => void
  /** Called on recognition errors. */
  onError: (errorCode: string) => void
  /** Called when recognition ends (either naturally or on stop). */
  onEnd: () => void
}

export interface UseVoiceRecognitionReturn {
  /** Whether the Web Speech API is available in this browser. */
  available: boolean
  /** Start recognition. Returns false if unavailable. */
  start: () => boolean
  /** Stop recognition (fires onEnd after pending final results). */
  stop: () => void
  /** Abort immediately without waiting for final results. */
  abort: () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVoiceRecognition({
  onInterimTranscript,
  onFinalTranscript,
  onError,
  onEnd,
}: UseVoiceRecognitionOptions): UseVoiceRecognitionReturn {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const available = isSpeechRecognitionAvailable()

  // Stable callback refs — avoids recreating the recognition instance on every render
  const onInterimRef  = useRef(onInterimTranscript)
  const onFinalRef    = useRef(onFinalTranscript)
  const onErrorRef    = useRef(onError)
  const onEndRef      = useRef(onEnd)

  useEffect(() => { onInterimRef.current  = onInterimTranscript }, [onInterimTranscript])
  useEffect(() => { onFinalRef.current    = onFinalTranscript },   [onFinalTranscript])
  useEffect(() => { onErrorRef.current    = onError },              [onError])
  useEffect(() => { onEndRef.current      = onEnd },                [onEnd])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
      recognitionRef.current = null
    }
  }, [])

  const start = useCallback((): boolean => {
    const Ctor = getSpeechRecognitionConstructor()
    if (!Ctor) return false

    // Abort any previous instance cleanly
    recognitionRef.current?.abort()

    const recognition = new Ctor()
    recognition.continuous      = true
    recognition.interimResults  = true
    recognition.lang            = '' // inherit browser locale
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = ''
      let finalText   = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0]?.transcript ?? ''
        if (result.isFinal) {
          finalText += transcript
        } else {
          interimText += transcript
        }
      }

      if (interimText) onInterimRef.current(interimText)
      if (finalText)   onFinalRef.current(finalText)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' and 'aborted' are expected — don't surface as hard errors
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        onErrorRef.current(event.error)
      }
    }

    recognition.onend = () => {
      onEndRef.current()
    }

    recognitionRef.current = recognition
    recognition.start()
    return true
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const abort = useCallback(() => {
    recognitionRef.current?.abort()
  }, [])

  return { available, start, stop, abort }
}
