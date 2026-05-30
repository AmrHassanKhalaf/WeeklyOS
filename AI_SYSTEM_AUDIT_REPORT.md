# WeeklyOS AI System Audit Report

Date: 2026-05-29

## Executive Assessment

WeeklyOS has a real AI-native architecture rather than a single prompt box. The main path is now recognizable and mostly well-separated:

AI Workspace -> context hooks -> context serializer -> prompt builders -> orchestrator -> provider -> Supabase Edge Function -> model/function calls -> tool executor -> UI blocks.

The system is not production-ready yet. The strongest parts are the mode registry, compact context serialization, typed tool contracts, and proposal-first deterministic planning/brain-dump outputs. The main blockers are in reflection runtime correctness, incomplete confirmation UX, and a tool-permission enforcement gap after provider response.

Production readiness rating: **Beta / not production-ready for autonomous mutation**.

## Audit Method

Hybrid-safe validation was used:

- Static architecture scan across `src/ai`, `src/components/ai`, and `supabase/functions/ai-handler`.
- Local deterministic lifecycle harness under ignored `dist/ai-audit`.
- Baseline commands:
  - `npm run build`: passed.
  - `npm run lint`: failed with 13 errors.
  - `npm run typecheck`: failed with 15 errors.
  - `deno`: unavailable locally.
  - `supabase`: unavailable locally.
- Live provider/Supabase calls were not executed because no local Deno/Supabase CLI runtime was available and the audit plan forbids new infrastructure setup.

## Architecture Overview

The current AI architecture is split into these systems:

- **AI Workspace UI**: `AIWorkspace` manages modes, prompt staging, composer state, visual panels, and message rendering.
- **Context Engine**: `buildAIContext`, `assembleContext`, and `serializeContextForLLM` normalize workspace data and serialize a compact LLM context.
- **Mode Registry**: `WORKSPACE_MODE_DEFINITIONS` defines allowed tools per mode.
- **Prompt Builders**: system prompt, mode prompt, and context prompt builders create the message stack.
- **Orchestrator**: prepares requests, passes available tools to the provider, processes provider tool calls, and builds UI blocks.
- **Provider Layer**: `createEdgeProvider` sends normalized messages/tools/model/provider to the Supabase Edge Function.
- **Supabase Edge Function**: authenticates JWT, loads user AI settings/keys, dispatches Gemini/Grok/Ollama paths, returns text/tool calls.
- **Tool Registry/Executor**: registry maps canonical tools; executor validates inputs and marks confirmation-required tools as pending.
- **Intelligence Pipelines**: brain dump, planning, and reflection pipelines produce deterministic structured outputs.
- **UI Blocks**: block builders convert structured outputs into renderable workspace cards.

## Execution Flow Map

1. `AIWorkspace` receives a user message or staged prompt.
2. `useOrchestratorSession.send()` appends user text and reads current mode/context from refs.
3. `createAIOrchestrator.prepare()` assembles:
   - workspace system prompt
   - mode prompt
   - serialized context
   - message history
   - current user message
   - tools resolved from the active mode
4. `createEdgeProvider.generate()` sends a workspace request to `functions/v1/ai-handler`.
5. Edge Function validates auth, reads AI settings and keys, picks provider/model, and calls Gemini/Grok/Ollama.
6. Provider returns text and optional tool calls.
7. Orchestrator runs returned tool calls through `executeTool`.
8. Read tools return as executed tool calls; write tools become `pendingConfirmations`.
9. Known tool outputs are transformed into structured UI blocks.
10. AI Workspace renders assistant message text and `UIBlockList`.

## Workflow Test Results

The local audit harness used a stress week with 9 tasks, 7 pending tasks, 2 completed tasks, 1 focus session, 2 habits, one selected brain dump item, and reflection notes.

### Context

