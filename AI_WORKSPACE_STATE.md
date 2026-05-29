# WeeklyOS AI Workspace State

Date: 2026-05-29

## Purpose

This file documents the current WeeklyOS AI system as an onboarding and future-development reference. It reflects the architecture observed during the AI architecture and UX validation audit.

## Current AI Systems

WeeklyOS currently includes:

- AI Workspace modal/shell.
- Context Engine.
- Prompt builders.
- AI Orchestrator.
- Provider abstraction.
- Supabase Edge Function provider bridge.
- Tool Registry System.
- Deterministic Brain Dump Intelligence.
- Deterministic Planning Engine.
- Deterministic Reflection Intelligence, currently broken.
- Structured UI Block System.
- Proposal-based confirmation data model, currently missing full UI/apply flow.
- Legacy AI API hook for Dashboard-style text generation.

## Primary Orchestrator Flow

The main AI Workspace flow is:

1. User opens AI Workspace from the app layout.
2. `AIWorkspace` selects a workspace mode: `analyze`, `plan`, `reflect`, or `chat`.
3. User sends a prompt or stages an action prompt.
4. `useOrchestratorSession.send()` captures:
   - current message
   - active mode
   - raw AI context
   - conversation history
5. `createAIOrchestrator.prepare()` builds:
   - system prompt
   - mode prompt
   - serialized workspace context
   - conversation history
   - user message
   - mode-allowed tool list
6. `createEdgeProvider.generate()` sends the request to `functions/v1/ai-handler`.
7. Edge Function calls the configured provider.
8. Provider returns assistant text and optional tool calls.
9. Orchestrator executes tool calls with `executeTool`.
10. Read-only tool results become `toolCalls`.
11. Confirmation-required tool results become `pendingConfirmations`.
12. Known structured outputs become UI blocks.
13. AI Workspace renders message text plus UI cards.

## Workspace Modes

Mode registry is the intended source of tool access.

| Mode | Purpose | Allowed tools |
| --- | --- | --- |
| `analyze` | Productivity and workload diagnosis | `analyzeProductivity`, `summarizeWeek` |
| `plan` | Planning, brain dump organization, focus suggestions | `generateWeekPlan`, `generateDayPlan`, `organizeBrainDump`, `rescheduleTasks`, `createFocusSession` |
| `reflect` | Reflection summaries and lessons | `summarizeReflection`, `summarizeWeek`, `analyzeProductivity` |
| `chat` | General workspace conversation | `createTask`, `updateTask`, `generateWeekPlan`, `generateDayPlan`, `organizeBrainDump`, `rescheduleTasks`, `analyzeProductivity` |

Important current constraint:

- Tools are advertised by mode, but returned provider tool calls are resolved against the full registry. The orchestrator should enforce mode permissions after provider response as well.

## Tool Registry Structure

The canonical built-in tools are:

- `createTask`
- `updateTask`
- `generateWeekPlan`
- `generateDayPlan`
- `organizeBrainDump`
- `summarizeWeek`
- `analyzeProductivity`
- `rescheduleTasks`
- `createFocusSession`
- `summarizeReflection`

Tool contract shape:

- `id`
- `name`
- `description`
- `category`
- `inputSchema`
- `outputSchema`
- `requiresConfirmation`
- optional `execute(input, context)`

Tool execution gateway:

- `executeTool` validates input.
- Missing execute functions return `not_implemented`.
- Read tools return `success` or `error`.
- Tools with `requiresConfirmation: true` always return `pending_confirmation` after successful execution.

Current confirmation-required tools:

- `createTask`
- `updateTask`
- `rescheduleTasks`

## Provider Architecture

Frontend provider:

- `createEdgeProvider` is the AI Workspace provider.
- It reads active provider/model from settings.
- It sends normalized messages and Gemini-style function declarations to Supabase Edge Function.
- It refreshes the Supabase session once on `401`.
- It normalizes Edge Function `toolCalls` back into orchestrator provider tool calls.

Edge Function:

