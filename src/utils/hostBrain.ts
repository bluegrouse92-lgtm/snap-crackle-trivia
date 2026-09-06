/**
 * Host AI Brain for Snap Crackle Pop Trivia 💥⚡🍿
 * 
 * Generates dynamic, contextual speech, smack talk, roasts, and praise
 * locally without requiring any external APIs or network calls.
 * 
 * Tailored to each host personality archetype:
 * - Sunny Spark (Enthusiastic cheerleader)
 * - Roxy Roast (Sarcastic standup comic)
 * - Sterling Sage (Aristocratic scholar)
 * - UNIT-74 (Cold computational machine)
 */

import { HostPersonality, TriviaQuestion, DifficultyLevel } from '../types';

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

// ------------------- SMACK TALK & REACTION VAULTS -------------------

const ROASTS_BY_HOST: Record<string, {
  wrongAnswer: string[];
  streakBroken: string[];
  timeout: string[];
  bigWagerLost: string[];
  correctAnswer: string[];
  highStreak: string[];
  lifelineUsed: string[];
  gameIntro: string[];
  gameOverPodium: { high: string[]; mid: string[]; low: string[] };
}> = {
  roxy: {
    wrongAnswer: [
      "Oh honey... did your cat walk across the keyboard, or was that your actual best guess?",
      "I've seen smarter decisions made by a broken toaster. Next question!",
      "Wrong! Honestly, I felt second-hand embarrassment just watching you pick that.",
      "Yikes. Swing and a massive miss! You might want to get your screen checked.",
      "Incorrect! Don't worry, nobody was recording that... except the entire audience.",
      "Did you close your eyes and pray? Because the trivia gods said 'No'.",
      "That answer was so bad it gave my microphone feedback. Try harder!",
      "Oof. If guessing was an Olympic sport, you just tripped over the starting block.",
    ],
    streakBroken: [
      "Ouch! There goes that streak straight into the trash compactor!",
      "And the streak goes up in smoke! Cue the sad trombone!",
      "You were doing so well... and then you had to go and pick that!",
      "Streak broken! Back to square one, butterfingers!",
    ],
    timeout: [
      "Did you fall asleep at the buzzer? The clock ran five laps around you!",
      "Time's up! Hello? Anybody home up there?",
      "Frozen like an iceberg! You ran out of time, darling!",
      "The timer expired while you were contemplating the universe. Wake up!",
    ],
    bigWagerLost: [
      "You bet big on THAT? Your virtual wallet is sobbing right now!",
      "Say goodbye to those coins! High roller went bankrupt!",
      "That wager just evaporated into thin air! Fortune does NOT favor the reckless.",
    ],
    correctAnswer: [
      "Well, well, look who actually knows something! Correct!",
      "Boom! Right on the money! Don't let it go to your head.",
      "Color me impressed! You nailed it.",
      "Correct! Did you sneak a peek at my notes, or was that pure skill?",
      "Bingo! Chalk up another win for the human!",
      "Spot on! Maybe you're not totally hopeless after all.",
    ],
    highStreak: [
      "Hold on, a streak like that? Are you secretly a supercomputer in disguise?",
      "Okay hotshot, that's five in a row! The stage is heating up!",
      "Unstoppable! You're making this look almost easy!",
    ],
    lifelineUsed: [
      "Running to your lifelines already? Fine, take your training wheels!",
      "Need a crutch? Don't worry, I won't tell anyone you couldn't do it alone.",
      "Deploying assistance! Try not to waste this lifeline, okay?",
    ],
    gameIntro: [
      "Welcome to the hot seat! Let's see if you've got the brainpower or just the bravado!",
      "Alright contender, let's see what you're made of! No pressure, just my merciless judgment.",
    ],
    gameOverPodium: {
      high: [
        "Unbelievable! You actually conquered my stage! Respect where respect is due.",
        "Take a bow, champion! Even I have to admit that was pure brilliance!",
      ],
      mid: [
        "Not terrible, not great. You're solidly in the 'needs improvement' club!",
        "A respectable showing, though I know you've got more in the tank.",
      ],
      low: [
        "Well... that happened. Let's pretend this round never occurred, shall we?",
        "Ouch. Time to hit the history books and come back when you're ready!",
      ],
    },
  },

  sunny: {
    wrongAnswer: [
      "Oh, so close! Don't let it shake you, we're bouncing right back!",
      "A tiny stumble! Shake it off and get ready for the next one!",
      "Not quite, but I love the bold effort! Let's get the next point!",
      "Oopsie! Brush it off! Champions are made from comebacks!",
      "Good try! Keep your chin up and eyes on the prize!",
    ],
    streakBroken: [
      "Oh no, our streak! But hey, that just means we get to build an even bigger one!",
      "Streak reset, but energy at 100%! Let's start a brand new run right now!",
    ],
    timeout: [
      "Time caught up to us! Let's quicken those fingers for the next round!",
      "Buzzer beat us! Stay sharp and stay fast!",
    ],
    bigWagerLost: [
      "Tough break on that wager, but we can win those coins right back!",
      "High stakes are always thrilling! We'll earn double on the next round!",
    ],
    correctAnswer: [
      "YES! Absolutely stellar! You are completely on fire!",
      "BOOM! Nailed it with flying colors! Look at that scoreboard light up!",
      "Incredible work! Pure genius in action!",
      "That's what I'm talking about! Perfection!",
      "Spectacular answer! You make trivia look like an art form!",
    ],
    highStreak: [
      "SUPER STREAK! You are an unstoppable trivia hurricane!",
      "Five in a row! The crowd is going absolutely wild for you!",
    ],
    lifelineUsed: [
      "Smart gameplay! Lifelines are there to be used, let's take advantage!",
      "Teamwork makes the dream work! Here is your lifeline boost!",
    ],
    gameIntro: [
      "Welcome, superstar! I am so hyped to be hosting your match today! Let's do this!",
      "It's game time! Bring your positive energy and let's rack up those points!",
    ],
    gameOverPodium: {
      high: [
        "AMAZING! You blew the roof off this place! You're a true trivia legend!",
        "What a magnificent performance! You belong in the Hall of Fame!",
      ],
      mid: [
        "Great effort today! A few more rounds and you'll be dominating the top ranks!",
      ],
      low: [
        "Every master was once a beginner! Proud of your effort—let's play again!",
      ],
    },
  },

  sterling: {
    wrongAnswer: [
      "Good heavens. A most lamentable inaccuracy, my good fellow.",
      "Alas, that is thoroughly incorrect. Do consult your encyclopedia.",
      "An unfortunate lapse in erudition. I expected rather more rigor from you.",
      "Regrettably false. A gentleman does not guess with such reckless abandon.",
      "I am dismayed. Even a rudimentary scholar would have known that.",
    ],
    streakBroken: [
      "A tragic termination of what promised to be a respectable intellectual sequence.",
      "Your momentum has suffered an untimely collapse. Compose yourself.",
    ],
    timeout: [
      "Punctuality is the soul of wisdom. You have permitted the clock to expire.",
      "Procrastination has cost you dearly. The allocated interval has lapsed.",
    ],
    bigWagerLost: [
      "A profligate squandering of capital! A prudent gentleman wagers with care.",
      "Your treasury has suffered a grievous depletion.",
    ],
    correctAnswer: [
      "Indubitably correct! A splendid demonstration of academic finesse.",
      "Exquisite! Precisely the caliber of scholarship I anticipated.",
      "First rate, old sport! Flawless deduction.",
      "Bravo! An erudite answer of the highest distinction.",
      "Impeccable. Your intellect does you immense credit.",
    ],
    highStreak: [
      "A magnificent run of intellectual prowess! You are a master of the academy.",
      "Five consecutive triumphs! An exhibition worthy of Oxford or Cambridge.",
    ],
    lifelineUsed: [
      "A judicious deployment of external counsel. Let us proceed with clarity.",
      "Even Socrates solicited the counsel of others. Assistance granted.",
    ],
    gameIntro: [
      "Greetings, esteemed scholar. Welcome to an arena of refined intellectual inquiry.",
      "Prepare your mental faculties. Today we separate the scholars from the amateurs.",
    ],
    gameOverPodium: {
      high: [
        "Magnificent! A performance that shall be recorded in the annals of scholarship!",
      ],
      mid: [
        "A respectable showing, though not without several regrettable deficiencies.",
      ],
      low: [
        "I fear your education has been grievously neglected. Do review the classics.",
      ],
    },
  },

  unit74: {
    wrongAnswer: [
      "Error 404: Correct answer not found in user cognitive memory bank.",
      "Input evaluated: FALSE. Human accuracy probability degraded by 18.4%.",
      "Logic failure detected. Processing subroutines indicate a suboptimal choice.",
      "Negative. That response contradicts verified scientific database parameters.",
      "Calculations indicate your answer was approximately 0% correct.",
    ],
    streakBroken: [
      "Streak data corrupted. Resetting combo multiplier registers to zero.",
      "Sequence anomaly detected. Previous consecutive successes terminated.",
    ],
    timeout: [
      "Temporal buffer overrun. Processing time exceeded allowable threshold.",
      "System clock timeout. Human response latency measured: excessive.",
    ],
    bigWagerLost: [
      "Resource depletion alert: High coin allocation resulted in net zero yield.",
      "Catastrophic financial calculation. Wager units destroyed.",
    ],
    correctAnswer: [
      "Affirmative. Processing confirms exact match with ground-truth data.",
      "Logic sequence validated. Output: OPTIMAL.",
      "Correct. Human neural firing pattern temporarily synchronized with mainframe.",
      "Verification complete: 100% accurate computation.",
      "Data verified. Points added to player registry.",
    ],
    highStreak: [
      "Warning: High streak detected. Human efficiency exceeding standard operating baselines.",
      "Combo count exceeds nominal thresholds. Calculating likelihood of cyborg augmentation.",
    ],
    lifelineUsed: [
      "External subroutine engaged. Eliminating erroneous data clusters.",
      "Assistance protocol initialized. Processing auxiliary hints.",
    ],
    gameIntro: [
      "UNIT-74 online. Diagnostic complete. Commencing evaluation of organic intelligence.",
      "System ready. Query engine initialized. Present your cognitive inputs.",
    ],
    gameOverPodium: {
      high: [
        "Evaluation concluding. Result: Exceptional cognitive processing efficiency achieved.",
      ],
      mid: [
        "Evaluation concluding. Result: Human intelligence operating within nominal parameters.",
      ],
      low: [
        "Evaluation concluding. Result: Critical cognitive inefficiencies observed. Reboot recommended.",
      ],
    },
  },
};

