export interface TriviaQuestion {
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
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 'q1',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Madrid', 'Paris'],
    correctIndex: 3,
    correctAnswer: 'Paris',
    explanation: 'Paris is the capital of France.',
    category: 'geography',
    difficulty: 'Easy',
    hostCommentary: 'Ah, a classic!',
    funFact: 'Paris is often called the City of Light.',
  },
  {
    id: 'q2',
    question: 'Which planet is known as the Red Planet?',
    options: ['Earth', 'Mars', 'Jupiter', 'Venus'],
    correctIndex: 1,
    correctAnswer: 'Mars',
    explanation: 'Mars appears red due to iron oxide on its surface.',
    category: 'science',
    difficulty: 'Easy',
    hostCommentary: 'Looking towards the heavens!',
    funFact: 'Mars has the largest volcano in the solar system.',
  },
  // Add more questions here...
];
