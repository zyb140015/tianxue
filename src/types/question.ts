export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type Question = {
  id: string;
  title: string;
  content: string;
  answer: string;
  category: string;
  tags: string[];
  difficulty: QuestionDifficulty;
  isFavorite: boolean;
  isLearned: boolean;
  needsReview: boolean;
};
