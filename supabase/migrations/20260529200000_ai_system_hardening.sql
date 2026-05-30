-- ══════════════════════════════════════════════════════════════════════════════
-- Migration: ai_system_hardening
-- WeeklyOS AI database hardening + 4 new tables
-- Applied: 2026-05-29
-- ══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Harden ai_keys
-- ─────────────────────────────────────────────────────────────────────────────

-- Remove empty-key rows (caused "No credential found" 400 errors)
DELETE FROM public.ai_keys WHERE trim(api_key) = '' OR api_key IS NULL;

-- UNIQUE: one row per user per provider
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ai_keys_user_provider_unique'
      AND conrelid = 'public.ai_keys'::regclass
  ) THEN
    ALTER TABLE public.ai_keys ADD CONSTRAINT ai_keys_user_provider_unique UNIQUE (user_id, provider);
  END IF;
END $$;

-- CHECK: reject unknown providers (idempotent — skip if exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ai_keys_provider_check'
      AND conrelid = 'public.ai_keys'::regclass
  ) THEN
    ALTER TABLE public.ai_keys ADD CONSTRAINT ai_keys_provider_check
      CHECK (provider IN ('gemini', 'grok', 'ollama'));
  END IF;
END $$;

-- CHECK: reject empty API keys
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ai_keys_api_key_nonempty'
      AND conrelid = 'public.ai_keys'::regclass
  ) THEN
    ALTER TABLE public.ai_keys ADD CONSTRAINT ai_keys_api_key_nonempty
      CHECK (length(trim(api_key)) > 0);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Harden ai_settings
-- ─────────────────────────────────────────────────────────────────────────────

-- Fix known-invalid model names stored by previous UI versions
UPDATE public.ai_settings
SET active_model = 'gemini-2.5-flash'
WHERE active_model IN (
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-flash-lite'
);

-- Safe default for default_provider
ALTER TABLE public.ai_settings
  ALTER COLUMN default_provider SET DEFAULT 'gemini';

-- Shared updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach to ai_settings
DROP TRIGGER IF EXISTS ai_settings_updated_at ON public.ai_settings;
CREATE TRIGGER ai_settings_updated_at
  BEFORE UPDATE ON public.ai_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: ai_tool_permissions
-- Server-side allowlist for AI tool execution per mode.
-- Read-only for authenticated users. Mutated only via migrations.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_tool_permissions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode                  text NOT NULL,
  tool_id               text NOT NULL,
  enabled               boolean NOT NULL DEFAULT true,
  requires_confirmation boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ai_tool_permissions_mode_check
    CHECK (mode IN ('analyze','plan','reflect','chat')),
  CONSTRAINT ai_tool_permissions_tool_id_check
    CHECK (tool_id IN (
      'createTask','updateTask','generateWeekPlan','generateDayPlan',
      'organizeBrainDump','summarizeWeek','analyzeProductivity',
      'rescheduleTasks','createFocusSession','summarizeReflection'
    )),
  CONSTRAINT ai_tool_permissions_mode_tool_unique
    UNIQUE (mode, tool_id)
);

CREATE OR REPLACE TRIGGER ai_tool_permissions_updated_at
  BEFORE UPDATE ON public.ai_tool_permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_ai_tool_permissions_mode
  ON public.ai_tool_permissions (mode)
  WHERE enabled = true;

ALTER TABLE public.ai_tool_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_tool_permissions: authenticated read" ON public.ai_tool_permissions;
CREATE POLICY "ai_tool_permissions: authenticated read"
  ON public.ai_tool_permissions FOR SELECT TO authenticated USING (true);

-- Seed data — mirrors mode registry in src/ai/modes/registry.ts
INSERT INTO public.ai_tool_permissions (mode, tool_id, enabled, requires_confirmation) VALUES
  ('analyze', 'analyzeProductivity',  true, false),
  ('analyze', 'summarizeWeek',        true, false),
  ('plan',    'generateWeekPlan',     true, false),
  ('plan',    'generateDayPlan',      true, false),
  ('plan',    'organizeBrainDump',    true, false),
  ('plan',    'rescheduleTasks',      true, true),
  ('plan',    'createFocusSession',   true, true),
  ('reflect', 'summarizeReflection',  true, false),
  ('reflect', 'summarizeWeek',        true, false),
  ('reflect', 'analyzeProductivity',  true, false),
  ('chat',    'createTask',           true, true),
  ('chat',    'updateTask',           true, true),
  ('chat',    'generateWeekPlan',     true, false),
  ('chat',    'generateDayPlan',      true, false),
  ('chat',    'organizeBrainDump',    true, false),
  ('chat',    'rescheduleTasks',      true, true),
  ('chat',    'analyzeProductivity',  true, false)
