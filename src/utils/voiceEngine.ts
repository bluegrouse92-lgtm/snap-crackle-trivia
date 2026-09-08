/**
 * Reliable browser voice engine for Snap Crackle Trivia.
 *
 * The old implementation assumed Gemini voice names (Puck, Zephyr, etc.)
 * existed in the browser's SpeechSynthesisVoice list. They do not. Browser
 * voice names are OS/browser dependent and are loaded asynchronously.
 *
 * This engine:
 * - waits for voices to load
 * - selects a real installed voice with sensible fallbacks
 * - primes speech from a user gesture
 * - resumes suspended synthesis before speaking
 * - chunks long host lines so mobile browsers don't silently stall
 * - exposes a small capability/status API for the UI
 */

export type VoiceHostId = 'sunny' | 'roxy' | 'sterling' | 'unit74' | 'sage' | string;

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesReadyPromise: Promise<SpeechSynthesisVoice[]> | null = null;
let speechRunId = 0;

const HOST_PREFERENCES: Record<string, { preferred: string[]; female?: boolean; pitch: number; rate: number }> = {
  sunny: {
    preferred: ['Sonia', 'Google UK English Female', 'Microsoft Sonia', 'Samantha', 'Karen'],
    female: true,
    pitch: 1.18,
    rate: 1.04,
  },
  roxy: {
    preferred: ['Hazel', 'Google UK English Female', 'Microsoft Hazel', 'Samantha', 'Karen'],
    female: true,
    pitch: 1.03,
    rate: 1.08,
  },
  sterling: {
    preferred: ['Ryan', 'Google UK English Male', 'Microsoft Ryan', 'Daniel', 'Alex'],
    pitch: 0.91,
    rate: 0.94,
  },
  unit74: {
    preferred: ['George', 'Google UK English Male', 'Microsoft George', 'Alex', 'Daniel'],
    pitch: 0.76,
    rate: 0.99,
  },
  sage: {
    preferred: ['Sonia', 'Google UK English Female', 'Microsoft Sonia', 'Karen', 'Samantha'],
    female: true,
    pitch: 0.92,
    rate: 0.9,
  },
};

function refreshVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
  return cachedVoices;
}

function setupVoiceEvents() {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
}

function getVoicesWhenReady(): Promise<SpeechSynthesisVoice[]> {
  if (!('speechSynthesis' in window)) return Promise.resolve([]);

  const immediate = refreshVoices();
  if (immediate.length) return Promise.resolve(immediate);
  if (voicesReadyPromise) return voicesReadyPromise;

  setupVoiceEvents();
  voicesReadyPromise = new Promise((resolve) => {
    const started = Date.now();
    const poll = () => {
      const voices = refreshVoices();
      if (voices.length || Date.now() - started > 1800) {
        resolve(voices);
        voicesReadyPromise = null;
        return;
      }
      window.setTimeout(poll, 80);
    };
    poll();
  });

  return voicesReadyPromise;
}

export function isVoiceSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function getInstalledVoiceNames(): string[] {
  return refreshVoices().map((voice) => voice.name);
}

export function primeVoiceEngine(): void {
  if (!isVoiceSupported()) return;
  try {
    // Calling resume during the initiating tap/click helps Android browsers
    // unlock the speech engine before an async question fetch completes.
    window.speechSynthesis.resume();
    refreshVoices();
    void getVoicesWhenReady();
  } catch (error) {
    console.debug('Voice engine prime skipped:', error);
  }
}

function scoreVoice(voice: SpeechSynthesisVoice, hostId: VoiceHostId, requestedName?: string): number {
  const prefs = HOST_PREFERENCES[hostId] ?? HOST_PREFERENCES.sterling;
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  let score = 0;

  if (requestedName && name.includes(requestedName.toLowerCase())) score += 100;
  prefs.preferred.forEach((candidate, index) => {
    if (name.includes(candidate.toLowerCase())) score += 80 - index * 5;
  });
  if (lang.startsWith('en-gb')) score += 25;
  else if (lang.startsWith('en-us')) score += 20;
  else if (lang.startsWith('en')) score += 12;
  if (prefs.female && /female|woman|girl/i.test(name)) score += 8;
  if (prefs.female === false && /male|man/i.test(name)) score += 8;
  if (voice.default) score += 3;
  return score;
}

