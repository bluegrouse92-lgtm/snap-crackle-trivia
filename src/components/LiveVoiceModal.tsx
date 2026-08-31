import React, { useEffect, useRef, useState } from 'react';
import { HostPersonality, TriviaQuestion } from '../types';
import {
  Mic,
  MicOff,
  Radio,
  Sparkles,
  Volume2,
  X,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Flame,
} from 'lucide-react';
import { pcmToBase64, playPcmBase64 } from '../utils/audioPlayer';

interface LiveVoiceModalProps {
  personality: HostPersonality;
  currentQuestion?: TriviaQuestion;
  isOpen: boolean;
  onClose: () => void;
}

interface DialogueEntry {
  sender: 'user' | 'host';
  text: string;
  timestamp: string;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  personality,
  currentQuestion,
  isOpen,
  onClose,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [hostIsSpeaking, setHostIsSpeaking] = useState(false);
  const [dialogue, setDialogue] = useState<DialogueEntry[]>([]);
  const [statusMessage, setStatusMessage] = useState('Initializing Live API session...');

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Quick speech prompts to talk to the host
  const quickPrompts = [
    'Give me a clever hint for this question!',
    'Are you sure the options are fair?',
    'Roast my trivia skills so far!',
    'Tell me an insane trivia fact about this topic.',
  ];

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatusMessage('Connecting to Gemini Live Voice API...');
        // Initialize Live Session with host personality and question context
        ws.send(
          JSON.stringify({
            type: 'init',
            personality,
            currentQuestion,
          })
        );
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'ready') {
            setIsConnected(true);
            setStatusMessage(`Live Voice connected with ${personality.name}!`);
            startMicrophoneCapture();
          }

          if (data.type === 'audio' && data.audio) {
            setHostIsSpeaking(true);
            await playPcmBase64(data.audio, 24000, () => {
              setHostIsSpeaking(false);
            });
          }

          if (data.type === 'interrupted') {
            setHostIsSpeaking(false);
          }

          if (data.type === 'text' && data.text) {
            setDialogue((prev) => [
              ...prev,
              {
                sender: 'host',
                text: data.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              },
            ]);
          }

          if (data.type === 'error') {
            setStatusMessage(`Live error: ${data.error}`);
          }
        } catch (e) {
          console.error('Error processing live ws message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsMicActive(false);
        setStatusMessage('Live Session closed.');
      };

      ws.onerror = (err) => {
        console.error('WebSocket Live Error:', err);
        setStatusMessage('Connection failed. Please check Gemini API status.');
      };
    } catch (err: any) {
      setStatusMessage(`Failed to initiate WebSocket: ${err.message}`);
    }
  };

  const startMicrophoneCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const base64Audio = pcmToBase64(inputData);
        wsRef.current.send(
          JSON.stringify({
            type: 'audio',
            audio: base64Audio,
          })
        );
      };

      setIsMicActive(true);
      setStatusMessage(`Microphone streaming. Speak directly to ${personality.name}!`);
    } catch (err: any) {
      console.error('Mic capture error:', err);
      setStatusMessage(`Microphone permission error: ${err.message}. You can still use quick text prompts below.`);
    }
  };

  const stopMicrophoneCapture = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsMicActive(false);
  };

  const handleSendPromptText = (promptText: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'text_input',
          text: promptText,
        })
      );

      setDialogue((prev) => [
        ...prev,
        {
          sender: 'user',
          text: promptText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      connectWebSocket();
    } else {
      stopMicrophoneCapture();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      setDialogue([]);
    }

    return () => {
      stopMicrophoneCapture();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-950/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative flex flex-col gap-5 max-h-[90vh] overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/15 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse backdrop-blur-md">
              <Radio className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white font-sans">
                  Live Voice Host Room
                </h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini Live API
                </span>
              </div>
              <p className="text-xs text-white/60">
                Real-time, two-way conversational audio with {personality.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white transition-colors border border-white/10 backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Audio Visualizer & Host Status */}
        <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-center relative overflow-hidden z-10 shadow-inner">
          {/* Animated Glow Rings */}
          <div
            className={`w-28 h-28 rounded-full ${personality.avatarBg} border-2 border-white/20 flex items-center justify-center shadow-xl transition-all duration-300 relative ${
              hostIsSpeaking
                ? 'scale-110 ring-8 ring-purple-400/40 shadow-purple-500/30'
                : isMicActive
                ? 'ring-4 ring-purple-500/30'
                : 'opacity-80'
            }`}
          >
            <Sparkles className="w-12 h-12 text-white animate-spin-slow" />

            {/* Pulsing Voice Wave */}
            {(hostIsSpeaking || isMicActive) && (
              <div className="absolute inset-0 rounded-full border-2 border-purple-400/60 animate-ping" />
            )}
          </div>

          <div>
            <h4 className="font-bold text-base text-white">{personality.name}</h4>
            <p className="text-xs text-purple-200/70 font-mono mt-0.5">{statusMessage}</p>
          </div>

          {/* Mic Toggle Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isMicActive) {
                  stopMicrophoneCapture();
                } else {
                  startMicrophoneCapture();
                }
              }}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-md backdrop-blur-md ${
                isMicActive
                  ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-rose-500/30'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
              }`}
            >
              {isMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              <span>{isMicActive ? 'Mic Live (Listening...)' : 'Enable Microphone'}</span>
            </button>
          </div>
        </div>

        {/* Quick Voice Prompt Chips */}
        <div className="relative z-10">
          <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest block mb-2 font-mono">
            Quick Spoken Prompts:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendPromptText(prompt)}
                className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-purple-400/40 text-xs text-white/80 hover:text-white transition-all text-left backdrop-blur-md"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>

        {/* Live Conversation Transcript */}
        {dialogue.length > 0 && (
          <div className="flex-1 max-h-40 overflow-y-auto space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/10 relative z-10 backdrop-blur-md">
            {dialogue.map((entry, idx) => (
              <div
                key={idx}
                className={`text-xs p-2.5 rounded-xl ${
                  entry.sender === 'host'
                    ? 'bg-purple-500/15 text-purple-200 border border-purple-500/25'
                    : 'bg-white/10 text-white border border-white/15 text-right'
                }`}
              >
                <span className="font-bold text-[10px] opacity-70 block mb-0.5">
                  {entry.sender === 'host' ? personality.name : 'You'} • {entry.timestamp}
                </span>
                <p>{entry.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-white/50 font-mono relative z-10">
          <span>Powered by Gemini Live API</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 font-medium backdrop-blur-md transition-colors"
          >
            Back to Game Board
          </button>
        </div>
      </div>
    </div>
  );
};
