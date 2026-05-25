import type { BrainDumpParseResult } from '../types'

export function createEmptyBrainDumpParseResult(rawInput = ''): BrainDumpParseResult {
  return {
    rawInput,
    tasks: [],
    goals: [],
    reminders: [],
    habits: [],
    deadlines: [],
    notes: rawInput.trim() ? [rawInput.trim()] : [],
  }
}

export function parseBrainDumpDraft(rawInput: string): BrainDumpParseResult {
  return createEmptyBrainDumpParseResult(rawInput)
}