- Raw context built successfully.
- Serialized context was compact: 994 characters, 15 lines.
- Serialized context did not include raw test IDs such as task IDs, week IDs, habit completion IDs, or brain dump IDs.
- Access coverage existed for tasks, habits, focus sessions, reflection notes, activity, weekly metrics, and brain dump counts.

### Brain Dump

Scenario: messy text with tasks, habit-like statements, deadlines, reminders, and low-signal notes.

Observed:

- `processingSource`: heuristic.
- Messy input produced 3 concrete extractions and 3 ambiguous items.
- Output categories: 2 tasks, 1 deadline, 3 suggestions.
- UI blocks generated:
  - `brain_dump_summary`
  - `brain_dump_tasks`
  - `brain_dump_events`
  - `brain_dump_ambiguous`

Scenario: intentionally ambiguous items.

Observed:

- 2 concrete extractions and 3 ambiguous items.
- UI blocks generated:
  - `brain_dump_summary`
  - `brain_dump_events`
  - `brain_dump_ambiguous`

Assessment:

- Ambiguity detection works and produces clarification-oriented output.
- Extraction is deterministic and safe, but not deeply semantic; goal/habit distinction can be conservative and may under-detect habits/goals in mixed prose.
- No store mutation occurs.

### Planning

Scenario: overloaded week with high-priority tasks, carry-over-like pressure, low focus evidence, and context switching.

Observed:

- Week planning risk: `critical`.
- Pending tasks: 7.
- Focus blocks generated: 3.
- Planning UI blocks generated:
  - `planning_summary`
  - `planning_tasks`
  - `planning_focus_blocks`
  - `planning_recommendations`
- Rebalance mode also reported `critical`, but generated 0 rebalance proposals and 0 warnings in the fixture.
- Day planning for Sunday prioritized 3 tasks and generated 0 focus blocks.

Assessment:

- Planning produces useful prioritization and explainable focus recommendations.
- Rebalance proposal generation needs calibration: a critical fixture can return no concrete moves, which weakens the confirmation/proposal story.
- Planning is proposal-only and did not mutate state.

### Reflection

Scenario: low completion, strong isolated focus, inconsistent habits, and planning failure notes.

Observed:

- `runReflectionPipeline()` threw: `insights is not iterable`.
- `summarizeWeek` tool returned `error`.
- `summarizeReflection` tool returned `error`.
- `npm run typecheck` also catches the same structural issue at `src/ai/reflection/pipeline.ts`.

Assessment:

- Reflection Intelligence is currently a blocker.
- Reflection UI blocks cannot be trusted until the pipeline returns a valid `ReflectionResult`.

### Tool And Permission Tests

Valid and malformed inputs were executed against every registered tool.

Observed:

- `createTask`, `updateTask`, and `rescheduleTasks` correctly produced `pending_confirmation` for valid inputs.
- `createTask`, `updateTask`, `generateDayPlan`, and `organizeBrainDump` rejected missing required fields.
- `generateWeekPlan`, `analyzeProductivity`, `rescheduleTasks`, and `createFocusSession` accepted empty input.
- `summarizeWeek` and `summarizeReflection` failed because reflection pipeline failed.
- A mocked provider in `analyze` mode returned an unadvertised `createTask` tool call. The orchestrator staged it as a pending confirmation even though `analyze` mode only advertised `analyzeProductivity` and `summarizeWeek`.

Assessment:

- Confirmation-required tools are safely staged, not auto-mutated.
- Mode registry controls advertised tools, but the orchestrator does not enforce allowed tool IDs when processing returned tool calls.
- Tool validation is useful but shallow: it does not validate enums, reject unknown fields, or deeply validate nested object shapes.

## Detected Issues

### P0: Reflection Pipeline Is Broken

Evidence:

- Runtime error: `insights is not iterable`.
- TypeScript error: `Object literal may only specify known properties, and 'insights' does not exist in type 'ReflectionInsight[]'`.
- Tools affected: `summarizeWeek`, `summarizeReflection`.

