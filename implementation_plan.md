# Implementation Plan - Near-Realtime AI Voice Chat Upgrade

Upgrade the current WeeklyOS voice chat into a high-performance, near-realtime conversational experience (similar to ChatGPT Voice or Gemini Live).

## 🎯 Architecture Goals
- Transform "record-then-send" into "chunked-stream-process".
- Achieve low-latency voice-to-voice loops.
- Handle interruptions (barge-in) gracefully.

## 🚨 Required Improvements & Changes

### 1. Voice State Machine [NEW]
Define explicit states for the AI Assistant:
- `idle`: UI is waiting for user.
- `listening`: Capturing 1-2s audio chunks.
- `processing`: Backend analyzing audio and generating text.
- `speaking`: AI audio playback active.

### 2. Audio Capture & Streaming [UPDATED]
- **[REMOVED]** Large Base64 audio payloads.
- **[ADDED]** `MediaRecorder` with `timeslice: 1000`.
- **[ADDED]** Chunk Queue: Buffer audio chunks on the frontend to avoid flooding and handle network jitter.
- **[ADDED]** `sendAudioChunk()`: API to send incremental audio segments to the backend.

### 3. Streaming Response System [UPDATED]
- **[UPDATED]** Enhance SSE (Server-Sent Events) to return structured data:
  - `event: text` (incremental tokens or sentences)
  - `event: audio` (URL to the generated audio file)
  - `event: done` (end of stream)
- **[ADDED]** Partial text display: Update the chat UI progressively as tokens arrive.

### 4. Audio Playback & Storage [NEW]
- **Backend**: 
  - Save generated response audio to **Supabase Storage**.
  - Return a signed or public URL to the frontend.
- **Frontend**:
  - `AudioQueue`: A playback manager to handle sequential audio files without overlap.
  - Automatic `Speaking` state entry when audio starts.

### 5. Interrupt Handling (Barge-In) [NEW] [CRITICAL]
- If User starts speaking while `VoiceState === 'speaking'`:
  - **Immediately stop** current audio playback.
  - **Cancel** any active SSE stream.
  - **Reset** state to `listening`.
  - Start a new request cycle.

### 6. UI/UX Polishing [UPDATED]
- **Smart Mic Button**: Central interaction point changing icon/color based on `VoiceState`.
- **Visualizer**: CSS Waveform animation active during `listening` and `speaking`.
- **Stream UX**: Text appears progressively in the bubble.

## Proposed Changes

### Configuration & Tooling
---
#### [MODIFY] [Settings.tsx](file:///e:/My%20Codes/Projects/WeeklyOS/src/pages/Settings.tsx)
- [UPDATED] Include full lists for Grok-4 and Gemini 2.5/3.1.
- [NEW] Add `Model Capability Mapping`: Detect if a model supports `voice` or `streaming` to enable/disable UI features.

### Application Logic (Frontend)
---
#### [MODIFY] [AIAssistant.tsx](file:///e:/My%20Codes/Projects/WeeklyOS/src/components/layout/AIAssistant.tsx)
- [ADDED] `useVoiceStateMachine` hook to manage `idle` | `listening` | `processing` | `speaking`.
- [UPDATED] `startRecording`: Transition from full blob to 1s chunk uploads.
- [NEW] `Interrupt Listener`: Detect new input during AI speech and kill current output.
- [NEW] `AudioQueueManager`: Logic to play URLs sequentially.

#### [MODIFY] [useApi.ts](file:///e:/My%20Codes/Projects/WeeklyOS/src/hooks/useApi.ts)
- [NEW] `sendAudioChunk(chunk: Blob, sessionId: string)`
- [NEW] `streamChatResponse(onToken: (t: string) => void, onAudio: (url: string) => void)`
- [UPDATED] Support SSE for the `voice` type.

### Backend (Edge Functions)
---
#### [MODIFY] [ai-handler/index.ts](file:///e:/My%20Codes/Projects/WeeklyOS/supabase/functions/ai-handler/index.ts)
- [NEW] Chunk Buffering: Maintain a temporary sliding window for a `sessionId`.
- [NEW] Early Token Generation: Start LLM processing after first 2-3s of audio if possible (incremental STT).
- [NEW] Storage Integration: Upload AI audio to `voice-responses` bucket.
- [UPDATED] SSE implementation for multi-event streaming.

## Verification Plan

### Automated/Unit Tests
- Verify `AudioQueue` handles multiple URLs in sequence.
- Verify `Interrupt` logic cancels the fetch/stream controller.

### Manual Verification
1. **Model Selection**: Choose `gemini-live-2.5-flash-native-audio` and save.
2. **Start Interaction**: Speak a sentence. Verify it appears line-by-line.
3. **Interrupt Test**: Speak while the AI is talking. Ensure the AI stops immediately and starts listening to the new input.
4. **Network Jitter**: Simulate slow network and ensure chunks are queued correctly.
5. **Quality Check**: Verify `audio/webm` provides clear playback.

## Error Handling Scenarios
- **Mic Denied**: Prompt user with a clean UI notification.
- **Empty Audio**: If no voice detected, return to `idle`.
- **Stream Break**: If SSE disconnects, attempt a single retry or show error bubble.