// Fallback to roxy if unknown host ID
function getHostVault(hostId: string) {
  const normalized = hostId.toLowerCase();
  return ROASTS_BY_HOST[normalized] || ROASTS_BY_HOST['roxy'];
}

function getRandomPick(list: string[]): string {
  if (!list || list.length === 0) return 'Moving on!';
  return list[Math.floor(Math.random() * list.length)];
}

// ------------------- PUBLIC LOCAL AI GENERATORS -------------------

/**
 * Generate full spoken speech to read a question out loud naturally
 */
export function generateQuestionSpeech(
  question: TriviaQuestion,
  personality: HostPersonality,
  questionIndex: number,
  totalQuestions: number
): string {
  const hostName = personality.name;
  const leadIns: Record<string, string[]> = {
    roxy: [
      `Question ${questionIndex + 1}! Let's see if you can handle this one.`,
      `Here comes number ${questionIndex + 1}. Focus up!`,
      `Question ${questionIndex + 1}. Don't embarrass yourself now!`,
    ],
    sunny: [
      `Alright superstar! Here is Question ${questionIndex + 1}!`,
      `Question ${questionIndex + 1} is up! You're going to love this one!`,
      `Let's go, Question ${questionIndex + 1}! Knock it out of the park!`,
    ],
    sterling: [
      `Pray attend to Question the ${questionIndex + 1}th.`,
      `Question ${questionIndex + 1}, of the ${question.category.replace('_', ' ')} discipline.`,
      `Consider Question ${questionIndex + 1} with due care and contemplation.`,
    ],
    unit74: [
      `Query ${questionIndex + 1} of ${totalQuestions} loaded.`,
      `Input prompt ${questionIndex + 1} active.`,
      `Processing Query ${questionIndex + 1}.`,
    ],
  };

  const pool = leadIns[personality.id.toLowerCase()] || leadIns.roxy;
  const leadIn = getRandomPick(pool);

  // Return lead-in + question text for natural audio reading
  return `${leadIn} ${question.question}`;
}