export async function getBestVoice(hostId: VoiceHostId, requestedName?: string): Promise<SpeechSynthesisVoice | null> {
  const voices = await getVoicesWhenReady();
  if (!voices.length) return null;
  return voices
    .filter((voice) => voice.lang.toLowerCase().startsWith('en'))
    .sort((a, b) => scoreVoice(b, hostId, requestedName) - scoreVoice(a, hostId, requestedName))[0]
    ?? voices[0];
}

function splitForSpeech(text: string, maxLength = 190): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxLength) return [cleaned];

  const chunks: string[] = [];
  let remaining = cleaned;
  while (remaining.length > maxLength) {
    let cut = Math.max(
      remaining.lastIndexOf('. ', maxLength),
      remaining.lastIndexOf('! ', maxLength),
      remaining.lastIndexOf('? ', maxLength),
      remaining.lastIndexOf(', ', maxLength),
    );
    if (cut < Math.floor(maxLength * 0.55)) cut = remaining.lastIndexOf(' ', maxLength);
    if (cut <= 0) cut = maxLength;
    chunks.push(remaining.slice(0, cut + (remaining[cut] === ' ' ? 0 : 1)).trim());
    remaining = remaining.slice(cut + 1).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

export async function speakHostText(
  text: string,
  hostId: VoiceHostId,
  requestedVoiceName?: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: SpeechSynthesisErrorEvent | Error) => void,
): Promise<void> {
  if (!text || !isVoiceSupported()) {
    onEnd?.();
    return;
  }

  const runId = ++speechRunId;
  const synth = window.speechSynthesis;
  const prefs = HOST_PREFERENCES[hostId] ?? HOST_PREFERENCES.sterling;

  try {
    synth.cancel();
    synth.resume();
    const voice = await getBestVoice(hostId, requestedVoiceName);
    if (runId !== speechRunId) return;

    const chunks = splitForSpeech(text);
    if (!chunks.length) {
      onEnd?.();
      return;
    }

    onStart?.();

    for (const chunk of chunks) {
      if (runId !== speechRunId) return;
      await new Promise<void>((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang || 'en-GB';
        utterance.pitch = prefs.pitch;
        utterance.rate = prefs.rate;
        utterance.volume = 1;
        utterance.onend = () => resolve();
        utterance.onerror = (event) => {
          // Android Chrome can report "interrupted" when another lifecycle
          // event touches synthesis. Cancellation is not a fatal app error.
          if (event.error === 'interrupted' || event.error === 'canceled') {
            resolve();
          } else {
            reject(event);
          }
        };
        synth.resume();
        synth.speak(utterance);
      });
    }

    if (runId === speechRunId) onEnd?.();
  } catch (error) {
    if (runId === speechRunId) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
      onEnd?.();
    }
  }
}

export function stopHostSpeech(): void {
  speechRunId += 1;
  if (!isVoiceSupported()) return;
  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
  } catch {
    // Ignore browser-specific cancellation errors.
  }
}

export function installVoiceEngine(): () => void {
  if (!isVoiceSupported()) return () => {};
  const onUserGesture = () => primeVoiceEngine();
  const events: Array<keyof WindowEventMap> = ['pointerdown', 'touchstart', 'keydown'];
  events.forEach((event) => window.addEventListener(event, onUserGesture, { passive: true, once: true }));
  setupVoiceEvents();
  refreshVoices();

  return () => {
    events.forEach((event) => window.removeEventListener(event, onUserGesture));
  };
}
