import { HostPersonality, TriviaQuestion } from '../types';
import { HOST_ZINGERS, pickZinger, pickMultiplayerDig } from '../data/hostZingers';

export interface BanterContext {
  personality: HostPersonality;
  isCorrect?: boolean;
  isTimeout?: boolean;
  streak: number;
  highestStreak: number;
  wager: number;
  question?: TriviaQuestion;
  selectedText?: string;
  timeSpentSeconds?: number;
  totalQuestions?: number;
  currentIndex?: number;
  accuracyPct?: number;
}

const HOST_STYLE: Record<string, { intro: string[]; correct: string[]; timeout: string[]; lifeline: string[]; finish: string[] }> = {
  roxy: {
    intro: ['Welcome to the hot seat. Try not to embarrass yourself.', 'Right, contender. Let us discover whether that confidence is justified.'],
    correct: ['Well, look who actually knows something.', 'Correct. I am almost impressed.'],
    timeout: ['The clock won. Brutal.', 'Time is up. Your brain apparently needed a loading screen.'],
    lifeline: ['Training wheels deployed. Try not to crash.', 'Need help already? Fine. I will pretend not to judge.'],
    finish: ['And that is the final score. I have witnessed worse. Probably.'],
  },
  sunny: {
    intro: ['Welcome, superstar! Let us light up that scoreboard!', 'Game time! Big energy, big brain, let us go!'],
    correct: ['YES! That is what I am talking about!', 'BOOM! Absolutely nailed it!'],
    timeout: ['The buzzer got us! Shake it off and bounce back!', 'Time is up, superstar. Next one is yours!'],
    lifeline: ['Smart move! Let us get you back on track!', 'Teamwork makes the dream work. Lifeline activated!'],
    finish: ['What a game! The scoreboard has officially caught fire.'],
  },
  sterling: {
    intro: ['Pray attend, scholar. Intellectual combat commences.', 'Compose your faculties. We are about to test them.'],
    correct: ['Indubitably correct. Splendid.', 'Precisely. A respectable display of scholarship.'],
    timeout: ['The allotted interval has expired. A regrettable lapse.', 'Punctuality, dear contender. The clock waits for no scholar.'],
    lifeline: ['A judicious request for assistance. Proceed.', 'Even Socrates valued counsel. Assistance granted.'],
    finish: ['The examination is concluded. Your performance shall be remembered.'],
  },
  unit74: {
    intro: ['UNIT-74 online. Organic intelligence evaluation commencing.', 'Diagnostic complete. Present your cognitive inputs.'],
    correct: ['Verification complete: correct.', 'Logic sequence validated. Output optimal.'],
    timeout: ['Temporal buffer exceeded. Human latency detected.', 'System clock expired. Response window closed.'],
    lifeline: ['Auxiliary cognition engaged.', 'Assistance protocol initialized.'],
    finish: ['Evaluation complete. Processing final human performance metrics.'],
  },
  sage: {
    intro: ['Welcome to the arena. Think carefully and play boldly.', 'The board is ready. Let us see what you know.'],
    correct: ['Correct. Excellent reasoning.', 'Right answer. Nicely done.'],
    timeout: ['Too slow. The clock has spoken.', 'Time is gone. Trust your instincts sooner next time.'],
    lifeline: ['A sensible use of assistance.', 'Good call. Use every tool available.'],
    finish: ['That is the final bell. Nicely played.'],
  },
};

function pick<T>(items: T[], fallback: T): T {
  return items.length ? items[Math.floor(Math.random() * items.length)] : fallback;
}

function styleFor(id: string) {
  return HOST_STYLE[id.toLowerCase()] || HOST_STYLE.roxy;
}

export function generateQuestionSpeech(question: TriviaQuestion, personality: HostPersonality, questionIndex: number, totalQuestions: number): string {
  const style = styleFor(personality.id);
  const lead = pick(style.intro, 'Here comes the next question.');
  return `${lead} Question ${questionIndex + 1} of ${totalQuestions}. ${question.question}`;
}

export function generateSmackTalk(ctx: BanterContext): string {
  const style = styleFor(ctx.personality.id);
  if (ctx.isTimeout) return pick(style.timeout, 'Time is up.');
  if (!ctx.isCorrect) {
    // Use the large offline vault frequently enough to keep every round feeling fresh.
    if (Math.random() < 0.72) return pickZinger();
    if (ctx.wager >= 100) return `That wager just vanished. Bold financial strategy.`;
    if (ctx.streak >= 3) return `There goes the ${ctx.streak}-answer streak. Tragic.`;
    return pick(['Incorrect. Next question.', 'Nope. The facts disagree.', 'Wrong answer. Recover on the next one.'], 'Wrong answer.');
  }
  if (ctx.streak >= 4) return `${pick(style.correct, 'Correct!')} ${ctx.streak} in a row!`;
  return pick(style.correct, 'Correct!');
}

export function generateLifelineSmack(personality: HostPersonality): string {
  return pick(styleFor(personality.id).lifeline, 'Assistance activated.');
}

export function generateGameOverSmack(...args: any[]): string {
  const personality = args.find((value) => value && typeof value === 'object' && typeof value.id === 'string') as HostPersonality | undefined;
  return pick(styleFor(personality?.id || 'roxy').finish, 'Game over.');
}

/** Offline multiplayer sting. Call this once from the host client/server after a round result. */
export function generateMultiplayerDig(winnerName: string, loserName: string): string {
  return pickMultiplayerDig(winnerName || 'the leader', loserName || 'the contender');
}

/** Exposed for diagnostics/tests so the vault can be verified without a network call. */
export const OFFLINE_ZINGER_COUNT = HOST_ZINGERS.length;
