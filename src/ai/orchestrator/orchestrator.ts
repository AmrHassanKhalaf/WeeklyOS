import { buildAIContext } from '../context'
import { getWorkspaceModeDefinition } from '../modes'
import { buildWorkspacePromptMessages } from '../prompts'
import { defaultAIToolRegistry, type AIToolRegistry } from '../tools'
import type {
  AIContext,
  AIContextInput,
  AIMessage,
  AIProvider,
  AIProviderResponse,
  AITool,
  WorkspaceMode,
} from '../types'

export interface AIOrchestratorPrepareInput {
  mode: WorkspaceMode
  userInput: string
  contextInput: AIContextInput
  history?: AIMessage[]
}

export interface AIOrchestratorPreparedRequest {
  mode: WorkspaceMode
  context: AIContext
  messages: AIMessage[]
  tools: AITool[]
}

export interface AIOrchestrator {
  prepare: (input: AIOrchestratorPrepareInput) => AIOrchestratorPreparedRequest
  run: (input: AIOrchestratorPrepareInput) => Promise<AIProviderResponse>
}

export interface AIOrchestratorOptions {
  provider?: AIProvider
  toolRegistry?: AIToolRegistry
}

export function createAIOrchestrator(options: AIOrchestratorOptions = {}): AIOrchestrator {
  const toolRegistry = options.toolRegistry ?? defaultAIToolRegistry

  const prepare = (input: AIOrchestratorPrepareInput): AIOrchestratorPreparedRequest => {
    const context = buildAIContext(input.contextInput)
    const modeDefinition = getWorkspaceModeDefinition(input.mode)
    const tools = toolRegistry.resolve(modeDefinition.allowedToolIds)
    const messages = [
      ...(input.history ?? []),
      ...buildWorkspacePromptMessages(input.mode, context, input.userInput),
    ]

    return {
      mode: input.mode,
      context,
      messages,
      tools,
    }
  }

  return {
    prepare,
    run: async (input) => {
      if (!options.provider) {
        throw new Error('AI provider is not configured in the architecture skeleton.')
      }

      const prepared = prepare(input)
      return options.provider.send(prepared)
    },
  }
}
