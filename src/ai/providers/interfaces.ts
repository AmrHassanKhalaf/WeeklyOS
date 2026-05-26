import type { AIProvider } from '../types'

/**
 * Creates a placeholder provider that throws a clear error when called.
 * Used as a safe default for providers that are not yet configured.
 */
export function createUnavailableProvider(id: string, label: string): AIProvider {
  return {
    id,
    label,
    supportsTools: false,
    supportsStreaming: false,
    generate: async () => {
      throw new Error(`${label} provider is not configured yet.`)
    },
  }
}

/** Named stubs for future provider integrations. */
export const futureProviders = {
  openai: createUnavailableProvider('openai', 'OpenAI'),
  openrouter: createUnavailableProvider('openrouter', 'OpenRouter'),
  gemini: createUnavailableProvider('gemini', 'Gemini'),
  groq: createUnavailableProvider('groq', 'Groq'),
  local: createUnavailableProvider('local', 'Local Model'),
}
