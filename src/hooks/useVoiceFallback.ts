// ─── useVoiceFallback ─────────────────────────────────────────────────────────
// Upload-based transcription fallback:
//   MediaRecorder → Supabase Storage → voice-transcribe Edge Function → transcript
//
// Used when:
//   • Web Speech API is unavailable (Firefox, some mobile browsers)
//   • SpeechRecognition throws a non-recoverable error
//   • Caller explicitly requests upload mode
//
// This hook is INTERNAL — consumed only by useVoiceRecorder (the public API).

import { useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB hard cap

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseVoiceFallbackOptions {
  onTranscript: (text: string) => void
  onError: (message: string) => void
}

export interface UseVoiceFallbackReturn {
  /** Start recording. Resolves when mic is acquired; rejects on permission denial. */
  startRecording: () => Promise<void>
  /** Stop recording and begin the upload → transcription pipeline. */
  stopRecording: () => void
  /** Discard the current recording immediately, no upload. */
  cancelRecording: () => void
  /** True while MediaRecorder is capturing audio. */
  isRecording: boolean
  /** True while uploading + transcribing. */
  isProcessing: boolean
}

// ── Preferred MIME type resolution ───────────────────────────────────────────

function pickMimeType(): string {
  for (const mimeType of [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]) {
    if (MediaRecorder.isTypeSupported(mimeType)) return mimeType
  }
  return ''
}

function mimeToExtension(mimeType: string): string {
  if (mimeType.includes('ogg'))  return 'ogg'
  if (mimeType.includes('mp4'))  return 'mp4'
  return 'webm'
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVoiceFallback({
  onTranscript,
  onError,
}: UseVoiceFallbackOptions): UseVoiceFallbackReturn {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef        = useRef<MediaStream | null>(null)
  const chunksRef        = useRef<Blob[]>([])
  const mimeTypeRef      = useRef<string>('')
  const isRecordingRef   = useRef(false)
  const isProcessingRef  = useRef(false)
  // Force re-render not needed — callers read state from useVoiceRecorder

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  // ── Start ────────────────────────────────────────────────────────────────────

  const startRecording = useCallback(async (): Promise<void> => {
    if (isRecordingRef.current || isProcessingRef.current) return

    if (!navigator.mediaDevices?.getUserMedia) {
      onError('Your browser does not support microphone access.')
      return
    }
    if (!window.MediaRecorder) {
      onError('Your browser does not support audio recording.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = pickMimeType()
      mimeTypeRef.current = mimeType
      chunksRef.current   = []

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        isRecordingRef.current = false
        void processRecording()
      }

      mediaRecorderRef.current = recorder
      recorder.start(250) // 250 ms time-slice for reliable chunks
      isRecordingRef.current = true
    } catch (err) {
      releaseStream()
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        onError('Microphone permission denied. Please allow microphone access in your browser.')
      } else {
        onError('Could not start recording. Please check your microphone.')
      }
    }
  }, [onError]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stop ─────────────────────────────────────────────────────────────────────

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return
    isProcessingRef.current = true
    mediaRecorderRef.current?.stop()
    releaseStream()
  }, [])

  // ── Cancel ───────────────────────────────────────────────────────────────────

  const cancelRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    releaseStream()
    chunksRef.current    = []
    isRecordingRef.current  = false
    isProcessingRef.current = false
  }, [])

  // ── Process: upload → transcribe ─────────────────────────────────────────────

  async function processRecording() {
    const chunks = chunksRef.current
    chunksRef.current = []

    if (chunks.length === 0) {
      isProcessingRef.current = false
      onError('No audio was captured. Please try again.')
      return
    }

    const mimeType = mimeTypeRef.current || 'audio/webm'
    const ext      = mimeToExtension(mimeType)
    const blob     = new Blob(chunks, { type: mimeType })

    // Guard against giant uploads
    if (blob.size > MAX_UPLOAD_BYTES) {
      isProcessingRef.current = false
      onError('Recording too long — please keep voice messages under ~5 minutes.')
      return
    }

    try {
      // 1. Get authenticated user
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        onError('You must be signed in to use voice recording.')
        return
      }

      // 2. Upload to storage: voice-responses/{userId}/{uuid}.ext
      const uuid     = crypto.randomUUID()
      const filePath = `${user.id}/${uuid}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('voice-responses')
        .upload(filePath, blob, { contentType: mimeType, upsert: false })

      if (uploadErr) {
        onError(`Upload failed: ${uploadErr.message}`)
        return
      }

      // 3. Call voice-transcribe edge function
      const { data: fnData, error: fnErr } = await supabase.functions.invoke('voice-transcribe', {
        body: { filePath },
      })

      if (fnErr) {
        onError(`Transcription failed: ${fnErr.message}`)
        return
      }

      const transcript = (fnData as { transcript?: string })?.transcript?.trim() ?? ''

      if (transcript) {
        onTranscript(transcript)
      } else {
        onError('No speech detected. Please try again.')
      }
    } catch (err) {
      onError(`Unexpected error: ${(err as Error).message}`)
    } finally {
      isProcessingRef.current = false
    }
  }

  return {
    startRecording,
    stopRecording,
    cancelRecording,
    get isRecording()  { return isRecordingRef.current  },
    get isProcessing() { return isProcessingRef.current },
  }
}
