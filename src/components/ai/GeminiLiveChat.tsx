import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, X, Square, Play, Sparkles } from 'lucide-react';
import { useWeekStore } from '../../store/useWeekStore';

interface GeminiLiveChatProps {
  onClose?: () => void;
}

type LiveState = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'error';

export function GeminiLiveChat({ onClose }: GeminiLiveChatProps) {
  const [state, setState] = useState<LiveState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);

  // Refs for Web Audio & WebSocket
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const audioOutPoolRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  
  // VAD Refs
  const lastActiveTimeRef = useRef(Date.now());
  const silenceThreshold = 0.01; // Sensitivity
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

      // 1. Audio Setup (16kHz Mono PCM)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // 2. WebSocket Connection to Gemini Multimodal Live
      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("VITE_GEMINI_API_KEY missing");
      
      // Try v1alpha for better compatibility with experimental keys
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BiDiGenerateContent?key=${apiKey}`;
      console.log("Connecting to Gemini Live:", url.replace(apiKey, "REDACTED"));
      
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onerror = (ev) => {
        console.error("WebSocket Error:", ev);
        setError("Connection failed. Check API Key permissions.");
        setState('error');
      };

      socket.onopen = () => {
        setState('listening');
        // Initial Config
        const setupMsg = {
          setup: {
            model: "models/gemini-2.0-flash-exp", // Multimodal Live model
            generation_config: {
                response_modalities: ["audio"]
            },
            system_instruction: {
                parts: [{ 
                    text: `You are the WeeklyOS Productivity Coach. 
                    Be brief, natural, and helpful. 
                    Current Context: ${JSON.stringify(currentWeek || {})}
                    Language: Arabic mostly, English for terms.`
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
                  // Received base64 audio
                  const raw = atob(part.inlineData.data);
                  const buffer = new Float32Array(raw.length / 2);
                  const view = new DataView(new ArrayBuffer(raw.length));
                  for(let i=0; i<raw.length; i++) view.setUint8(i, raw.charCodeAt(i));
                  
                  // Convert Int16 to Float32
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
        
        // Volume calc for UI
        let sum = 0;
        for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
        const rms = Math.sqrt(sum / input.length);
        setVolume(rms);

        // VAD Logic
        if (rms > silenceThreshold) {
          lastActiveTimeRef.current = Date.now();
        } else if (Date.now() - lastActiveTimeRef.current > silenceDuration) {
          // Silence detected for 1.5s
          // Currently Gemini Live is duplex, but we can send a "turn end" if needed
        }

        // Send to Socket (convert to Int16 Base64)
        if (socket.readyState === WebSocket.OPEN) {
          const int16 = new Int16Array(input.length);
          for(let i=0; i<input.length; i++) int16[i] = input[i] * 32767;
          
          const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
          socket.send(JSON.stringify({
            realtime_input: {
                media_chunks: [{
                    mime_type: "audio/pcm",
                    data: base64
                }]
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
    <div className="flex flex-col items-center justify-center h-full w-full p-6 space-y-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group">
      {/* Decorative Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-tertiary/5 pointer-events-none opacity-50" />
      
      {/* Visualizer Circle */}
      <div className="relative">
        <AnimatePresence>
          {(state === 'listening' || state === 'speaking') && (
            <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1 + volume * 2, opacity: 0.3 }}
               exit={{ scale: 0.8, opacity: 0 }}
               className={`absolute -inset-8 rounded-full blur-3xl ${state === 'listening' ? 'bg-primary' : 'bg-tertiary'}`}
            />
          )}
        </AnimatePresence>
        
        <div className={`w-48 h-48 rounded-full flex items-center justify-center relative z-10 border-4 transition-all duration-500 overflow-hidden ${
          state === 'idle' ? 'border-white/5 bg-white/5 shadow-inner' :
          state === 'listening' ? 'border-primary bg-primary/20 shadow-[0_0_50px_rgba(47,92,255,0.4)]' :
          state === 'speaking' ? 'border-tertiary bg-tertiary/20 shadow-[0_0_50px_rgba(78,222,163,0.4)]' :
          'border-white/10 bg-white/5'
        }`}>
           {/* Voice Flow Lines */}
          <div className="flex items-end gap-1.5 h-16 px-4">
             {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: state === 'idle' ? 4 : (state === 'listening' || state === 'speaking') ? 10 + Math.random() * (40 + volume * 100) : 10 
                  }}
                  transition={{ repeat: Infinity, repeatType: "mirror", duration: 0.2 + Math.random() * 0.2 }}
                  className={`w-1.5 rounded-full ${state === 'listening' ? 'bg-primary shadow-[0_0_10px_#2f5cff]' : state === 'speaking' ? 'bg-tertiary shadow-[0_0_10px_#4edea3]' : 'bg-white/20'}`}
                />
             ))}
          </div>
        </div>
      </div>

      {/* Info & Status */}
      <div className="text-center space-y-3 z-10 max-w-sm">
        <h3 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 tracking-tight">
          {state === 'idle' ? 'Live Wish Chat' :
           state === 'listening' ? 'I\'m Listening...' :
           state === 'connecting' ? 'Establishing Link...' :
           state === 'speaking' ? 'Coach Speaking' : 'System standby'}
        </h3>
        
        <p className="text-xs text-neutral-400 font-medium uppercase tracking-[0.2em] opacity-80 leading-relaxed">
          {state === 'idle' ? 'Ready to optimize your performance? Start the session.' :
           state === 'listening' ? 'Speak naturally. I see your weekly progress.' :
           state === 'speaking' ? 'Sharing productivity insights based on your score.' :
           state === 'error' ? `Error: ${error}` : 'Connected to Gemini Neural Network'}
        </p>
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-6 z-10">
        <button
          onClick={onClose}
          className="p-4 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 hover:scale-110 transition-all active:scale-95"
          title="Close Session"
        >
          <X className="w-6 h-6" />
        </button>
        
        <button
          onClick={state === 'idle' ? startLive : stopAll}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform active:scale-90 ${
            state === 'idle' ? 'bg-[#2F5CFF] hover:bg-[#2549D3] hover:shadow-[#2F5CFF]/30' : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
          }`}
        >
          {state === 'idle' ? (
            <Play className="w-8 h-8 text-white fill-current translate-x-0.5" />
          ) : (
            <Square className="w-8 h-8 text-white fill-current" />
          )}
        </button>

        <div className="p-4 rounded-full bg-white/5 border border-white/10 text-neutral-400">
           <Volume2 className={`w-6 h-6 ${state === 'speaking' ? 'text-tertiary animate-pulse' : ''}`} />
        </div>
      </div>

      {/* Score Context Chip */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/5 border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 backdrop-blur-md"
      >
        <Sparkles className="w-3.5 h-3.5 text-tertiary" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface/60">
          Syncing Context: <span className="text-white">{currentWeek?.title || 'No Week'}</span> • <span className="text-tertiary">{currentWeek?.score || 0}% Score</span>
        </span>
      </motion.div>
    </div>
  );
}