Impact:

- Reflect mode cannot reliably generate summaries, score cards, or reflection UI blocks.
- Lint/typecheck cannot pass while this remains.

Recommendation:

- Fix `buildWeeklySummary` call shape in `src/ai/reflection/pipeline.ts`.
- Fix `TaskStatus` mismatch in completion analysis: code checks `"completed"` while the app uses `"done"`.
- Remove or use unused reflection options/imports.

### P0: Confirmation UX Is Incomplete

Evidence:

- `useOrchestratorSession` stores `pendingConfirmations` and exposes `dismissConfirmation`.
- AI Workspace does not destructure/render `pendingConfirmations`.
- No confirm/apply handler was found.
- The system message says "Confirm or dismiss them before proceeding", but the UI does not show corresponding controls.

Impact:

- Write tools are safe from auto-mutation, but proposed actions cannot be completed from the AI Workspace.
- Users may see staged-action messages without any actionable UI.

Recommendation:

- Add an explicit confirmation panel that renders pending tool proposals.
- Add apply handlers outside the tool executor and near store mutation boundaries.
- Keep confirm/apply separate from LLM/tool execution.

### P1: Returned Tool Calls Bypass Mode Permission Enforcement

Evidence:

- `prepare()` advertises only mode-allowed tools.
- `processToolCalls()` later resolves any returned `toolId` from the full registry.
- Harness result: in `analyze` mode, a provider-returned `createTask` became `pending_confirmation`.

Impact:

- A provider hallucination or malicious provider response can stage tools outside the active mode.
- No immediate mutation happens, but the permission boundary is weaker than the mode registry suggests.

Recommendation:

- Pass the allowed tool set into `processToolCalls`.
- Reject or mark as denied any tool call not present in the prepared request's allowed tool list.
- Report denied calls in metadata for debugging.

### P1: Legacy AI Path Duplicates Orchestration

Evidence:

- `src/hooks/useApi.ts` directly calls `functions/v1/ai-handler`.
- Dashboard challenge/insight features still use the legacy `chat/challenge/insight` request path.
- AI Workspace uses the orchestrator/provider path.

Impact:

- There are two AI execution patterns with different payloads, prompt contracts, and safety surfaces.
- Future provider or auth changes must be maintained in multiple places.

Recommendation:

- Keep legacy path only for small non-workspace text generation until migrated.
- Document it as legacy and route new AI features through the orchestrator.

### P1: Rebalance Output Can Be Empty Under Critical Load

Evidence:

- Harness week risk: `critical`.
- Rebalance suggestions: 0.
- Warnings: 0.

Impact:

- Planning can correctly detect pressure but fail to generate concrete recovery proposals.
- This weakens proposal-based UX for overloaded weeks.

Recommendation:

- Add fixture tests for overloaded days with low/medium movable tasks and quiet days.
- Ensure warnings are emitted when no safe rebalance proposal exists.

### P2: Tool Validation Is Too Permissive

Evidence:

- Empty input succeeds for several tools.
- Schema validation checks required fields and shallow primitive types, but not enums or nested object constraints.

Impact:

- Invalid priorities, days, or nested updates can pass to deterministic engines.
- Provider tool-call mistakes may produce low-quality output rather than clear validation errors.

Recommendation:

- Extend `AIToolSchemaProperty` with enum support.
- Recursively validate nested object properties.
- Optionally warn on unknown fields.

### P2: Large UI And AI Files Increase Maintenance Risk

Largest files observed:

- `src/components/ai/AIWorkspace.tsx`: 45,429 bytes.
- `src/ai/reflection/stages/insightGenerator.ts`: 11,203 bytes.
- `src/ai/brain-dump/stages/classifier.ts`: 10,634 bytes.
- `src/ai/reflection/pipeline.ts`: 10,279 bytes.

Impact:

