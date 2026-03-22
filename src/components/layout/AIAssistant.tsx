import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAiApi } from '../../hooks/useApi'
import { useLayoutStore } from '../../store/useLayoutStore'
import { useWeekStore } from '../../store/useWeekStore'

type Tab = 'insights' | 'stats' | 'activity' | 'chat'

interface AIAssistantProps {
  variant?: 'default' | 'evaluation'
}

export function AIAssistant({ variant = 'default' }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState<Tab>('insights')
  const [chatInput, setChatInput] = useState('')
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  
  const [chatMessages, setChatMessages] = useState<{ role: 'ai' | 'user' | 'system'; text: string; provider?: string }[]>([
    {
      role: 'ai',
      text: "Based on your activity data, I've noticed a significant trend. Your output on Wednesday was 45% lower than your average, and your biometric indicators suggest elevated stress.",
    },
  ])
  const { sendMessage } = useAiApi()
  const navigate = useNavigate()
  const { isRightSidebarOpen, isFocusMode, toggleRightSidebar, closeSidebarsOnMobile } = useLayoutStore()
  const { currentWeek } = useWeekStore()

  const isActuallyOpen = isRightSidebarOpen && !isFocusMode

  // Dynamic Insights calculation
  const getActivityInsights = () => {
    if (!currentWeek) return { peakDay: 'Monday', riskDay: 'None', riskCount: 0 }
    let maxDone = -1
    let peakDay = '...'
    let maxPending = -1
    let riskDay = '...'
    currentWeek.days.forEach(d => {
      const doneQty = (d.highTask?.status==='done'?1:0) + d.mediumTasks.filter(t=>t.status==='done').length + d.smallTasks.filter(t=>t.status==='done').length
      if(doneQty > maxDone) { maxDone = doneQty; peakDay = d.shortName }
      const pendingQty = (d.highTask?.status==='pending'?1:0) + d.mediumTasks.filter(t=>t.status==='pending').length + d.smallTasks.filter(t=>t.status==='pending').length
      if(pendingQty > maxPending) { maxPending = pendingQty; riskDay = d.shortName }
    })
    return { peakDay, riskDay, riskCount: maxPending }
  }
  const insightsData = getActivityInsights()

  const handleSendMessage = async (overrideText?: string) => {
    const msg = (overrideText ?? chatInput).trim()
    if (!msg || isAiTyping) return
    setChatInput('')
    setActiveTab('chat')
    setChatMessages(prev => [...prev, { role: 'user', text: msg }])
    
    setIsAiTyping(true)
    try {
      const { currentWeek } = useWeekStore.getState()
      const context = currentWeek ? { weekTitle: currentWeek.title, score: currentWeek.score, days: currentWeek.days } : {}
      
      const res = await sendMessage('chat', msg, context)
      setChatMessages(prev => [...prev, { role: 'ai', text: res.response, provider: res.providerUsed }])
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: 'system', text: `System Error: ${e.message}` }])
    } finally {
      setIsAiTyping(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data)
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = async () => {
           const base64data = (reader.result as string).split(',')[1]
           await handleVoiceMessage(base64data)
        }
      }

      recorder.start()
      setIsRecording(true)
    } catch (e) {
      console.error('Failed to start recording', e)
      alert('Microphone access denied or unavailable.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
      setIsRecording(false)
    }
  }

  const handleVoiceMessage = async (base64audio: string) => {
    if (isAiTyping) return
    setActiveTab('chat')
    setChatMessages(prev => [...prev, { role: 'user', text: '🎤 Voice Message' }])
    
    setIsAiTyping(true)
    try {
      const { currentWeek } = useWeekStore.getState()
      const context = currentWeek ? { weekTitle: currentWeek.title, score: currentWeek.score, days: currentWeek.days } : {}
      
      const res = await sendMessage('voice', '', context, 'gemini', base64audio)
      setChatMessages(prev => [...prev, { role: 'ai', text: res.response, provider: res.providerUsed }])
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: 'system', text: `System Error: ${e.message}` }])
    } finally {
      setIsAiTyping(false)
    }
  }

  const quickActions = ['Optimize my schedule', 'Analyze my productivity', 'Plan my week']

  return (
    <>
      <aside className={`fixed right-0 top-0 h-screen w-80 z-50 bg-[#1C1B1B] border-l border-white/5 shadow-2xl shadow-[#2F5CFF]/5 flex flex-col font-['Inter'] transition-transform duration-300 ${
        isActuallyOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
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
        {(['insights', 'stats', 'activity', 'chat'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`capitalize text-sm font-medium transition-colors ${
              activeTab === tab ? 'text-[#4EDEA3] font-bold' : 'text-neutral-500 hover:text-white'
            }`}
          >
            {tab === 'insights' ? 'AI Insights' : tab === 'chat' ? 'Chat' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                  ? 'bg-surface-container-high border border-white/5 rounded-tl-none'
                  : msg.role === 'system' 
                  ? 'bg-error/20 text-error border border-error/20 rounded-tl-none'
                  : 'bg-primary-container text-on-primary-container rounded-tr-none'
              }`}>
                {msg.text}
                {msg.provider && <span className="block mt-2 text-[9px] uppercase tracking-widest opacity-50 text-right">via {msg.provider}</span>}
              </div>
            </div>
          ))}
          {isAiTyping && (
            <div className="flex flex-col gap-2 max-w-[90%]">
              <div className="p-3 bg-surface-container-high rounded-2xl rounded-tl-none text-sm text-neutral-400">
                <span className="animate-pulse flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">smart_toy</span>
                  Thinking...
                </span>
              </div>
            </div>
          )}
          {/* Burnout alert */}
          <div className="bg-error-container/20 border border-error/20 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-error mb-2">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              <span className="text-xs font-bold uppercase tracking-wider">Burnout Risk Detected</span>
            </div>
            <p className="text-xs text-on-error-container leading-relaxed">Wednesday metrics indicate a high cognitive load failure. Continuing at this pace may lead to a productivity crash.</p>
            <button
              onClick={() => { navigate('/weekly-distribution'); closeSidebarsOnMobile(); }}
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
                <p className="text-xs text-on-surface/80 leading-relaxed">Based on this week's data, your output volume peaked on {insightsData.peakDay}. Consider reserving that day for deep work next week.</p>
              </div>
              
              {insightsData.riskCount > 0 ? (
                <div className="bg-surface-container-high rounded-lg p-4 space-y-3 border-l-2 border-primary/40">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Deadline Risk</span>
                  </div>
                  <p className="text-xs text-on-surface/80 leading-relaxed">{insightsData.riskDay} has {insightsData.riskCount} pending tasks remaining. Batch these soon to prevent spillover.</p>
                </div>
              ) : (
                <div className="bg-surface-container-high rounded-lg p-4 space-y-3 border-l-2 border-surface-variant">
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span className="text-[10px] font-black uppercase tracking-tighter">All Clear</span>
                  </div>
                  <p className="text-xs text-on-surface/80 leading-relaxed">You have zero outstanding risks tracked across your days. Excellent pacing.</p>
                </div>
              )}
              
              <div className="space-y-4 pt-4">
                <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Recent Activity</h3>
                <div className="space-y-3">
                  {currentWeek?.activities?.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex gap-3 text-xs">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 ${item.done ? 'bg-tertiary' : 'bg-neutral-600'}`} />
                      <div>
                        <p className="text-on-surface">{item.text}</p>
                        <p className="text-[10px] text-neutral-500">{Math.floor((Date.now() - item.time) / 60000)}m ago</p>
                      </div>
                    </div>
                  ))}
                  {(!currentWeek?.activities || currentWeek.activities.length === 0) && (
                    <p className="text-xs text-neutral-500">No recent activity.</p>
                  )}
                </div>
              </div>
            </>
          )}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-lowest p-3 rounded-lg border border-white/5">
                  <div className="text-xl font-bold">{currentWeek?.score || 0}%</div>
                  <div className="text-[10px] text-neutral-500 uppercase">Focus Score</div>
                </div>
                <div className="bg-surface-container-lowest p-3 rounded-lg border border-white/5">
                  <div className="text-xl font-bold">{currentWeek?.totalCompleted || 0}</div>
                  <div className="text-[10px] text-neutral-500 uppercase">Tasks Done</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-neutral-500 px-1">
                  <span>Weekly Progress</span>
                  <span>{currentWeek ? Math.round((currentWeek.totalCompleted / (currentWeek.totalPlanned || 1)) * 100) : 0}%</span>
                </div>
                <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary shadow-[0_0_8px_#4edea3] transition-all" style={{ width: `${currentWeek ? Math.round((currentWeek.totalCompleted / (currentWeek.totalPlanned || 1)) * 100) : 0}%` }} />
                </div>
              </div>
            </div>
          )}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              {currentWeek?.activities && currentWeek.activities.length > 0 ? (
                currentWeek.activities.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.done ? 'bg-tertiary' : 'bg-neutral-600'}`} />
                    <div>
                      <p className="text-on-surface-variant">{item.text}</p>
                      <p className="text-[10px] text-neutral-500">
                        {Math.floor((Date.now() - item.time) / 60000) > 0 ? `${Math.floor((Date.now() - item.time) / 60000)}m ago` : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500">No activity logged yet.</p>
              )}
            </div>
          )}
          
          {activeTab === 'chat' && (
            <div className="space-y-4 pb-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'max-w-[95%]'}`}>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'ai'
                      ? 'bg-surface-container-highest border border-white/5 rounded-tl-none'
                      : msg.role === 'system'
                      ? 'bg-error-container/20 text-error border border-error/20 rounded-tl-none'
                      : 'bg-primary-container text-on-primary-container rounded-tr-none shadow-md'
                  }`}>
                    {msg.text}
                    {msg.provider && <span className="block mt-2 text-[9px] uppercase tracking-widest opacity-50 text-right">via {msg.provider}</span>}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex flex-col gap-2 max-w-[90%]">
                  <div className="p-3 bg-surface-container-high rounded-2xl rounded-tl-none text-sm text-neutral-400">
                    <span className="animate-pulse flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#4EDEA3]">smart_toy</span>
                      Processing data...
                    </span>
                  </div>
                </div>
              )}
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
            placeholder={isRecording ? 'Listening...' : variant === 'evaluation' ? 'Ask AI Assistant...' : 'Ask AI anything...'}
            disabled={isRecording}
            className={`w-full bg-surface-container-highest border border-white/5 rounded-xl py-2.5 text-xs focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-colors outline-none placeholder:text-neutral-600 text-on-surface ${
              variant === 'default' ? 'pl-9 pr-10' : 'pl-4 pr-16'
            }`}
          />
          <div className="absolute right-2 flex items-center gap-1">
            <button 
              onClick={isRecording ? stopRecording : startRecording} 
              className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${isRecording ? 'text-error animate-pulse bg-error/10' : 'text-neutral-500 hover:text-white'}`}
            >
              <span className="material-symbols-outlined text-[18px]">{isRecording ? 'stop_circle' : 'mic'}</span>
            </button>
            {variant === 'evaluation' && (
              <button onClick={() => handleSendMessage()} className="p-1.5 text-primary hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>

      {/* Edge Toggle Button */}
      <button
        onClick={toggleRightSidebar}
        className={`fixed top-1/2 -translate-y-1/2 z-50 w-6 h-6 bg-[#1C1B1B] border border-white/10 rounded-full flex items-center justify-center text-[#A1A1A1] hover:text-white hover:border-white/30 transition-all duration-300 hidden lg:flex shadow-md ${
          isActuallyOpen ? 'right-[calc(20rem-12px)]' : 'right-0 rounded-r-none border-r-0'
        } ${isFocusMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <span className="material-symbols-outlined text-[14px]">
          {isRightSidebarOpen ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>
    </>
  )
}
