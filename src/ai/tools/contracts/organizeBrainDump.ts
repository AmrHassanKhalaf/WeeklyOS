import type { AIContext, AITool, AIToolResult } from '../../types'
import { runBrainDumpPipeline } from '../../brain-dump/pipeline'
import type { BrainDumpExtraction } from '../../brain-dump/types'

// ─── I/O Types ────────────────────────────────────────────────────────────────

export interface OrganizeBrainDumpInput {
  rawText: string
}

export type OrganizeBrainDumpOutput = BrainDumpExtraction

// ─── Contract ─────────────────────────────────────────────────────────────────

export const organizeBrainDumpContract: AITool<OrganizeBrainDumpInput, OrganizeBrainDumpOutput> = {
  id: 'organizeBrainDump',
  name: 'Organize Brain Dump',
  description:
    'Parse raw brain-dump text through the full extraction pipeline: preprocessing, classification, ambiguity detection, and workspace contextualization. Returns a structured BrainDumpExtraction with tasks, habits, goals, reminders, events, deadlines, ambiguous items, and planning suggestions.',
  category: 'planning',
  requiresConfirmation: false,

  inputSchema: {
    type: 'object',
    description: 'Brain dump text to parse',
    properties: {
      rawText: {
        type: 'string',
        description: 'The raw unstructured text to parse (required)',
      },
    },
    required: ['rawText'],
  },

  outputSchema: {
    type: 'object',
    description: 'Structured brain dump extraction result',
    properties: {
      rawInput: { type: 'string', description: 'Original text' },
      tasks: { type: 'array', description: 'Extracted tasks', items: { type: 'object' } },
      habits: { type: 'array', description: 'Detected habits', items: { type: 'object' } },
      goals: { type: 'array', description: 'Extracted goals', items: { type: 'object' } },
      reminders: { type: 'array', description: 'Extracted reminders', items: { type: 'object' } },
      events: { type: 'array', description: 'Detected events', items: { type: 'object' } },
      deadlines: { type: 'array', description: 'Extracted deadlines', items: { type: 'object' } },
      ambiguousItems: { type: 'array', description: 'Items needing clarification', items: { type: 'object' } },
      suggestions: { type: 'array', description: 'Planning suggestions', items: { type: 'object' } },
      totalExtracted: { type: 'number', description: 'Total items extracted' },
      ambiguousCount: { type: 'number', description: 'Items needing clarification' },
      processingSource: { type: 'string', description: 'heuristic | llm | hybrid' },
    },
    required: ['rawInput', 'tasks', 'habits', 'goals', 'reminders', 'events', 'deadlines',
               'ambiguousItems', 'suggestions', 'totalExtracted', 'ambiguousCount', 'processingSource'],
  },

  execute: async (input, context: AIContext): Promise<AIToolResult<OrganizeBrainDumpOutput>> => {
    const trimmed = input.rawText?.trim()
    if (!trimmed) {
      return { ok: false, error: 'rawText is empty — nothing to parse.' }
    }

    const extraction = runBrainDumpPipeline(trimmed, context)
    return { ok: true, output: extraction }
  },
}