- AI Workspace combines shell, modes, composer, message rendering, and sub-panels.
- Classifier/rule files can grow into rule-explosion areas.

Recommendation:

- Split only after stabilizing behavior: confirmation panel, chat thread, mode panels, and composer are natural boundaries.
- Add fixture coverage before changing rule-heavy pipelines.

## Security Observations

Positive:

- Frontend uses publishable/anon Supabase key and bearer token, not service role.
- Edge Function fetches user AI keys server-side.
- Edge Function scopes `ai_settings` and `ai_keys` reads by `user_id`.
- Context serialization avoids raw DB rows and did not include raw IDs in the harness.
- PWA config denies navigation fallback for function/auth/rest paths.

Risks:

- Edge Function decodes JWT locally to read `sub`; Supabase client with the bearer token still enforces downstream RLS, but local JWT decode is not a full signature verification step.
- API keys are loaded into client state by settings store after `loadFromDb`, which increases accidental exposure risk in browser memory.
- Ollama default base URL is `http://localhost:11434`; this is useful locally but not reachable from hosted Supabase unless separately exposed.

Recommendations:

- Prefer `supabase.auth.getUser(jwt)` or another verified auth flow in the Edge Function if stricter auth assurance is needed.
- Avoid keeping provider secrets in persisted client state; prefer save-only inputs or masked metadata.
- Keep provider payload logs free of credentials and prompt contents.

## Performance Review

Observed:

- Production build passed.
- AIWorkspace bundle chunk was about 131.58 kB in the latest build output.
- Context serialization in the fixture was compact: 994 characters.
- `useOrchestratorSession` uses refs to avoid stale async closures and blocks concurrent sends with `isProcessingRef`.
- AIWorkspace still has a large component surface and re-renders the chat thread when messages change.
- No live provider latency could be measured.

Concerns:

- Reflection crashes can turn provider/tool calls into failed UI states.
- Context generation depends on whole store slices; large arrays can cause recomputation when references change.
- Structured UI block rendering scales linearly with message count and block count.

Recommendations:

- Add memoized chat message rendering if long conversations become common.
- Add context-size budget reporting in development.
- Track provider latency and tool execution duration once live telemetry exists.

## UX Friction Points

- Confirmation messages promise confirm/dismiss, but no confirmation UI is wired.
- Brain dump output can be conservative; ambiguous habit/goal language often needs user clarification.
- Reflect mode actions can fail because reflection tools are broken.
- Legacy Dashboard AI features may behave differently from AI Workspace.

## Maintainability Review

Strengths:

- Central tool registry gives a clear inventory.
- Mode registry gives a clear product-level permission model.
- Context engine is readable and compact.
- Deterministic pipelines are testable without provider calls.
- UI block builders separate structured data from visual rendering.

Weak points:

- Reflection pipeline currently violates its own type contracts.
- Orchestrator is starting to combine request preparation, provider dispatch, tool permissions, confirmations, and UI block mapping.
- Rule-heavy classifiers and insight generators can grow hard to reason about without fixtures.
- Legacy API hook creates duplicated AI architecture.

## Production Readiness

Current status: **not production-ready for full AI-native workflows**.

Ready enough:

- Read-only analysis/planning experiments.
- Brain dump extraction previews.
- Provider abstraction smoke path, assuming Edge Function deploys successfully.

Not ready:

- Reflection mode.
- User-facing confirmation/apply workflows.
- Strong tool permission enforcement.
- Verified live Edge Function/provider runtime in this local environment.

## Recommended Stabilization Order

1. Fix reflection runtime/type errors and make `npm run typecheck` pass.
2. Enforce allowed tool IDs after provider response.
3. Build visible confirmation/apply/dismiss UI for pending tool confirmations.
4. Add fixture tests for brain dump, planning, reflection, and tool validation.
5. Migrate or explicitly quarantine legacy `useAiApi` routes.
6. Add context-size and provider-latency diagnostics.