- Authenticates requests with bearer token presence and JWT `sub` extraction.
- Creates a Supabase client using the user's bearer token.
- Loads `ai_settings` and `ai_keys` for the authenticated user.
- Dispatches to:
  - Gemini via Google Generative AI SDK.
  - Grok via xAI chat completions-compatible API.
  - Ollama via `/api/chat`.
- Supports structured workspace requests and legacy text request types.

Provider constraints:

- Deno is not installed locally.
- Supabase CLI is not installed locally.
- Live Edge Function/provider latency was not validated in this audit.
- Ollama requires a reachable base URL from wherever the Edge Function runs.

## Context Engine Structure

Raw context is built by `buildAIContext` from:

- current week
- tasks
- focus sessions
- habits
- habit completions
- brain dump items
- activity
- reflection notes
- weekly metrics

Context layers:

- Base context: week title, number, year, score, completion rate, date range.
- Workspace context: task metrics, overloaded day, focus totals, habits, reflections, top pending tasks.
- Mode context: mode label, focus, relevant signals.
- Conversation context: recent turns and history metadata.

LLM serialization:

- `serializeContextForLLM` creates compact plain text.
- It avoids raw database row dumping.
- In the audit fixture, serialized context was 994 characters over 15 lines and did not include raw IDs.

## Prompt System

Prompt builders currently provide:

- Workspace system prompt: defines WeeklyOS AI persona and guidance behavior.
- Mode prompt: describes active workspace mode.
- Context prompt/serialized context: summarizes live workspace data.
- Action prompts: create staged prompts for UI actions.

The main AI Workspace path uses orchestrator prompt assembly. Legacy Dashboard flows use the older `useAiApi` text request path.

## Brain Dump Pipeline

Pipeline stages:

1. Preprocess raw text into segments.
2. Classify each segment.
3. Detect ambiguity.
4. Build typed extracted items.
5. Contextualize with workspace data and suggestions.

Output categories:

- tasks
- habits
- goals
- reminders
- events
- deadlines
- ambiguous items
- suggestions

Current behavior:

- Deterministic/heuristic.
- Safe: no store mutation.
- Generates UI blocks for summary, tasks, calendar items, ambiguous items, habits, goals, reminders, and suggestions when present.
- Conservative around habit/goal classification.

## Planning Pipeline

Pipeline stages:

1. Workload analysis.
2. Task prioritization.
3. Focus allocation.
4. Rebalance proposal generation.
5. Recommendations.
6. Warnings.
7. Planning reasoning.

Output includes:

- risk summary
- workload analysis
- prioritized tasks
- focus areas
- suggested focus blocks
- rebalance suggestions
- warnings
- recommendations
- reasoning log

Current behavior:

- Deterministic/heuristic.
- Safe: no store mutation.
- Produces structured planning UI blocks.
- Can detect critical workload risk.
- Needs calibration because the audit fixture produced critical risk but no rebalance proposals.

## Reflection Pipeline

Intended stages:

1. Completion analysis.
2. Focus analysis.
3. Habit analysis.
4. Behavior analysis.
5. Insight generation.
6. Weekly summary.
7. Score calculation.
8. Reflection reasoning.

Current state:

- Not reliable.
- Runtime error observed: `insights is not iterable`.
- TypeScript catches the same shape problem in `src/ai/reflection/pipeline.ts`.
- Related tools `summarizeWeek` and `summarizeReflection` fail.
- Completion analyzer also checks task status `"completed"` while app task status uses `"done"`.

## Structured UI Block System

Block interface:

- `kind`
- `title`
- `content`
- optional typed `data`

Brain dump blocks include:

- `brain_dump_summary`
- `brain_dump_tasks`
- `brain_dump_habits`
- `brain_dump_goals`
- `brain_dump_reminders`
- `brain_dump_events`
- `brain_dump_ambiguous`
- `brain_dump_suggestions`

Planning blocks include:

- `planning_summary`
- `planning_tasks`
- `planning_focus_blocks`
- `planning_overload`
- `planning_rebalance`
- `planning_recommendations`

Reflection blocks include:

- `reflection_summary`
- `reflection_score_breakdown`
- `reflection_wins`
- `reflection_struggles`
- `reflection_lessons`
- `reflection_improvements`
- `reflection_insights`
- `reflection_next_week`

Rendering:

- `AIWorkspace` passes message `uiBlocks` to `UIBlockList`.
- `UIBlockList` routes planning blocks to `PlanningUIBlock`, reflection blocks to `ReflectionUIBlock`, and other blocks to `BrainDumpUIBlock`.

## Confirmation System

Current data model:

- `PendingToolConfirmation` has:
  - `confirmationId`
  - `toolId`
  - `toolName`
  - `input`
  - `proposedOutput`

Current behavior:

- `executeTool` marks write tools as `pending_confirmation`.
- Orchestrator collects pending confirmations.
- `useOrchestratorSession` stores pending confirmations.
- `dismissConfirmation` can remove a pending confirmation from hook state.

Current gap:

- AI Workspace does not render pending confirmations.
- No confirm/apply handler was found.
- Store mutation after confirmation is not implemented in the AI Workspace flow.

Architectural decision to preserve:

- Tool execution should produce proposals only.
- Store writes should happen only after explicit user confirmation in a UI-owned apply layer.

## Current AI Capabilities

Working or partially working:

- Context-aware AI Workspace chat flow.
- Mode-specific prompt staging.
- Compact context serialization.
- Gemini/Grok/Ollama provider selection path at the Edge Function level.
- Tool declaration conversion for provider function calling.
- Brain dump extraction and clarification blocks.
- Planning risk detection, prioritization, focus block suggestions, and recommendations.
- Read-only productivity analysis.
- Confirmation-required tool staging.

Not currently reliable:

- Reflection summaries and reflection UI blocks.
- End-to-end confirmation apply flow.
- Strict mode-based tool permission enforcement after provider response.
- Live provider latency/error validation in this local environment.

## Implemented Phases

Implemented:

- AI Workspace shell and mode UX.
- Context Engine.
- Tool Registry.
- Orchestrator.
- Edge provider.
- Supabase Edge Function AI handler.
- Brain Dump pipeline.
- Planning pipeline.
- Reflection pipeline skeleton and stages.
- Structured UI blocks.
- Proposal/pending-confirmation model.

Partially implemented:

- Confirmation flows.
- Reflection Intelligence.
- Provider abstraction across all legacy and workspace flows.
- AI state/memory; only a minimal session memory snapshot helper exists.

Pending future systems:

- Confirmation apply UI.
- Mode-enforced returned-tool validation.
- Fixture-based AI regression tests.
- Reflection pipeline stabilization.
- Context budget instrumentation.
- Provider latency and failure telemetry.
- Legacy AI hook migration.

## Known Constraints

- Do not introduce autonomous agents, persistent memory systems, or voice systems without a separate product decision.
- Keep deterministic pipelines testable without provider calls.
- Treat LLM tool calls as untrusted until validated against mode permissions and tool schemas.
- Keep raw DB rows out of serialized prompt context.
- Avoid storing provider secrets in browser-persisted state long term.
- Hosted Supabase cannot call local Ollama unless Ollama is exposed through a reachable URL.

## Important Architectural Decisions

- AI Workspace is the primary AI UX surface.
- The mode registry is intended to control what tools the model can use.
- The tool registry is the canonical inventory of AI tools.
- The tool executor is the validation and proposal gateway.
- Confirmation-required tools must not mutate state directly.
- Deterministic pipelines are preferred for productivity logic that needs explainability.
- Provider calls are centralized through the Supabase Edge Function for API-key protection.
- Structured UI blocks are the preferred display format for complex AI outputs.

## Recommended Next State

Before expanding AI features, stabilize in this order:

1. Fix reflection runtime and TypeScript errors.
2. Enforce active-mode tool permissions after provider response.
3. Build pending confirmation render/apply/dismiss UI.
4. Add deterministic fixture tests for all pipelines and tools.
5. Migrate legacy AI calls or mark them explicitly as legacy.
6. Add context-size and provider-latency instrumentation.
