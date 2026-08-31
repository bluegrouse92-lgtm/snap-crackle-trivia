import React from 'react';
import { HostPersonality, HostMood } from '../types';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  Crown,
  Cpu,
  Zap,
  Play,
  RotateCcw,
  Radio,
} from 'lucide-react';

interface HostStageProps {
  personality: HostPersonality;
  mood: HostMood;
  speechText: string;
  isSpeaking: boolean;
  isLoadingVoice: boolean;
  onReplayVoice: () => void;
  onOpenLiveVoice: () => void;
}

export const HostStage: React.FC<HostStageProps> = ({
  personality,
  mood,
  speechText,
  isSpeaking,
  isLoadingVoice,
  onReplayVoice,
  onOpenLiveVoice,
}) => {
  // Render personality icon
  const renderHostIcon = () => {
    switch (personality.avatarIcon) {
      case 'Crown':
        return <Crown className="w-8 h-8 text-amber-300" />;
      case 'Flame':
        return <Flame className="w-8 h-8 text-rose-300" />;
      case 'Cpu':
        return <Cpu className="w-8 h-8 text-cyan-300" />;
      case 'Zap':
        return <Zap className="w-8 h-8 text-orange-300" />;
      case 'Sparkles':
      default:
        return <Sparkles className="w-8 h-8 text-indigo-300" />;
    }
  };

  // Mood label and color
  const getMoodBadge = () => {
    switch (mood) {
      case 'excited':
        return { label: '🔥 Electrified', bg: 'bg-pink-500/20 text-pink-200 border-pink-500/40' };
      case 'roasting':
        return { label: '🌶️ Scorching Roast', bg: 'bg-rose-500/20 text-rose-200 border-rose-500/40' };
      case 'dramatic':
        return { label: '🎭 Grand Dramatic', bg: 'bg-purple-500/20 text-purple-200 border-purple-500/40' };
      case 'praising':
        return { label: '✨ Royal Praise', bg: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40' };
      case 'facepalm':
        return { label: '🤦 Disbelief', bg: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-500/40' };
      case 'thinking':
        return { label: '🧠 Analyzing', bg: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40' };
      case 'welcoming':
      default:
        return { label: '🎙️ On Air', bg: 'bg-purple-500/20 text-purple-200 border-purple-500/40' };
    }
  };

  const moodBadge = getMoodBadge();

  return (
    <div id="host-stage-container" className="w-full bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow matching host personality */}
      <div
        className={`absolute -top-24 -left-24 w-72 h-72 bg-gradient-to-br ${personality.accentGradient} opacity-20 blur-3xl pointer-events-none rounded-full`}
      />

      <div className="flex flex-col md:flex-row items-start md:items-center gap-5 relative z-10">
        {/* Host Avatar & Spotlight */}
        <div className="flex items-center gap-4 min-w-[210px]">
          <div className="relative">
            {/* Host Avatar Frame */}
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${personality.avatarBg} border-2 border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transition-transform duration-300 ${
                isSpeaking ? 'scale-105 ring-4 ring-purple-400/40 shadow-purple-500/30' : ''
              }`}
            >
              {renderHostIcon()}
            </div>

            {/* Speaking Audio Wave Indicator */}
            {isSpeaking && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-end justify-center gap-0.5 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-purple-400/50 shadow-md">
                <span className="w-1 h-3 bg-purple-400 animate-[bounce_0.6s_infinite_100ms] rounded-full"></span>
                <span className="w-1 h-4 bg-pink-400 animate-[bounce_0.6s_infinite_200ms] rounded-full"></span>
                <span className="w-1 h-2 bg-purple-400 animate-[bounce_0.6s_infinite_300ms] rounded-full"></span>
                <span className="w-1 h-5 bg-pink-400 animate-[bounce_0.6s_infinite_150ms] rounded-full"></span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base sm:text-lg text-white font-sans leading-tight">
                {personality.name}
              </h2>
            </div>
            <p className="text-xs text-purple-300/70 mt-0.5 font-medium">{personality.title}</p>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border backdrop-blur-md font-semibold ${moodBadge.bg}`}>
                {moodBadge.label}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10 font-mono">
                Voice: {personality.voice}
              </span>
            </div>
          </div>
        </div>

        {/* Speech Bubble / Dialogue Box */}
        <div className="flex-1 w-full bg-white/[0.04] border border-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 min-h-[76px] flex flex-col justify-between shadow-inner relative">
          <div className="flex items-start justify-between gap-3">
            <p className="text-white/95 text-sm sm:text-base leading-relaxed font-sans italic">
              "{speechText || personality.catchphrase}"
            </p>

            {/* Audio action controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                id="host-replay-voice-btn"
                onClick={onReplayVoice}
                disabled={isLoadingVoice || !speechText}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-purple-300 border border-white/15 backdrop-blur-md transition-all disabled:opacity-40"
                title="Speak / Replay Host Voice"
              >
                {isLoadingVoice ? (
                  <span className="w-4 h-4 block border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <button
                id="host-live-talk-btn"
                onClick={onOpenLiveVoice}
                className="px-2.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-400/50 backdrop-blur-md transition-all text-xs flex items-center gap-1.5 shadow-sm shadow-purple-500/20"
                title="Talk Live to Host"
              >
                <Radio className="w-3.5 h-3.5 text-purple-300" />
                <span className="hidden lg:inline text-[11px] font-medium">Talk Live</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/10 text-[10px] uppercase tracking-wider text-white/40 font-mono">
            <span>Neural Speech Synthesizer</span>
            <span className="truncate max-w-[200px] text-purple-300/60 lowercase italic font-sans font-normal">
              "{personality.catchphrase}"
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
