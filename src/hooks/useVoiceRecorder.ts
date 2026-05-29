// ─── useVoiceRecorder ─────────────────────────────────────────────────────────
// Handles the full voice capture → upload → transcribe pipeline.
//
// State machine:
//   idle → recording → processing → idle (transcript delivered via onTranscript)
//
// Storage path: voice-responses/{userId}/{uuid}.webm
// This matches the RLS policy: foldername[1] = auth.uid()

import { useCallback, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export type VoiceRecorderState = 'idle' | 'recording' | 'processing'

export interface UseVoiceRecorderOptions {
  /** Called with the final transcript when transcription is complete. */
  onTranscript: (text: string) => void
  /** Called on any error (recording, upload, transcription). */
  onError?: (message: string) => void
}

export interface UseVoiceRecorderReturn {
  state: VoiceRecorderState
  isRecording: boolean
  isProcessing: boolean
  startRecording: () => Promise<void>
  stopRecording: () => void
  /** Abort recording without processing */
  cancelRecording: () => void
}

export function useVoiceRecorder({
  onTranscript,
  onError,
}: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [state, setState] = useState<VoiceRecorderState>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const handleError = useCallback(
    (msg: string) => {
      setState('idle')
      onError?.(msg)
      console.error('[useVoiceRecorder]', msg)
    },
    [onError],
  )

  // ── Start Recording ──────────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    if (state !== 'idle') return

    // Check browser support
    if (!navigator.mediaDevices?.getUserMedia) {
      handleError('Your browser does not support microphone access.')
      return
    }
    if (!window.MediaRecorder) {
      handleError('Your browser does not support audio recording.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Pick best supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
            ? 'audio/ogg;codecs=opus'
            : ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        void processRecording(mimeType || 'audio/webm')
      }

      mediaRecorderRef.current = recorder
      recorder.start(250) // collect chunks every 250ms
      setState('recording')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        handleError('Microphone permission denied. Please allow microphone access.')
      } else {
        handleError('Could not start recording. Please check your microphone.')
      }
    }
  }, [state, handleError]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop Recording ───────────────────────────────────────────────────────────

  const stopRecording = useCallback(() => {
    if (state !== 'recording') return
    setState('processing')
    mediaRecorderRef.current?.stop()
    // Release mic
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [state])

  // ── Cancel (discard) ─────────────────────────────────────────────────────────

  const cancelRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    chunksRef.current = []
    setState('idle')
  }, [])

  // ── Process: Upload → Transcribe ─────────────────────────────────────────────

  async function processRecording(mimeType: string) {
    const chunks = chunksRef.current
    chunksRef.current = []

    if (chunks.length === 0) {
      setState('idle')
      return
    }

    try {
      // 1. Get user session
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        handleError('You must be signed in to use voice recording.')
        return
      }

      // 2. Build blob
      const ext = mimeType.includes('ogg') ? 'ogg' : 'webm'
      const blob = new Blob(chunks, { type: mimeType })

      // 3. Upload to storage: voice-responses/{userId}/{uuid}.ext
      const uuid = crypto.randomUUID()
      const filePath = `${user.id}/${uuid}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('voice-responses')
        .upload(filePath, blob, {
          contentType: mimeType,
          upsert: false,
        })

      if (uploadErr) {
        handleError(`Upload failed: ${uploadErr.message}`)
        return
      }

      // 4. Call transcription edge function
      const { data: fnData, error: fnErr } = await supabase.functions.invoke('voice-transcribe', {
        body: { filePath },
      })

      if (fnErr) {
        handleError(`Transcription failed: ${fnErr.message}`)
        return
      }

      const transcript = (fnData as { transcript?: string })?.transcript ?? ''

      if (transcript.trim()) {
        onTranscript(transcript.trim())
      } else {
        handleError('No speech detected. Please try again.')
      }
    } catch (err) {
      handleError(`Unexpected error: ${(err as Error).message}`)
    } finally {
      setState('idle')
    }
  }

  return {
    state,
    isRecording: state === 'recording',
    isProcessing: state === 'processing',
    startRecording,
    stopRecording,
    cancelRecording,
  }
}
