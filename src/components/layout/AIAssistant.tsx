import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAiApi } from '../../hooks/useApi'

type Tab = 'insights' | 'stats' | 'activity'

interface AIAssistantProps {
  variant?: 'default' | 'evaluation'
}

export function AIAssistant({ variant = 'default' }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<Tab>('insights')
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    {
      role: 'ai',
      text: "Based on your activity data, I've noticed a significant trend. Your output on Wednesday was 45% lower than your average, and your biometric indicators suggest elevated stress.",
    },
  ])
  const { sendMessage } = useAiApi()
  const navigate = useNavigate()

  const handleSendMessage = async (overrideText?: string) => {
    const msg = (overrideText ?? chatInput).trim()
    if (!msg) return
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text: msg }])
    const res = await sendMessage('chat', msg, {})
    setChatMessages(prev => [...prev, { role: 'ai', text: res.response }])
  }

  const quickActions = ['Optimize my schedule', 'Analyze my productivity', 'Plan my week']

  return (
    <aside className="fixed right-0 top-0 h-screen w-80 z-30 bg-[#1C1B1B] border-l border-white/5 shadow-2xl shadow-[#2F5CFF]/5 flex flex-col font-['Inter']">
      {/* Header */}
      <div className="p-6 pt-20 border-b border-white/5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-sm font-semibold text-[#4EDEA3]">AI Assistant</h2>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Productivity Analyst</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex gap-4 border-b border-white/5 px-6 pb-3 pt-4">
        {(['insights', 'stats', 'activity'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize text-sm font-medium transition-colors ${
              activeTab === tab ? 'text-[#4EDEA3] font-bold' : 'text-neutral-500 hover:text-white'
            }`}
          >
            {tab === 'insights' ? 'AI Insights' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {/* Content */}
      {variant === 'evaluation' ? (
        /* Evaluation chat view */
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'max-w-[90%]'}`}>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'ai'
                  ? 'bg-surface-container-high rounded-tl-none'
                  : 'bg-primary-container text-on-primary-container rounded-tr-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {/* Burnout alert */}
          <div className="bg-error-container/20 border border-error/20 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-error mb-2">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <span className="text-xs font-bold uppercase tracking-wider">Burnout Risk Detected</span>
            </div>
            <p className="text-xs text-on-error-container leading-relaxed">Wednesday metrics indicate a high cognitive load failure. Continuing at this pace may lead to a productivity crash.</p>
            <button
              onClick={() => navigate('/weekly-distribution')}
              className="mt-3 w-full bg-error text-on-error text-[10px] font-bold py-2 rounded uppercase tracking-widest hover:brightness-110 transition-all"
            >
              Schedule Rest Day
            </button>
          </div>
        </div>
      ) : (
        /* Default insights view */
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {activeTab === 'insights' && (
            <>
              <div className="bg-surface-container-high rounded-lg p-4 space-y-3 border-l-2 border-tertiary/40">
                <div className="flex items-center gap-2 text-tertiary">
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter">Energy Level Peak</span>
                </div>
                <p className="text-xs text-on-surface/80 leading-relaxed">Based on last week, your creative output peaks between 9 AM and 11 AM. Tomorrow is blocked for focus work.</p>
              </div>
              <div className="bg-surface-container-high rounded-lg p-4 space-y-3 border-l-2 border-primary/40">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  <span className="text-[10px] font-black uppercase tracking-tighter">Deadline Risk</span>
                </div>
                <p className="text-xs text-on-surface/80 leading-relaxed">Friday's "Client Presentations" task has 4 subtasks pending. Start prep 1 hour earlier.</p>
              </div>
              <div className="space-y-4 pt-4">
                <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Recent Activity</h3>
                <div className="space-y-3">
                  {[
                    { text: '"Bento Layout" completed', time: '24m ago', done: true },
                    { text: '"Color Tokens" completed', time: '1h ago', done: true },
                    { text: 'New plan: "Spring Sprint"', time: '3h ago', done: false },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 ${item.done ? 'bg-tertiary' : 'bg-neutral-600'}`} />
                      <div>
                        <p className="text-on-surface">{item.text}</p>
                        <p className="text-[10px] text-neutral-500">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-lowest p-3 rounded-lg border border-white/5">
                  <div className="text-xl font-bold">84%</div>
                  <div className="text-[10px] text-neutral-500 uppercase">Focus Score</div>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded-lg border border-white/5">
                  <div className="text-xl font-bold">4.2h</div>
                  <div className="text-[10px] text-neutral-500 uppercase">Deep Work</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-500 px-1">
                  <span>Weekly Progress</span>
                  <span>64%</span>
                </div>
                <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary w-[64%] shadow-[0_0_8px_#4edea3]" />
                </div>
              </div>
            </div>
          )}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              {[
                { text: 'Completed "UI Audit"', time: 'Just now', done: true },
                { text: 'Started Pomodoro #3', time: '25m ago', done: false },
                { text: '"Color Tokens" marked done', time: '1h ago', done: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className={`w-1.5 h-1.5 rounded-full ${item.done ? 'bg-tertiary' : 'bg-neutral-600'}`} />
                  <div>
                    <p className="text-on-surface-variant">{item.text}</p>
                    <p className="text-[10px] text-neutral-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat input */}
      <div className="p-4 border-t border-white/5 bg-surface-container-low space-y-3">
        {variant === 'evaluation' && (
          <div className="flex flex-wrap gap-2">
            {quickActions.map(a => (
              <button
                key={a}
                onClick={() => handleSendMessage(a)}
                className="px-3 py-1.5 bg-surface-container-high hover:bg-surface-variant text-[10px] text-on-surface rounded-full transition-colors"
              >
                {a}
              </button>
            ))}
          </div>
        )}
        <div className="relative flex items-center">
          {variant === 'default' && (
            <span className="material-symbols-outlined text-neutral-500 text-sm absolute left-3">auto_awesome</span>
          )}
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder={variant === 'evaluation' ? 'Ask AI Assistant...' : 'Ask AI anything...'}
            className={`w-full bg-surface-container-highest border border-white/5 rounded-xl py-2.5 text-xs focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-colors outline-none placeholder:text-neutral-600 text-on-surface ${
              variant === 'default' ? 'pl-9 pr-4' : 'pl-4 pr-10'
            }`}
          />
          {variant === 'evaluation' && (
            <button onClick={() => handleSendMessage()} className="absolute right-2 text-primary hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">send</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
