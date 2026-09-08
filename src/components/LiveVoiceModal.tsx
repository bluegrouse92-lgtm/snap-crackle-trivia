import React, { useEffect, useState } from 'react';
import { HostPersonality, TriviaQuestion } from '../types';
import { Volume2, VolumeX, Radio, Sparkles, X, Play } from 'lucide-react';
import { generateQuestionSpeech, generateSmackTalk } from '../utils/hostBrain';

interface Props { personality: HostPersonality; currentQuestion?: TriviaQuestion; isOpen: boolean; onClose: () => void; }

const PROFILES: Record<string,{pitch:number;rate:number}> = {
  sunny:{pitch:1.28,rate:1.08}, roxy:{pitch:1.05,rate:1.12}, sterling:{pitch:.88,rate:.94}, unit74:{pitch:.72,rate:1.02}, sage:{pitch:.96,rate:.98}
};

export const LiveVoiceModal: React.FC<Props> = ({personality,currentQuestion,isOpen,onClose}) => {
  const [speaking,setSpeaking]=useState(false);
  const [muted,setMuted]=useState(false);
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const profile=PROFILES[personality.id.toLowerCase()]||PROFILES.roxy;

  useEffect(()=>{
    if(!isOpen || !('speechSynthesis' in window)) return;
    const load=()=>setVoices(window.speechSynthesis.getVoices());
    load(); window.speechSynthesis.addEventListener('voiceschanged',load);
    return()=>window.speechSynthesis.removeEventListener('voiceschanged',load);
  },[isOpen]);

  useEffect(()=>()=>{ if('speechSynthesis' in window) window.speechSynthesis.cancel(); },[]);

  const speak=(text:string)=>{
    if(muted || !text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text); u.pitch=profile.pitch; u.rate=profile.rate; u.volume=1;
    const preferred=voices.find(v=>v.lang.toLowerCase().startsWith('en-gb'))||voices.find(v=>v.lang.toLowerCase().startsWith('en'))||voices.find(v=>v.default);
    if(preferred) u.voice=preferred;
    u.onstart=()=>setSpeaking(true); u.onend=()=>setSpeaking(false); u.onerror=()=>setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  if(!isOpen) return null;
  const questionText=currentQuestion ? generateQuestionSpeech(currentQuestion,personality,0,1) : `Welcome to Snap Crackle Trivia, hosted by ${personality.name}.`;
  const roast=currentQuestion ? generateSmackTalk({personality,isCorrect:false,streak:0,highestStreak:0,wager:0,question:currentQuestion}) : 'Get ready. I have jokes and you have answers to prove.';

  return <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-center justify-center p-4">
    <div className="w-full max-w-xl bg-slate-950 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="p-3 rounded-2xl bg-purple-500/20"><Radio className="w-6 h-6 text-purple-300"/></div><div><h3 className="font-black text-white text-lg">Offline Voice Studio</h3><p className="text-xs text-white/50">{personality.name} • No API • Device speech engine</p></div></div>
        <button onClick={onClose} className="p-2 rounded-xl bg-white/10 text-white/70"><X className="w-5 h-5"/></button>
      </div>
      <div className={`p-7 rounded-3xl border text-center ${speaking?'border-purple-400 bg-purple-500/10':'border-white/10 bg-white/[.03]'}`}>
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500/40 to-pink-500/30 flex items-center justify-center border border-white/20">
          <Sparkles className={`w-10 h-10 text-white ${speaking?'animate-pulse':''}`}/>
        </div>
        <h4 className="mt-4 font-bold text-white">{personality.name}</h4>
        <p className="text-xs text-purple-200/70 mt-1">{voices.length ? `${voices.length} device voices available` : 'Loading device voices…'}</p>
      </div>
      <div className="grid gap-2">
        <button onClick={()=>speak(questionText)} className="w-full p-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-2"><Play className="w-4 h-4"/>Test host question voice</button>
        <button onClick={()=>speak(roast)} className="w-full p-3 rounded-xl bg-pink-600/80 hover:bg-pink-600 text-white font-bold">🔥 Fire a zinger</button>
        <button onClick={()=>setMuted(v=>!v)} className="w-full p-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold flex items-center justify-center gap-2">{muted?<VolumeX className="w-4 h-4"/>:<Volume2 className="w-4 h-4"/>}{muted?'Voice muted':'Voice enabled'}</button>
      </div>
      <p className="text-[11px] text-white/40 text-center">The browser/device supplies the actual TTS voice. Snap Crackle controls the character, pitch, pace and timing locally. The Web Speech API exposes device voices through getVoices() and can update them via voiceschanged. </p>
    </div>
  </div>;
};
