import type { AIToolSchema, AIToolSchemaProperty } from '../types'

// ─── Validation Types ─────────────────────────────────────────────────────────

export type ToolValidationSeverity = 'error' | 'warning'

export interface ToolValidationIssue {
  field: string
  message: string
  severity: ToolValidationSeverity
}

export interface ToolValidationResult {
  valid: boolean
  issues: ToolValidationIssue[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveActualType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function checkPropertyType(
  field: string,
  value: unknown,
  schema: AIToolSchemaProperty,
  issues: ToolValidationIssue[]
): void {
  const { type } = schema
  if (type === 'unknown') return

  const actual = resolveActualType(value)

  if (type === 'array' && actual !== 'array') {
    issues.push({
      field,
      message: `"${field}" must be an array, got ${actual}`,
      severity: 'error',
    })
    return
  }

  if (type !== 'array' && type !== 'object' && actual !== type) {
    issues.push({
      field,
      message: `"${field}" must be ${type}, got ${actual}`,
      severity: 'error',
    })
  }

  // Recurse into array items if schema specifies
  if (type === 'array' && schema.items && Array.isArray(value)) {
    ;(value as unknown[]).forEach((item, idx) => {
      checkPropertyType(`${field}[${idx}]`, item, schema.items!, issues)
    })
  }
}

// ─── Validator ────────────────────────────────────────────────────────────────

/**
 * Validates a tool input object against an AIToolSchema.
 *
 * Checks:
 * - All required fields are present and non-null
 * - Present fields match their declared types
 * - Array items match their item schema (one level deep)
 *
 * Does NOT call external libraries — intentionally lightweight so it runs
 * synchronously in any environment.
 */
export function validateToolInput(
  schema: AIToolSchema,
  input: Record<string, unknown>
): ToolValidationResult {
  const issues: ToolValidationIssue[] = []

  // Required field check
  for (const field of schema.required ?? []) {
    if (input[field] === undefined || input[field] === null) {
      issues.push({
        field,
        message: `Required field "${field}" is missing`,
        severity: 'error',
      })
    }
  }

  // Type checks for all present values
  for (const [field, propSchema] of Object.entries(schema.properties)) {
    const value = input[field]
    if (value === undefined || value === null) continue
    checkPropertyType(field, value, propSchema, issues)
  }

  return {
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  }
}

/** Returns a human-readable string of all validation errors, or empty string. */
export function formatValidationErrors(result: ToolValidationResult): string {
  return result.issues
    .filter((i) => i.severity === 'error')
    .map((i) => i.message)
    .join('; ')
}
