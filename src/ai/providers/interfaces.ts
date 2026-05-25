import type { AIProvider } from '../types'

export function createUnavailableProvider(id: string, label: string): AIProvider {
  return {
    id,
    label,
    supportsTools: false,
    send: async () => {
      throw new Error(`${label} provider is not configured in this phase.`)
    },
  }
}

export const futureProviders = {
  openai: createUnavailableProvider('openai', 'OpenAI'),
  openrouter: createUnavailableProvider('openrouter', 'OpenRouter'),
  gemini: createUnavailableProvider('gemini', 'Gemini'),
  groq: createUnavailableProvider('groq', 'Groq'),
  local: createUnavailableProvider('local', 'Local Model'),
}
