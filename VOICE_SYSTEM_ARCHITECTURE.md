# WeeklyOS Voice System Architecture

> **Last updated:** 2026-05-30  
> **Status:** Production

---

## Overview

WeeklyOS implements a **Hybrid Voice Input System** — a two-path architecture that delivers fast, live speech-to-text on modern browsers while gracefully degrading to cloud transcription everywhere else.

The system is **input-only**: voice produces a text transcript that lands in the AI composer for user review. There is no AI voice response, no streaming TTS, and no autonomous voice agent.

---

## Architecture Diagram

```
User taps mic
     │
     ▼
┌────────────────────────────────────┐
│         useVoiceRecorder           │  ← Public API (AIWorkspace)
│         (state machine)            │
└──────────┬─────────────────────────┘
           │
    Browser supports
    SpeechRecognition?
           │
    ┌──────┴──────┐
   YES           NO
    │             │
    ▼             ▼
┌──────────┐ ┌──────────────────────────────┐
│ PRIMARY  │ │         FALLBACK             │
│  Web     │ │  useVoiceFallback            │
│ Speech   │ │  MediaRecorder → Storage     │
│  API     │ │  → voice-transcribe Edge Fn  │
│ (live)   │ │  → Groq Whisper / Gemini     │
└────┬─────┘ └──────────────┬───────────────┘
     │                      │
     │ ← onTranscript(text) ┘
     │
     ▼
 Composer (AIWorkspace)
 User reviews → edits → sends to orchestrator
```

---

## Primary Path — Web Speech API

### Hook: `useVoiceRecognition.ts`

Internal wrapper around `window.SpeechRecognition / webkitSpeechRecognition`.

| Setting | Value |
|---------|-------|
| `continuous` | `true` |
| `interimResults` | `true` |
| `lang` | Inherits browser locale (`''`) |
| `maxAlternatives` | `1` |

**Events:**
- `onresult` → fires `onInterimTranscript(text)` for in-progress text, `onFinalTranscript(text)` for committed segments
- `onerror` → ignores `no-speech` and `aborted`; surfaces others as error codes
- `onend` → triggers final transcript delivery + state transition

**Browser compatibility:** Chrome, Edge, Safari (with `webkit` prefix). Not available in Firefox.

---

## Fallback Path — Groq Whisper Upload

### Hook: `useVoiceFallback.ts`

Upload-based pipeline:

```
getUserMedia()
  → MediaRecorder (250ms chunks)
    → Blob assembly
      → Supabase Storage (voice-responses/{userId}/{uuid}.ext)
        → voice-transcribe Edge Function
          → Groq Whisper API
            → transcript
```

**Limits:**
- Max upload size: 10 MB
- MIME types tried (in order): `audio/webm;codecs=opus`, `audio/webm`, `audio/ogg;codecs=opus`, `audio/mp4`
- File is deleted from Storage immediately after successful transcription

---

## State Machine

```
               ┌─────────────────┐
               │      idle       │◄──────────────────────┐
               └────────┬────────┘                       │
                        │ startRecording()               │
                        ▼                                │
               ┌─────────────────┐                       │
               │ requesting_     │                       │
               │ permission      │                       │
               └────────┬────────┘                       │
                        │ mic acquired                   │
                        ▼                                │
               ┌─────────────────┐  cancelRecording()    │
               │   recording     │──────────────────────►│
               └────────┬────────┘                       │
                        │ stopRecording()                │
                        ▼                                │
               ┌─────────────────┐  transcript → onTranscript()
               │   processing    │──────────────────────►│
               └────────┬────────┘                       │
                        │ error                          │
                        ▼                                │
               ┌─────────────────┐  clearError()         │
               │     error       │──────────────────────►│
               └─────────────────┘
```

**Guards:**
- `startRecording()` is a no-op if `state !== 'idle'`
- `stopRecording()` is a no-op if `state !== 'recording'`
- No parallel sessions possible

---

## Hook Public API

### `useVoiceRecorder(options)` — `src/hooks/useVoiceRecorder.ts`

```ts
interface UseVoiceRecorderOptions {
  onTranscript: (text: string) => void   // final transcript → composer
  onError?: (message: string) => void    // user-friendly error string
}

interface UseVoiceRecorderReturn {
  state: 'idle' | 'requesting_permission' | 'recording' | 'processing' | 'error'
  isRecording: boolean
  isProcessing: boolean
  interimTranscript: string    // live text during primary path ('' on fallback)
  primaryAvailable: boolean    // whether Web Speech API is supported
  startRecording: () => Promise<void>
  stopRecording: () => void
  cancelRecording: () => void
  clearError: () => void
}
```

**Internal hooks (not for direct use):**
- `useVoiceRecognition` — Web Speech API wrapper
- `useVoiceFallback` — MediaRecorder + upload pipeline

---

## Edge Function — `voice-transcribe`