ON CONFLICT (mode, tool_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: ai_pending_confirmations
-- Persists AI-proposed write actions awaiting user approval.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_pending_confirmations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tool_id         text NOT NULL,
  mode            text NOT NULL,
  input           jsonb NOT NULL DEFAULT '{}',
  proposed_output jsonb NOT NULL DEFAULT '{}',
  status          text NOT NULL DEFAULT 'pending',
  created_at      timestamptz NOT NULL DEFAULT now(),
  applied_at      timestamptz,
  dismissed_at    timestamptz,
  error_message   text,

  CONSTRAINT ai_pending_confirmations_status_check
    CHECK (status IN ('pending','applied','dismissed','expired','failed')),
  CONSTRAINT ai_pending_confirmations_mode_check
    CHECK (mode IN ('analyze','plan','reflect','chat')),
  CONSTRAINT ai_pending_confirmations_applied_at_check
    CHECK (applied_at IS NULL OR status = 'applied'),
  CONSTRAINT ai_pending_confirmations_dismissed_at_check
    CHECK (dismissed_at IS NULL OR status IN ('dismissed','expired'))
);

CREATE INDEX IF NOT EXISTS idx_ai_pending_user_status
  ON public.ai_pending_confirmations (user_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_ai_pending_user_created
  ON public.ai_pending_confirmations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_pending_created_at
  ON public.ai_pending_confirmations (created_at) WHERE status = 'pending';

ALTER TABLE public.ai_pending_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_pending_confirmations: select own" ON public.ai_pending_confirmations;
DROP POLICY IF EXISTS "ai_pending_confirmations: insert own" ON public.ai_pending_confirmations;
DROP POLICY IF EXISTS "ai_pending_confirmations: update own status" ON public.ai_pending_confirmations;

CREATE POLICY "ai_pending_confirmations: select own"
  ON public.ai_pending_confirmations FOR SELECT
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "ai_pending_confirmations: insert own"
  ON public.ai_pending_confirmations FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "ai_pending_confirmations: update own status"
  ON public.ai_pending_confirmations FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5: ai_telemetry_events
-- Append-only performance + error event log.
-- NEVER store: api_key, raw prompts, raw context dumps, PII.
-- ONLY store: event_name, provider, model, mode, duration_ms, error_code.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_telemetry_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  event_name  text NOT NULL,
  provider    text,
  model       text,
  mode        text,
  duration_ms integer,
  metadata    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT ai_telemetry_event_name_check
    CHECK (event_name IN (
      'request_start','request_success','request_error',
      'tool_call','tool_denied','tool_confirmed','tool_dismissed',
      'provider_fallback','model_fallback'
    )),
  CONSTRAINT ai_telemetry_provider_check
    CHECK (provider IS NULL OR provider IN ('gemini','grok','ollama','edge')),
  CONSTRAINT ai_telemetry_duration_check
    CHECK (duration_ms IS NULL OR duration_ms >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ai_telemetry_user_created
  ON public.ai_telemetry_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_telemetry_event_name
  ON public.ai_telemetry_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_telemetry_errors
  ON public.ai_telemetry_events (user_id, created_at DESC)
  WHERE event_name = 'request_error';

ALTER TABLE public.ai_telemetry_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_telemetry_events: select own" ON public.ai_telemetry_events;
DROP POLICY IF EXISTS "ai_telemetry_events: insert own" ON public.ai_telemetry_events;

CREATE POLICY "ai_telemetry_events: select own"
  ON public.ai_telemetry_events FOR SELECT
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "ai_telemetry_events: insert own"
  ON public.ai_telemetry_events FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6: ai_runs
-- One row per full orchestrator execution lifecycle.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_runs (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  mode                       text NOT NULL,
  provider                   text,
  model                      text,
  status                     text NOT NULL DEFAULT 'running',
  started_at                 timestamptz NOT NULL DEFAULT now(),
  completed_at               timestamptz,
  duration_ms                integer,
  tool_call_count            smallint NOT NULL DEFAULT 0,
  denied_tool_call_count     smallint NOT NULL DEFAULT 0,
  pending_confirmation_count smallint NOT NULL DEFAULT 0,
  error_message              text,
  metadata                   jsonb NOT NULL DEFAULT '{}',

  CONSTRAINT ai_runs_mode_check
    CHECK (mode IN ('analyze','plan','reflect','chat')),
  CONSTRAINT ai_runs_status_check
    CHECK (status IN ('running','success','error','cancelled')),
  CONSTRAINT ai_runs_provider_check
    CHECK (provider IS NULL OR provider IN ('gemini','grok','ollama')),
  CONSTRAINT ai_runs_duration_check
    CHECK (duration_ms IS NULL OR duration_ms >= 0),
  CONSTRAINT ai_runs_counts_check
    CHECK (
      tool_call_count >= 0
      AND denied_tool_call_count >= 0
      AND pending_confirmation_count >= 0
    )
);

CREATE INDEX IF NOT EXISTS idx_ai_runs_user_started
  ON public.ai_runs (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_runs_status
  ON public.ai_runs (status, started_at DESC) WHERE status = 'running';

ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_runs: select own" ON public.ai_runs;
DROP POLICY IF EXISTS "ai_runs: insert own" ON public.ai_runs;
DROP POLICY IF EXISTS "ai_runs: update own" ON public.ai_runs;

CREATE POLICY "ai_runs: select own"
  ON public.ai_runs FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "ai_runs: insert own"
  ON public.ai_runs FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "ai_runs: update own"
  ON public.ai_runs FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
