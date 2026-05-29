import { Bot } from 'lucide-react'
import { UIBlockList } from './blocks/BrainDumpUIBlock'
import { PlanningUIBlock } from './blocks/PlanningUIBlock'
import type { SessionMessage } from '../../ai/hooks'
import { cn } from '../../lib/cn'

interface ChatThreadProps {
  messages: SessionMessage[]
  isAiTyping: boolean
}

function FormattedMessage({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed text-on-surface/90" dir="auto">
      {text.split('\n').map((line, index) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={index} className="h-1" />
        if (/^[-*]\s+/.test(trimmed)) {
          return (
            <div key={index} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
              <p>{trimmed.replace(/^[-*]\s+/, '')}</p>
            </div>
          )
        }
        return <p key={index}>{trimmed}</p>
      })}
    </div>
  )
}

export function ChatThread({ messages, isAiTyping }: ChatThreadProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
        >
          <div
            className={cn(
              'max-w-[92%] rounded-3xl border px-4 py-3 sm:max-w-[78%]',
              message.role === 'user'
                ? 'border-primary/[0.28] bg-gradient-to-br from-primary/[0.18] via-primary/10 to-tertiary/[0.08] text-on-surface rounded-br-lg shadow-[0_16px_34px_-24px_rgba(124,58,237,0.8)]'
                : message.role === 'system'
                  ? 'border-red-300/[0.18] bg-red-500/10 text-red-100 rounded-bl-lg'
                  : 'border-primary/[0.14] bg-gradient-to-br from-primary/[0.08] via-surface-container-low/[0.58] to-surface-container-lowest/[0.78] text-on-surface rounded-bl-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
            )}
          >
            {message.text && <FormattedMessage text={message.text} />}
            {message.uiBlocks && message.uiBlocks.length > 0 && (
              <UIBlockList blocks={message.uiBlocks} PlanningBlockComponent={PlanningUIBlock} />
            )}
            {(message.provider || message.latencyMs != null) && (
              <p className="mt-3 border-t border-outline-variant/[0.12] pt-2 text-right text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-300/[0.65]">
                {message.provider ? `via ${message.provider}` : 'ai'}{message.latencyMs != null ? ` | ${message.latencyMs}ms` : ''}
              </p>
            )}
          </div>
        </div>
      ))}

      {isAiTyping && (
        <div className="flex justify-start">
          <div className="inline-flex items-center gap-3 rounded-3xl rounded-bl-lg border border-primary/[0.14] bg-gradient-to-br from-primary/[0.08] via-surface-container-low/[0.58] to-surface-container-lowest/[0.78] px-4 py-3 text-sm text-on-surface-variant">
            <Bot className="h-4 w-4 text-cyan-200" strokeWidth={1.7} />
            <span className="animate-pulse">Processing WeeklyOS context...</span>
          </div>
        </div>
      )}
    </div>
  )
}
