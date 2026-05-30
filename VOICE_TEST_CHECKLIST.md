# WeeklyOS Voice System — Test Checklist

> Use this checklist before each release that touches voice input.  
> Mark each item ✅ pass / ❌ fail / ⚠️ partial.

---

## 1. Browser Support Detection

| # | Test | Expected |
|---|------|----------|
| 1.1 | Open in Chrome desktop | `primaryAvailable = true`, badge shows `Live` |
| 1.2 | Open in Firefox desktop | `primaryAvailable = false`, badge shows `Upload` |
| 1.3 | Open in Safari desktop | `primaryAvailable = true` (webkit), badge shows `Live` |
| 1.4 | Open in Chrome Android | `primaryAvailable = true`, badge shows `Live` |
| 1.5 | Open in Firefox Android | `primaryAvailable = false`, badge shows `Upload` |
| 1.6 | Open in Safari iOS | `primaryAvailable = true` (webkit), badge shows `Live` |

---

## 2. Permission Handling

| # | Test | Expected |
|---|------|----------|
| 2.1 | Tap mic, grant permission | Recording starts, indicator appears |
| 2.2 | Tap mic, deny permission | Error message: "Microphone permission denied…", state returns to `idle` |
| 2.3 | Tap mic, dismiss permission dialog | Same as 2.2 |
| 2.4 | Deny permission, then tap mic again | Same error shown again, no stuck state |
| 2.5 | Grant permission, revoke mid-session | Recording stops cleanly, error shown |

---

## 3. Primary Path — Web Speech API (Chrome / Edge)

| # | Test | Expected |
|---|------|----------|
| 3.1 | Tap mic, speak clearly | Live interim text appears in italic preview box |
| 3.2 | Stop speaking for 2.5 seconds | Recognition auto-stops, final transcript appended to composer |
| 3.3 | Tap mic again to manually stop | Final transcript delivered immediately |
| 3.4 | Speak, stop, speak again (within session) | All speech accumulated into one transcript |
| 3.5 | Hold mic button for 60 seconds | Safety timer auto-stops recording at 60s |
| 3.6 | Speak very quietly | `no-speech` error handled silently (no error banner), state returns to idle |
| 3.7 | Cancel recording mid-speech | No transcript generated, composer unchanged, state returns to idle |
| 3.8 | Type in composer while recording | Existing text preserved; interim preview shown separately |
| 3.9 | Send message while recording | Recording stops, transcript appended before send |

---

## 4. Fallback Path — Groq Whisper Upload (Firefox)

| # | Test | Expected |
|---|------|----------|
| 4.1 | Tap mic (Firefox), speak, stop | Audio uploaded, Groq transcribes, transcript appended |
| 4.2 | Tap mic, speak very quietly, stop | "No speech detected" error shown |
| 4.3 | Record for > 10 MB of audio | Client-side guard rejects upload, error shown: "Recording too long…" |
| 4.4 | Upload with no Groq key but Gemini key set | Falls back to Gemini transcription, `provider_used = 'gemini'` |
| 4.5 | Upload with no Groq or Gemini key | Error: "No transcription provider available. Add a Groq or Gemini API key…" |
| 4.6 | Network failure during upload | Upload error shown, state returns to idle cleanly |
| 4.7 | Network failure during transcription | Transcription error shown, storage file still cleaned up |

---

## 5. Rapid Interaction Tests

| # | Test | Expected |
|---|------|----------|
| 5.1 | Tap mic rapidly 5 times | Only one recording session starts, no parallel sessions |
| 5.2 | Start → stop → start again immediately | Second session starts cleanly after first completes |
| 5.3 | Start → cancel → start again immediately | Immediate restart, no stuck state |
| 5.4 | Start → navigate away → return | Recording stopped on unmount, no zombie MediaStream |

---

## 6. Transcript Quality Tests

| # | Test | Expected |
|---|------|----------|
| 6.1 | Speak in Arabic | Transcript in Arabic (locale-aware) |
| 6.2 | Speak in English | Transcript in English |
| 6.3 | Speak then pause then speak again | Full transcript, not truncated at first pause |
| 6.4 | Speak with background noise | Best-effort transcript, no crash |
| 6.5 | Empty recording (no speech) | "No speech detected" error |
| 6.6 | Multiple spaces in transcript | Collapsed to single space (normalizeTranscript) |
| 6.7 | Leading/trailing whitespace | Trimmed before delivery |

---

## 7. Composer Integration

| # | Test | Expected |
|---|------|----------|
| 7.1 | Transcribe into empty composer | Composer shows transcript |
| 7.2 | Transcribe into non-empty composer | Transcript appended with space: `"existing text TRANSCRIPT"` |
| 7.3 | Edit transcript before sending | Edits preserved, no re-transcription |
| 7.4 | Send transcript to AI | Orchestrator receives composer text, voice plays no further role |
| 7.5 | Transcribe, clear composer, transcribe again | Second transcript replaces (appends to empty) cleanly |

---

## 8. Error Recovery Tests

| # | Test | Expected |
|---|------|----------|
| 8.1 | Any error state → dismiss error | `clearError()` → state returns to `idle`, mic re-enabled |
| 8.2 | Recognition `network` error | User-friendly message: "Voice recognition failed — check your internet…" |
| 8.3 | Mic permission error via API | Message: "Microphone permission denied…" |
| 8.4 | Groq API returns 401 | Error banner shown, storage file cleaned up |
| 8.5 | Groq returns empty transcript | Falls back to Gemini if key available; else error shown |

---

## 9. Security Tests

| # | Test | Expected |
|---|------|----------|
| 9.1 | Inspect network tab during voice session | No API keys visible in requests from the browser |
| 9.2 | Attempt file path `../../other-user/file.webm` | Edge function returns 403 FORBIDDEN |
| 9.3 | Attempt file path `userId/../../etc/passwd` | Edge function returns 400 INVALID_PATH |
| 9.4 | Another user calls transcribe with your filePath | 403 FORBIDDEN (ownership check) |
| 9.5 | Check Storage after transcription | Audio file deleted from `voice-responses` bucket |

---

## 10. Settings Page Tests

| # | Test | Expected |
|---|------|----------|
| 10.1 | Open Settings → AI Integration | Groq key field visible between Gemini and Grok |
| 10.2 | Enter Groq key and save | Key persists after page reload |
| 10.3 | Enter invalid Groq key and use voice | Edge function returns provider error, banner shown |
| 10.4 | Remove Groq key (leave empty) | Falls back to Gemini key |

---

## 11. Mobile Tests

| # | Test | Expected |
|---|------|----------|
| 11.1 | Chrome Android: tap mic | Works, `Live` badge shown |
| 11.2 | Safari iOS: tap mic | Works with `webkit` prefix, `Live` badge shown |
| 11.3 | Mobile, lock screen mid-recording | Recording stops gracefully |
| 11.4 | Mobile, switch apps mid-recording | Recording stops, no orphaned stream |

---

## 12. Cleanup / Memory Tests

| # | Test | Expected |
|---|------|----------|
| 12.1 | Start recording, close tab | `onend` fires, stream tracks stopped |
| 12.2 | Start recording, hot-reload (dev) | Unmount cleanup runs, no zombie MediaRecorder |
| 12.3 | Record 10 sessions back-to-back | No memory leak (check DevTools Memory tab) |
| 12.4 | Check Storage bucket after 10 sessions | All temp files deleted |
