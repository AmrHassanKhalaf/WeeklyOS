import assert from 'node:assert/strict'
import { createAIOrchestrator } from '../../src/ai/orchestrator'
import { runReflectionPipeline } from '../../src/ai/reflection/pipeline'
import { buildReflectionUIBlocks } from '../../src/ai/reflection/blocks'
import { defaultAIToolRegistry, executeTool } from '../../src/ai/tools'
import type { AIProvider } from '../../src/ai/types'
import type { PlanningResult } from '../../src/ai/planning/types'
import { createAIRegressionContext } from './fixtures'

async function testReflectionPipeline() {
  const context = createAIRegressionContext()
  const result = runReflectionPipeline(context, { maxInsights: 6 })

  assert.equal(result.context.weekId, 'week-audit')
  assert.equal(result.completion.highPriorityCompleted, 1)
  assert.ok(Array.isArray(result.insights))
  assert.ok(Array.isArray(result.summary.nextWeekRecommendations))
  assert.ok(result.score.overall >= 0 && result.score.overall <= 100)

  const blocks = buildReflectionUIBlocks(result)
  assert.ok(blocks.some((block) => block.kind === 'reflection_summary'))
  assert.ok(blocks.some((block) => block.kind === 'reflection_score_breakdown'))
}

async function testToolContracts() {
  const context = createAIRegressionContext()
  const summarizeReflection = defaultAIToolRegistry.get('summarizeReflection')
  const createTask = defaultAIToolRegistry.get('createTask')
  const rescheduleTasks = defaultAIToolRegistry.get('rescheduleTasks')

  assert.ok(summarizeReflection)
  assert.ok(createTask)
  assert.ok(rescheduleTasks)

  const reflectionResult = await executeTool(summarizeReflection, {}, { aiContext: context, mode: 'reflect' })
  assert.equal(reflectionResult.status, 'success')

  const invalidCreate = await executeTool(createTask, { priority: 'high' }, { aiContext: context, mode: 'chat' })
  assert.equal(invalidCreate.status, 'validation_error')

  const pendingCreate = await executeTool(
    createTask,
    { title: 'Regression-created task', priority: 'high' },
    { aiContext: context, mode: 'chat' }
  )
  assert.equal(pendingCreate.status, 'pending_confirmation')

  const pendingReschedule = await executeTool(
    rescheduleTasks,
    { fromDay: 'monday', maxTasksToMove: 2 },
    { aiContext: context, mode: 'plan' }
  )
  assert.equal(pendingReschedule.status, 'pending_confirmation')
  assert.ok(((pendingReschedule.output as PlanningResult).rebalanceSuggestions ?? []).length > 0)
}

async function testProviderToolPermissionGate() {
  const context = createAIRegressionContext()
  const provider: AIProvider = {
    id: 'mock',
    label: 'Mock Provider',
    supportsTools: true,
    supportsStreaming: false,
    generate: async () => ({
      message: { role: 'assistant', content: 'mock response' },
      provider: 'mock',
      model: 'mock-model',
      toolCalls: [
        {
          toolId: 'createTask',
          toolName: 'Create Task',
          input: { title: 'Should not run in analyze mode', priority: 'high' },
        },
      ],
    }),
  }

  const orchestrator = createAIOrchestrator({ provider })
  const denied = await orchestrator.execute({
    userMessage: 'Analyze my week',
    mode: 'analyze',
    context,
  })

  assert.equal(denied.pendingConfirmations, undefined)
  const deniedToolCalls = (denied.metadata?.deniedToolCalls ?? []) as Array<{ toolId: string; reason: string }>
  assert.equal(deniedToolCalls.length, 1)
  assert.equal(deniedToolCalls[0].toolId, 'createTask')
  assert.equal(deniedToolCalls[0].reason, 'not_allowed_for_mode')

  const allowed = await orchestrator.execute({
    userMessage: 'Create a task',
    mode: 'chat',
    context,
  })

  assert.equal(allowed.pendingConfirmations?.length, 1)
  assert.equal(allowed.pendingConfirmations?.[0].toolId, 'createTask')
}

await testReflectionPipeline()
await testToolContracts()
await testProviderToolPermissionGate()

console.log('AI regression fixtures passed')
