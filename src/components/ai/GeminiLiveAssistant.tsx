import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Square, Play, Sparkles, MessageCircle } from 'lucide-react';
import { useWeekStore } from '../../store/useWeekStore';

interface GeminiLiveAssistantProps {
  onClose?: () => void;
}

type LiveState = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'error';

export function GeminiLiveAssistant({ onClose }: GeminiLiveAssistantProps) {
  const [state, setState] = useState<LiveState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const audioOutPoolRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  
  const lastActiveTimeRef = useRef(Date.now());
  const silenceThreshold = 0.015; 
  const silenceDuration = 1500; // 1.5s as requested

  const { currentWeek } = useWeekStore();

  const stopAll = useCallback(() => {
    setState('idle');
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    isPlayingRef.current = false;
    audioOutPoolRef.current = [];
  }, []);

  const startLive = async () => {
    try {
      setError(null);
      setState('connecting');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("VITE_GEMINI_API_KEY missing");
      
      // Real-time WebSocket Protocol
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BiDiGenerateContent?key=${apiKey}`;
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onerror = (ev) => {
        console.error("WS Error", ev);
        setError("Connection failed. Check API permissions (Gemini 2.0 Live).");
        setState('error');
      };

      socket.onopen = () => {
        setState('listening');
        const setupMsg = {
          setup: {
            model: "models/gemini-2.5-flash-native-audio-preview-12-2025", 
            generation_config: { response_modalities: ["audio"] },
            system_instruction: {
                parts: [{ 
                    text: `You are the WeeklyOS Empathetic Productivity Coach. 
                    - Goal: Listen to user ranting (فضفضة), show deep empathy, and ask therapeutic follow-up questions.
                    - Style: Friendly, brief Arabic (العربية الودية والمختصرة). 
                    - Interaction: Instead of standard advice, help the user explore their feelings and productivity blockers.
                    - Current Context: Week "${currentWeek?.title || 'Unknown'}", Focus Score: ${currentWeek?.score || 0}%.
                    - Don't be pushy. Be a safe space for the user.`
                }]
            }
          }
        };
        socket.send(JSON.stringify(setupMsg));
        
        source.connect(processor);
        processor.connect(audioCtx.destination);
      };

      socket.onmessage = async (event) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          
          if (data.serverContent?.modelTurn?.parts) {
            for (const part of data.serverContent.modelTurn.parts) {
               if (part.inlineData?.data) {
                  const raw = atob(part.inlineData.data);
                  const buffer = new Float32Array(raw.length / 2);
                  const view = new DataView(new ArrayBuffer(raw.length));
                  for(let i=0; i<raw.length; i++) view.setUint8(i, raw.charCodeAt(i));
                  
                  for(let i=0; i<buffer.length; i++) {
                    buffer[i] = view.getInt16(i * 2, true) / 32768.0;
                  }
                  audioOutPoolRef.current.push(buffer);
                  if (!isPlayingRef.current) playNextChunk();
               }
            }
          }
        } catch (e) { console.error("Msg Error", e); }
      };

      processor.onaudioprocess = (e) => {
        if (state !== 'listening') return;
        
        const input = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
        const rms = Math.sqrt(sum / input.length);
        setVolume(rms);

        // VAD Logic (1.5s Silence)
        if (rms > silenceThreshold) {
          lastActiveTimeRef.current = Date.now();
        } else if (Date.now() - lastActiveTimeRef.current > silenceDuration) {
          // Trigger response if we were actually receiving meaningful audio
        }

        if (socket.readyState === WebSocket.OPEN) {
          const int16 = new Int16Array(input.length);
          for(let i=0; i<input.length; i++) int16[i] = input[i] * 32767;
          const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
          socket.send(JSON.stringify({
            realtime_input: {
                media_chunks: [{ mime_type: "audio/pcm", data: base64 }]
            }
          }));
        }
      };

      const playNextChunk = () => {
        if (audioOutPoolRef.current.length === 0) {
          isPlayingRef.current = false;
          setState('listening');
          return;
        }
        
        setState('speaking');
        isPlayingRef.current = true;
        const chunk = audioOutPoolRef.current.shift()!;
        const buffer = audioCtx.createBuffer(1, chunk.length, 16000);
        buffer.getChannelData(0).set(chunk);
        
        const node = audioCtx.createBufferSource();
        node.buffer = buffer;
        node.connect(audioCtx.destination);
        node.onended = playNextChunk;
        node.start();
      };
    } catch (e: any) {
      setError(e.message);
      setState('error');
    }
  };

  useEffect(() => {
    return () => stopAll();
  }, [stopAll]);

  return (
    <div className="flex flex-col items-center justify-between h-full w-full p-8 bg-black/40 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 -left-10 w-40 h-40 bg-primary/20 blur-[80px] rounded-full" />
      <div className="absolute bottom-0 -right-10 w-40 h-40 bg-tertiary/20 blur-[80px] rounded-full" />
      
      {/* Header Info */}
      <div className="w-full flex justify-between items-start z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Empathetic Coach</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Gemini Live</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <X className="w-5 h-5 text-neutral-500 hover:text-white" />
        </button>
      </div>

      {/* Main Visualizer */}
      <div className="relative flex-1 flex flex-col items-center justify-center space-y-10 z-10">
        <div className="relative">
          <AnimatePresence>
            {(state === 'listening' || state === 'speaking') && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2 + volume * 3, opacity: 0.2 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`absolute -inset-12 rounded-full blur-[60px] ${state === 'listening' ? 'bg-primary' : 'bg-tertiary'}`}
              />
            )}
          </AnimatePresence>
          
          <div className={`w-40 h-40 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${
            state === 'idle' ? 'border-white/10 bg-white/5' :
            state === 'listening' ? 'border-primary bg-primary/10 shadow-[0_0_60px_rgba(47,92,255,0.2)] scale-110' :
            state === 'speaking' ? 'border-tertiary bg-tertiary/10 shadow-[0_0_60px_rgba(78,222,163,0.2)] scale-110' :
            'border-white/20 bg-white/5'
          }`}>
            <div className="flex gap-1.5 h-12 items-center">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: state === 'idle' ? 6 : (state === 'listening' || state === 'speaking') ? 10 + Math.random() * (40 + volume * 150) : 10 
                  }}
                  className={`w-1 rounded-full ${state === 'listening' ? 'bg-primary' : state === 'speaking' ? 'bg-tertiary' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-white/90">
            {state === 'idle' ? 'I\'m here to listen' :
             state === 'listening' ? 'Listening to you...' :
             state === 'speaking' ? 'Coach Speaking' : 'System Ready'}
          </p>
          <p className="text-xs text-neutral-500 max-w-[200px] leading-relaxed italic">
            "{state === 'idle' ? 'Space to rant, reflect, and optimize.' : 'Acknowledge your thoughts. I see your weekly data.'}"
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full flex items-center justify-between border-t border-white/5 pt-8 z-10">
        <div className="flex flex-col items-start gap-1">
          <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Workspace Sync</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
            <span className="text-[10px] text-on-surface/60">{currentWeek?.title || 'Active Session'}</span>
          </div>
        </div>

        <button
          onClick={state === 'idle' ? startLive : stopAll}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
            state === 'idle' ? 'bg-[#2F5CFF] hover:bg-[#2549D3] shadow-lg shadow-primary/20' : 'bg-error-container/20 border border-error/50 text-error'
          }`}
        >
          {state === 'idle' ? <Play className="w-6 h-6 text-white fill-current" /> : <Square className="w-6 h-6 fill-current" />}
        </button>

        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-neutral-500" />
        </div>
      </div>
      
      {state === 'error' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center z-50">
          <div className="w-12 h-12 bg-error/20 text-error rounded-full flex items-center justify-center mb-4">
            <X className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white mb-2">Connection Blocked</h4>
          <p className="text-xs text-neutral-500 leading-relaxed mb-6">{error}</p>
          <button onClick={stopAll} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-full transition-colors">Dismiss</button>
        </div>
      )}
    </div>
  );
}
