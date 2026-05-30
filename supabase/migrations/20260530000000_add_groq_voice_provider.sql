-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: add_groq_voice_provider
-- Adds 'groq' (Groq.com / Whisper) as a distinct provider from 'grok' (xAI).
-- Applied: 2026-05-30
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── ai_keys: expand provider constraint to include 'groq' ───────────────────
-- 'grok'  = xAI's Grok LLM  (api.x.ai)
-- 'groq'  = Groq.com Whisper (api.groq.com) — used for voice transcription

ALTER TABLE public.ai_keys
  DROP CONSTRAINT IF EXISTS ai_keys_provider_check;

ALTER TABLE public.ai_keys
  ADD CONSTRAINT ai_keys_provider_check
  CHECK (provider IN ('gemini', 'grok', 'groq', 'ollama'));

-- ─── ai_runs: expand provider constraint ─────────────────────────────────────
ALTER TABLE public.ai_runs
  DROP CONSTRAINT IF EXISTS ai_runs_provider_check;

ALTER TABLE public.ai_runs
  ADD CONSTRAINT ai_runs_provider_check
  CHECK (provider IS NULL OR provider IN ('gemini', 'grok', 'groq', 'ollama', 'edge'));

-- ─── ai_telemetry_events: expand provider constraint ─────────────────────────
ALTER TABLE public.ai_telemetry_events
  DROP CONSTRAINT IF EXISTS ai_telemetry_provider_check;

ALTER TABLE public.ai_telemetry_events
  ADD CONSTRAINT ai_telemetry_provider_check
  CHECK (provider IS NULL OR provider IN ('gemini', 'grok', 'groq', 'ollama', 'edge'));