**Path:** `supabase/functions/voice-transcribe/index.ts`

### Responsibilities
1. Validate JWT via Supabase user client
2. Validate file path ownership (`pathSegments[0] === user.id`)
3. Reject path traversal (`..` or depth > 2)
4. Download audio from `voice-responses` bucket (service role)
5. Resolve transcription provider (key lookup order below)
6. Transcribe and return `{ transcript, provider_used }`
7. Delete temp audio file (best-effort, non-blocking)

### Provider Resolution Order

```
ai_keys table (user's own key, provider='groq')
  → GROQ_API_KEY env var
    → ai_keys table (user's own key, provider='gemini')
      → GEMINI_API_KEY env var
        → Error: NO_PROVIDER
```

### Groq Whisper API

- **Endpoint:** `POST https://api.groq.com/openai/v1/audio/transcriptions`
- **Model:** `whisper-large-v3`
- **Format:** multipart/form-data
- **Supported file types:** webm, ogg, mp4, and others

### Gemini Fallback

- **Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Method:** base64 inline_data in the request body
- **Note:** base64 encoding uses a safe loop (no array spread) to avoid call stack overflow on large files

### Structured Error Codes

| `error_code` | HTTP Status | Meaning |
|---|---|---|
| `UNAUTHENTICATED` | 401 | Missing Authorization header |
| `UNAUTHORIZED` | 401 | Invalid or expired JWT |
| `MISSING_FILE_PATH` | 400 | Body missing `filePath` |
| `FORBIDDEN` | 403 | File path doesn't belong to the user |
| `INVALID_PATH` | 400 | Path traversal or wrong depth |
| `DOWNLOAD_FAILED` | 500 | Storage download error |
| `NO_PROVIDER` | 400 | No Groq or Gemini key configured |
| `INTERNAL_ERROR` | 500 | Unexpected runtime error |

---

## Security Model

| Concern | Mitigation |
|---------|-----------|
| Key exposure | Keys stored in `ai_keys` table (RLS: user-only); never returned to frontend |
| Audio ownership | Edge function validates `filePath[0] === auth.uid()` |
| Path traversal | Explicit `..` check + path depth === 2 check |
| Public audio URLs | Storage bucket is private; download requires service role key |
| Key fallback | Env vars used only as deployment-level defaults, not exposed to client |
| Storage cleanup | Audio deleted after transcription (non-blocking) |
| Max upload size | 10 MB client-side guard before upload |
| Max recording time | 60s safety timer on primary path |

---

## Database Changes

### Migration: `20260530000000_add_groq_voice_provider.sql`

Expands provider CHECK constraints to include `'groq'` (Groq.com Whisper) — distinct from `'grok'` (xAI Grok LLM):

- `ai_keys.provider` → `('gemini', 'grok', 'groq', 'ollama')`
- `ai_runs.provider` → `('gemini', 'grok', 'groq', 'ollama', 'edge')`  
- `ai_telemetry_events.provider` → `('gemini', 'grok', 'groq', 'ollama', 'edge')`

---

## Settings Integration

**Settings → AI Integration → Groq API Key**

- Label: "Groq API Key"
- Placeholder: `gsk_...`
- Help text: "Used for voice-to-text transcription via Groq Whisper. Get a free key at console.groq.com"
- Stored in: `ai_keys` table with `provider = 'groq'`

---

## Orchestrator Integration

Voice transcripts flow **one-way into the composer only**:

```
voice → interimTranscript (live preview) → composer textarea
voice → onTranscript(final) → appended to chatInput state
chatInput → user reviews/edits → user manually presses Send
Send → orchestrator → tools / context
```

**Explicit non-features (by design):**
- ❌ Auto-send on transcript
- ❌ AI voice responses
- ❌ Tool execution triggered by voice
- ❌ Streaming TTS

---

## UIX Indicators

| State | Indicator |
|-------|-----------|
| `recording` (primary) | 🟢 `Live` badge + pulsing red dot + "Listening… tap mic to stop." |
| `recording` (fallback) | 🟣 `Upload` badge + pulsing red dot + "Recording… tap mic to stop." |
| `recording` + interim text | Dimmed italic text box below recording indicator |
| `processing` | Mic button shows spinner / disabled state |
| `error` | Red error banner with dismissible message |
| `primaryAvailable = false` | Fallback path used silently (no warning unless error occurs) |

---

## Future Extension Points

The architecture is prepared for, but does NOT implement:

| Feature | Extension Point |
|---------|-----------------|
| OpenAI Whisper | Add `transcribeWithOpenAI()` in edge function + key lookup |
| Multilingual | Pass `language` param to Groq Whisper / SpeechRecognition |
| Realtime AI voice | New hook separate from this system |
| Streaming TTS | Separate audio output layer |
| Voice shortcuts | Post-transcript command parser (don't add to transcript layer) |
