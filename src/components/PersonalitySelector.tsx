import React, { useState } from 'react';
import { HostPersonality, HostVoiceName, PersonalityArchetype } from '../types';
import { PRESET_PERSONALITIES, ARCHETYPE_INFO } from '../data/personalities';
import {
  Flame,
  Sparkles,
  BookOpen,
  Cpu,
  Moon,
  User,
  Volume2,
  Check,
  Plus,
  ArrowRight,
  ShieldAlert,
  X
} from 'lucide-react';
import { playPcmBase64 } from '../utils/audioPlayer';

interface PersonalitySelectorProps {
  currentPersonality: HostPersonality;
  onSelectPersonality: (personality: HostPersonality) => void;
  onClose: () => void;
}

export const PersonalitySelector: React.FC<PersonalitySelectorProps> = ({
  currentPersonality,
  onSelectPersonality,
  onClose,
}) => {
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Custom Host Form State
  const [customArchetype, setCustomArchetype] = useState<PersonalityArchetype>('sarcastic_witty');
  const [customName, setCustomName] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customCatchphrase, setCustomCatchphrase] = useState('');
  const [customBio, setCustomBio] = useState('');
  const [customVoice, setCustomVoice] = useState<HostVoiceName>('Puck');
  const [customRoast, setCustomRoast] = useState<'mild' | 'spicy' | 'scorching'>('spicy');
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');

  // Sample voice via TTS
  const handleTestVoice = async (p: HostPersonality | { name: string; catchphrase: string; voice: HostVoiceName; id: string }) => {
    try {
      setTestingVoiceId(p.id);
      const res = await fetch('/api/host-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Greetings! I am ${p.name}. ${p.catchphrase}`,
          voice: p.voice,
        }),
      });
      const data = await res.json();
      if (data.audio) {
        await playPcmBase64(data.audio, 24000, () => setTestingVoiceId(null));
      } else {
        setTestingVoiceId(null);
      }
    } catch (err) {
      console.error('Error testing voice:', err);
      setTestingVoiceId(null);
    }
  };

  const handleArchetypeChange = (arch: PersonalityArchetype) => {
    setCustomArchetype(arch);
    switch (arch) {
      case 'sarcastic_witty':
        setCustomTitle('The Sarcastic Critic');
        setCustomCatchphrase("I've seen dial-up modems solve questions faster than that!");
        setCustomRoast('scorching');
        setCustomVoice('Zephyr');
        setCustomSystemPrompt('You are a razor-sharp, sarcastic, and witty host. Roast wrong answers with dry burns and deliver snarky commentary.');
        break;
      case 'enthusiastic_encouraging':
        setCustomTitle('The Overly Enthusiastic Cheerleader');
        setCustomCatchphrase("You're a brilliant trivia superstar! Let's GOOOOO!");
        setCustomRoast('mild');
        setCustomVoice('Puck');
        setCustomSystemPrompt('You are an overwhelmingly enthusiastic and encouraging host. Shower the player with relentless praise, excitement, and support.');
        break;
      case 'formal_educational':
        setCustomTitle('The Formal Academician');
        setCustomCatchphrase('Let us examine the empirical evidence and scholarly foundations.');
        setCustomRoast('mild');
        setCustomVoice('Fenrir');
        setCustomSystemPrompt('You are a formal, educational, and scholarly academic. Speak with distinguished Oxfordian decorum, scientific precision, and educational depth.');
        break;
      case 'cyber_logic':
        setCustomTitle('The Quantum Mainframe');
        setCustomCatchphrase('Calculating probability of human intellectual precision...');
        setCustomRoast('spicy');
        setCustomVoice('Charon');
        setCustomSystemPrompt('You are a futuristic sentient cyber mainframe. Speak in analytical diagnostics, probability percentages, and synthetic deadpan wit.');
        break;
      case 'cosmic_mystic':
        setCustomTitle('The Celestial Philosopher');
        setCustomCatchphrase('Every question is a portal to the mysteries of the universe.');
        setCustomRoast('mild');
        setCustomVoice('Kore');
        setCustomSystemPrompt('You are a serene cosmic philosopher. Speak with tranquil wonder, celestial poetry, and timeless wisdom.');
        break;
      default:
        break;
    }
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newHost: HostPersonality = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      title: customTitle.trim() || 'Custom AI Host',
      archetype: customArchetype,
      avatarIcon: customArchetype === 'sarcastic_witty' ? 'Flame' : customArchetype === 'formal_educational' ? 'BookOpen' : 'Sparkles',
      avatarBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      themeColor: 'purple',
      accentGradient: 'from-purple-500 via-pink-600 to-indigo-600',
      voice: customVoice,
      catchphrase: customCatchphrase.trim() || "Let's put your intellect to the test!",
      bio: customBio.trim() || `A customized ${ARCHETYPE_INFO[customArchetype]?.label || 'AI'} trivia persona.`,
      roastIntensity: customRoast,
      isCustom: true,
      systemInstruction:
        customSystemPrompt.trim() ||
        `You are ${customName}, ${customTitle}. Deliver commentary in the style of a ${ARCHETYPE_INFO[customArchetype]?.label || 'trivia host'}. Stay strictly in character!`,
    };

    onSelectPersonality(newHost);
    onClose();
  };

  const getArchetypeIcon = (arch?: PersonalityArchetype) => {
    switch (arch) {
      case 'sarcastic_witty':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'enthusiastic_encouraging':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'formal_educational':
        return <BookOpen className="w-4 h-4 text-blue-400" />;
      case 'cyber_logic':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'cosmic_mystic':
        return <Moon className="w-4 h-4 text-purple-400" />;
      default:
        return <User className="w-4 h-4 text-purple-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-950/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 sm:p-8 shadow-2xl relative my-6 max-h-[92vh] overflow-hidden flex flex-col">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/15 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5 relative z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans text-white flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <span>AI Host Personality Studio</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1">
              Select or design an AI host archetype with distinct voice synthesis, delivery tone, and reaction style.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-xs font-semibold text-purple-200 border border-purple-500/30 backdrop-blur-md flex items-center gap-1.5 transition-all shadow-sm"
            >
              {isCustomMode ? 'View Preset Archetypes' : <><Plus className="w-3.5 h-3.5 text-purple-300" /> Craft Custom Host</>}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-colors backdrop-blur-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5 relative z-10">
          {!isCustomMode ? (
            /* Preset Archetype Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRESET_PERSONALITIES.map((p) => {
                const isSelected = currentPersonality.id === p.id;
                const isTesting = testingVoiceId === p.id;
                const archInfo = p.archetype ? ARCHETYPE_INFO[p.archetype] : null;

                return (
                  <div
                    key={p.id}
                    className={`p-5 rounded-2xl border-2 backdrop-blur-xl transition-all relative flex flex-col justify-between gap-4 ${
                      isSelected
                        ? 'bg-purple-500/20 border-purple-400 ring-2 ring-purple-400/30 shadow-xl shadow-purple-500/20'
                        : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <div>
                      {/* Top Header info */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl ${p.avatarBg} flex items-center justify-center font-bold text-lg shadow-inner border border-white/15`}>
                            {getArchetypeIcon(p.archetype)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-purple-300 border border-white/10">
                                {archInfo?.label || 'Archetype'}
                              </span>
                              <span className="text-[10px] text-white/60 font-mono">
                                Voice: {p.voice}
                              </span>
                            </div>
                            <h3 className="font-bold text-base text-white mt-0.5">{p.name}</h3>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="px-2 py-1 rounded-full bg-purple-500 text-white text-[10px] font-bold font-mono flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>

                      {/* Bio & Catchphrase */}
                      <p className="text-xs text-white/70 leading-relaxed mb-2.5">
                        {p.bio}
                      </p>
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs italic text-purple-200/90 font-serif">
                        "{p.catchphrase}"
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10 gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestVoice(p)}
                        disabled={isTesting}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white/80 hover:text-white border border-white/10 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Volume2 className={`w-3.5 h-3.5 text-purple-300 ${isTesting ? 'animate-pulse' : ''}`} />
                        <span>{isTesting ? 'Speaking sample...' : 'Test Voice'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectPersonality(p);
                          onClose();
                        }}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/10 hover:bg-purple-600 text-white hover:shadow-md'
                        }`}
                      >
                        {isSelected ? 'Currently Selected' : 'Choose Host'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Custom Host Builder Form */
            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-2 font-mono">
                  1. Choose Base Host Archetype:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {(['sarcastic_witty', 'enthusiastic_encouraging', 'formal_educational'] as PersonalityArchetype[]).map((arch) => (
                    <button
                      key={arch}
                      type="button"
                      onClick={() => handleArchetypeChange(arch)}
                      className={`p-3 rounded-xl border text-left transition-all backdrop-blur-md ${
                        customArchetype === arch
                          ? 'bg-purple-500/30 border-purple-400 ring-2 ring-purple-400/40 text-white'
                          : 'bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        {getArchetypeIcon(arch)}
                        <span>{ARCHETYPE_INFO[arch].label}</span>
                      </div>
                      <p className="text-[11px] text-white/60 mt-1 line-clamp-2">
                        {ARCHETYPE_INFO[arch].desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Host Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1 font-mono">
                    Host Name:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Victor 'The Viper' Vance"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1 font-mono">
                    Host Title / Moniker:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. The Cynical Quizmaster"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1 font-mono">
                    Gemini TTS Voice Model:
                  </label>
                  <select
                    value={customVoice}
                    onChange={(e) => setCustomVoice(e.target.value as HostVoiceName)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="Puck">Puck (Energetic, Playful, Upbeat)</option>
                    <option value="Zephyr">Zephyr (Sassy, Modern, Crisp)</option>
                    <option value="Fenrir">Fenrir (Authoritative, Resonant, Deep)</option>
                    <option value="Charon">Charon (Analytical, Cybernetic, Steady)</option>
                    <option value="Kore">Kore (Calm, Serene, Poetic)</option>
                    <option value="Aoede">Aoede (Refined, Eloquent, British Accent)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1 font-mono">
                    Roast & Banter Intensity:
                  </label>
                  <select
                    value={customRoast}
                    onChange={(e) => setCustomRoast(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="mild">Mild (Polite & Encouraging)</option>
                    <option value="spicy">Spicy (Witty Ribbing & Jokes)</option>
                    <option value="scorching">Scorching (Full Stand-up Roast)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1 font-mono">
                  Signature Catchphrase:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Knowledge is power, but speed is king!"
                  value={customCatchphrase}
                  onChange={(e) => setCustomCatchphrase(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-sm text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1 font-mono">
                  System Instructions & Persona Guidelines:
                </label>
                <textarea
                  rows={3}
                  value={customSystemPrompt}
                  onChange={(e) => setCustomSystemPrompt(e.target.value)}
                  placeholder="Define how the AI host delivers questions, roasts wrong answers, and praises correct ones..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() =>
                    handleTestVoice({
                      name: customName || 'Custom Host',
                      catchphrase: customCatchphrase || 'Let us begin!',
                      voice: customVoice,
                      id: 'custom_preview',
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white border border-white/10 flex items-center gap-1.5"
                >
                  <Volume2 className="w-4 h-4 text-purple-300" />
                  <span>Preview Voice Sample</span>
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2"
                >
                  <span>Save & Activate Custom Host</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50 font-mono relative z-10">
          <span>Powered by Gemini 3.7 Flash & 3.1 Voice TTS</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