/**
 * Generate local smack talk / reaction for answer outcomes
 */
export function generateSmackTalk(ctx: BanterContext): string {
  const vault = getHostVault(ctx.personality.id);

  // Case 1: Timeout
  if (ctx.isTimeout) {
    return getRandomPick(vault.timeout);
  }

  // Case 2: Wrong Answer
  if (!ctx.isCorrect) {
    // Was a high wager lost?
    if (ctx.wager >= 100 && Math.random() < 0.5) {
      return getRandomPick(vault.bigWagerLost);
    }
    // Was a significant streak broken?
    if (ctx.streak >= 3) {
      return getRandomPick(vault.streakBroken);
    }
    return getRandomPick(vault.wrongAnswer);
  }

  // Case 3: Correct Answer
  // Is this an epic streak milestone?
  if (ctx.streak >= 4 && ctx.streak % 2 === 0) {
    return getRandomPick(vault.highStreak);
  }

  return getRandomPick(vault.correctAnswer);
}

/**
 * Generate local smack talk for lifeline activation
 */
export function generateLifelineSmack(personality: HostPersonality): string {
  const vault = getHostVault(personality.id);
  return getRandomPick(vault.lifelineUsed);
}

/**
 * Generate game opening greeting
 */
export function generateGameIntro(personality: HostPersonality): string {
  const vault = getHostVault(personality.id);
  return getRandomPick(vault.gameIntro);
}

/**
 * Generate game over podium evaluation
 */
export function generateGameOverSmack(personality: HostPersonality, accuracyPct: number): string {
  const vault = getHostVault(personality.id);
  if (accuracyPct >= 75) {
    return getRandomPick(vault.gameOverPodium.high);
  } else if (accuracyPct >= 40) {
    return getRandomPick(vault.gameOverPodium.mid);
  } else {
    return getRandomPick(vault.gameOverPodium.low);
  }
}
