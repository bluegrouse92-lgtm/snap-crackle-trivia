import fs from 'fs';
import path from 'path';
import { assemble500Vault } from './generateFullVault';

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

export interface WeeklyQuestionBank {
  version: string;
  year: number;
  weekNumber: number;
  generatedAt: string;
  expiresAt: string;
  totalQuestions: number;
  categories: Record<string, number>;
  questions: WeeklyQuestion[];
}

function getISOWeekInfo(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const nextMonday = new Date(d);
  nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);
  nextMonday.setUTCHours(0, 0, 0, 0);
  return { week, year: d.getUTCFullYear(), expiresAt: nextMonday.toISOString() };
}

export function generateWeeklyQuestionBank(): WeeklyQuestionBank {
  const { week, year, expiresAt } = getISOWeekInfo();
  const base = assemble500Vault(week, year) as WeeklyQuestion[];
  const questions = base.slice(0, 500);
  const categories: Record<string, number> = {};
  for (const q of questions) categories[q.category] = (categories[q.category] || 0) + 1;
  return {
    version: '2.0-offline', year, weekNumber: week, generatedAt: new Date().toISOString(), expiresAt,
    totalQuestions: questions.length, categories, questions,
  };
}

function main() {
  const bank = generateWeeklyQuestionBank();
  const dataDir = path.join(process.cwd(), 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'weeklyQuestions.json'), JSON.stringify(bank, null, 2), 'utf8');
  console.log(`Generated ${bank.totalQuestions} offline questions for week ${bank.weekNumber}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
