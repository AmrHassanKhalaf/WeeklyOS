import type { AITool, AIToolResult, BrainDumpParseResult, DayOfWeek, Priority } from '../../types'

// ─── I/O Types ────────────────────────────────────────────────────────────────

export interface OrganizeBrainDumpInput {
  rawText: string
}

// Output reuses the existing BrainDumpParseResult shape
export type OrganizeBrainDumpOutput = BrainDumpParseResult

// ─── Heuristic Classifier ─────────────────────────────────────────────────────
//
// Phase 2.5 (Brain Dump Intelligence) will replace this with a full LLM-backed
// parser. For now the classifier uses keyword matching to produce a useful
// structural skeleton that the AI can refine further.

const TASK_KEYWORDS = /\b(todo|do|finish|complete|write|build|fix|review|send|call|schedule|implement|create|update|add)\b/i
const GOAL_KEYWORDS = /\b(want to|goal|aim|plan to|by the end|achieve|become|reach|improve|grow)\b/i
const REMINDER_KEYWORDS = /\b(remind|don't forget|remember|follow up|check|verify|confirm)\b/i
const HABIT_KEYWORDS = /\b(daily|every day|habit|routine|morning|evening|workout|meditate|read|exercise)\b/i
const DEADLINE_KEYWORDS = /\b(by|due|deadline|before|until|end of)\b/i

const DAY_MAP: Record<string, DayOfWeek> = {
  mon: 'monday', monday: 'monday',
  tue: 'tuesday', tuesday: 'tuesday',
  wed: 'wednesday', wednesday: 'wednesday',
  thu: 'thursday', thursday: 'thursday',
  fri: 'friday', friday: 'friday',
  sat: 'saturday', saturday: 'saturday',
  sun: 'sunday', sunday: 'sunday',
}

function extractDay(line: string): DayOfWeek | undefined {
  const match = line.toLowerCase().match(/\b(mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/)
  return match ? DAY_MAP[match[1]] : undefined
}

function guessPriority(line: string): Priority {
  if (/\b(urgent|critical|asap|important|must|high priority)\b/i.test(line)) return 'high'
  if (/\b(low priority|whenever|someday|maybe)\b/i.test(line)) return 'low'
  return 'medium'
}

function classifyLine(
  line: string,
  result: BrainDumpParseResult
): void {
  const trimmed = line.trim().replace(/^[-*•]\s*/, '')
  if (!trimmed) return

  if (DEADLINE_KEYWORDS.test(trimmed)) {
    result.deadlines.push({ title: trimmed })
    return
  }
  if (HABIT_KEYWORDS.test(trimmed)) {
    result.habits.push(trimmed)
    return
  }
  if (GOAL_KEYWORDS.test(trimmed)) {
    result.goals.push(trimmed)
    return
  }
  if (REMINDER_KEYWORDS.test(trimmed)) {
    result.reminders.push(trimmed)
    return
  }
  if (TASK_KEYWORDS.test(trimmed)) {
    result.tasks.push({
      title: trimmed,
      priority: guessPriority(trimmed),
      day: extractDay(trimmed),
    })
    return
  }
  // Fallback: capture as a note
  result.notes.push(trimmed)
}

// ─── Contract ─────────────────────────────────────────────────────────────────

export const organizeBrainDumpContract: AITool<OrganizeBrainDumpInput, OrganizeBrainDumpOutput> = {
  id: 'organizeBrainDump',
  name: 'Organize Brain Dump',
  description:
    'Parse and classify raw brain-dump text into structured categories: tasks, goals, reminders, habits, deadlines, and notes. Uses heuristic classification; Phase 2.5 will add full LLM-backed parsing.',
  category: 'planning',
  requiresConfirmation: false,

  inputSchema: {
    type: 'object',
    description: 'Raw brain dump text to organize',
    properties: {
      rawText: { type: 'string', description: 'The raw unstructured text to parse (required)' },
    },
    required: ['rawText'],
  },

  outputSchema: {
    type: 'object',
    description: 'Structured brain dump parse result',
    properties: {
      rawInput: { type: 'string', description: 'The original raw text' },
      tasks: { type: 'array', description: 'Extracted task items', items: { type: 'object' } },
      goals: { type: 'array', description: 'Extracted goals', items: { type: 'string' } },
      reminders: { type: 'array', description: 'Extracted reminders', items: { type: 'string' } },
      habits: { type: 'array', description: 'Extracted habits', items: { type: 'string' } },
      deadlines: { type: 'array', description: 'Extracted deadlines', items: { type: 'object' } },
      notes: { type: 'array', description: 'Uncategorized notes', items: { type: 'string' } },
    },
    required: ['rawInput', 'tasks', 'goals', 'reminders', 'habits', 'deadlines', 'notes'],
  },

  execute: async (input): Promise<AIToolResult<OrganizeBrainDumpOutput>> => {
    const result: BrainDumpParseResult = {
      rawInput: input.rawText,
      tasks: [],
      goals: [],
      reminders: [],
      habits: [],
      deadlines: [],
      notes: [],
    }

    const lines = input.rawText.split(/\n|\.(?=\s)/).filter((l) => l.trim())
    for (const line of lines) {
      classifyLine(line, result)
    }

    return { ok: true, output: result }
  },
}
