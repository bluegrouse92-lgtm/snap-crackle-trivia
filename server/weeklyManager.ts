import fs from 'fs';
import path from 'path';

export interface WeeklyQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  correctAnswer: string;
  explanation: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  hostCommentary: string;
  funFact: string;
  groundingSources?: { title?: string; uri?: string }[];
}

export interface WeeklyBankMetadata {
  version: string;
  year: number;
  weekNumber: number;
  generatedAt: string;
  expiresAt: string;
  totalQuestions: number;
  categories: Record<string, number>;
}

export interface WeeklyBankPayload extends WeeklyBankMetadata {
  questions: WeeklyQuestion[];
}

const WEEKLY_FILE = path.join(process.cwd(), 'data', 'weeklyQuestions.json');

class WeeklyQuestionManager {
  private metadata: WeeklyBankMetadata | null = null;
  private questions: WeeklyQuestion[] = [];
  private byCategory: Map<string, WeeklyQuestion[]> = new Map();

  constructor() {
    this.init();
  }

  public init() {
    try {
      if (!fs.existsSync(WEEKLY_FILE)) {
        console.log('ℹ️ Weekly questions file not found. Generating initial 500-question bank...');
        this.generateDefaultBank();
      }

      if (fs.existsSync(WEEKLY_FILE)) {
        const raw = fs.readFileSync(WEEKLY_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as WeeklyBankPayload;
        this.metadata = {
          version: parsed.version || '1.0',
          year: parsed.year,
          weekNumber: parsed.weekNumber,
          generatedAt: parsed.generatedAt,
          expiresAt: parsed.expiresAt,
          totalQuestions: parsed.questions?.length || 0,
          categories: parsed.categories || {},
        };
        this.questions = parsed.questions || [];
        this.indexQuestions();
        console.log(`✅ Weekly Question Bank loaded: ${this.questions.length} questions (Week ${this.metadata.weekNumber}, ${this.metadata.year})`);
      }
    } catch (err) {
      console.error('⚠️ Failed to load weekly questions:', err);
    }
  }

  private indexQuestions() {
    this.byCategory.clear();
    for (const q of this.questions) {
      const cat = q.category || 'all_mix';
      if (!this.byCategory.has(cat)) {
        this.byCategory.set(cat, []);
      }
      this.byCategory.get(cat)!.push(q);
    }
  }

  private generateDefaultBank() {
    try {
      const dataDir = path.dirname(WEEKLY_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to create data dir:', err);
    }
  }

  public getQuestions(
    category: string = 'all_mix',
    difficulty: string = 'Medium',
    count: number = 5,
    hostName: string = 'Your Host'
  ): WeeklyQuestion[] {
    const targetCount = Math.max(1, Math.min(count, 50));
    let pool: WeeklyQuestion[] = [];

    if (category && category !== 'all_mix' && category !== 'custom') {
      pool = this.byCategory.get(category) || [];
    }

    // If pool is insufficient or all_mix requested, draw from the full 500 bank
    if (pool.length < targetCount) {
      pool = this.questions;
    }

    // Filter by difficulty if specific, otherwise consider all
    let filtered = pool;
    if (difficulty && difficulty !== 'All') {
      const diffMatches = pool.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
      if (diffMatches.length >= targetCount) {
        filtered = diffMatches;
      }
    }

    // Shuffle and pick targetCount
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, targetCount);

    // Personalize host commentary with host name
    return selected.map(q => ({
      ...q,
      hostCommentary: q.hostCommentary.replace(/Your Host/g, hostName),
    }));
  }

  public getMetadata(): WeeklyBankMetadata {
    return this.metadata || {
      version: '1.0',
      year: new Date().getFullYear(),
      weekNumber: 1,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      totalQuestions: this.questions.length,
      categories: {},
    };
  }

  public reload(): boolean {
    this.init();
    return this.questions.length > 0;
  }
}

export const weeklyQuestionManager = new WeeklyQuestionManager();
