import type { Question, QuestionDifficulty } from '@/types';

import { getPersistedQuestionState, savePersistedQuestionState } from '@/services/storage/question-state-storage';

import { mockCategories, mockQuestions } from './mock-questions';

type GetQuestionsInput = {
  search?: string;
  category?: string;
  favoriteOnly?: boolean;
  unlearnedOnly?: boolean;
  needsReviewOnly?: boolean;
  difficulty?: QuestionDifficulty | 'all';
  tag?: string;
  sort?: 'default' | 'difficulty' | 'favorites-first';
};

let questions: Question[] = mockQuestions.map((question) => ({ ...question }));
let hasHydratedQuestions = false;

async function ensureQuestionsHydrated() {
  if (hasHydratedQuestions) {
    return;
  }

  const persistedState = await getPersistedQuestionState();

  questions = mockQuestions.map((question) => {
    const localState = persistedState[question.id];

    if (!localState) {
      return { ...question };
    }

      return {
        ...question,
        isFavorite: localState.isFavorite,
        isLearned: localState.isLearned,
        needsReview: localState.needsReview,
      };
    });

  hasHydratedQuestions = true;
}

async function persistQuestionState() {
  const state = Object.fromEntries(
    questions.map((question) => [
      question.id,
        {
          id: question.id,
          isFavorite: question.isFavorite,
          isLearned: question.isLearned,
          needsReview: question.needsReview,
        },
      ]),
  );

  await savePersistedQuestionState(state);
}

function matchesSearch(question: Question, search: string) {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [question.title, question.content, question.tags.join(' '), question.category]
    .join(' ')
    .toLowerCase()
    .includes(normalizedSearch);
}

export const questionService = {
  async getCategories() {
    await ensureQuestionsHydrated();
    return Promise.resolve(mockCategories);
  },
  async getQuestions(input?: GetQuestionsInput) {
    await ensureQuestionsHydrated();
    const search = input?.search ?? '';
    const category = input?.category ?? 'all';
    const favoriteOnly = input?.favoriteOnly ?? false;
    const unlearnedOnly = input?.unlearnedOnly ?? false;
    const needsReviewOnly = input?.needsReviewOnly ?? false;
    const difficulty = input?.difficulty ?? 'all';
    const tag = input?.tag ?? 'all';
    const sort = input?.sort ?? 'default';

    const filteredQuestions = questions.filter((question) => {
      const matchesCategory = category === 'all' ? true : question.category === category;
      const matchesFavorite = favoriteOnly ? question.isFavorite : true;
      const matchesUnlearned = unlearnedOnly ? !question.isLearned : true;
      const matchesNeedsReview = needsReviewOnly ? question.needsReview : true;
      const matchesDifficulty = difficulty === 'all' ? true : question.difficulty === difficulty;
      const matchesTag = tag === 'all' ? true : question.tags.includes(tag);

      return matchesCategory && matchesFavorite && matchesUnlearned && matchesNeedsReview && matchesDifficulty && matchesTag && matchesSearch(question, search);
    });

    const difficultyOrder: Record<QuestionDifficulty, number> = {
      easy: 1,
      medium: 2,
      hard: 3,
    };

    const sortedQuestions = [...filteredQuestions].sort((left, right) => {
      if (sort === 'difficulty') {
        return difficultyOrder[left.difficulty] - difficultyOrder[right.difficulty];
      }

      if (sort === 'favorites-first') {
        if (left.isFavorite === right.isFavorite) {
          return 0;
        }

        return left.isFavorite ? -1 : 1;
      }

      return 0;
    });

    return Promise.resolve(sortedQuestions);
  },
  async getQuestionById(id: string) {
    await ensureQuestionsHydrated();
    return Promise.resolve(questions.find((question) => question.id === id) ?? null);
  },
  async getFavoriteQuestions() {
    await ensureQuestionsHydrated();
    return Promise.resolve(questions.filter((question) => question.isFavorite));
  },
  async getRecommendedQuestion() {
    await ensureQuestionsHydrated();
    return Promise.resolve(questions[0] ?? null);
  },
  async getAvailableTags() {
    await ensureQuestionsHydrated();
    return Promise.resolve(Array.from(new Set(questions.flatMap((question) => question.tags))));
  },
  async getRandomQuestion(excludedQuestionId?: string) {
    await ensureQuestionsHydrated();

    const candidateQuestions = questions.filter((question) => question.id !== excludedQuestionId);
    const availableQuestions = candidateQuestions.length > 0 ? candidateQuestions : questions;

    if (!availableQuestions.length) {
      return Promise.resolve(null);
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);

    return Promise.resolve(availableQuestions[randomIndex] ?? null);
  },
  async getRelatedQuestions(id: string) {
    await ensureQuestionsHydrated();

    const currentQuestion = questions.find((question) => question.id === id);

    if (!currentQuestion) {
      return Promise.resolve([] as Question[]);
    }

    return Promise.resolve(
      questions
        .filter((question) => question.id !== id)
        .map((question) => ({
          question,
          score:
            (question.category === currentQuestion.category ? 2 : 0) +
            question.tags.filter((tag) => currentQuestion.tags.includes(tag)).length,
        }))
        .sort((left, right) => right.score - left.score)
        .map((item) => item.question)
        .slice(0, 3),
    );
  },
  async toggleFavorite(id: string) {
    await ensureQuestionsHydrated();
    questions = questions.map((question) =>
      question.id === id ? { ...question, isFavorite: !question.isFavorite } : question,
    );

    await persistQuestionState();

    return Promise.resolve(questions.find((question) => question.id === id) ?? null);
  },
  async markLearned(id: string) {
    await ensureQuestionsHydrated();
    questions = questions.map((question) =>
      question.id === id ? { ...question, isLearned: true, needsReview: false } : question,
    );

    await persistQuestionState();

    return Promise.resolve(questions.find((question) => question.id === id) ?? null);
  },
  async toggleNeedsReview(id: string) {
    await ensureQuestionsHydrated();
    questions = questions.map((question) =>
      question.id === id
        ? {
            ...question,
            needsReview: !question.needsReview,
            isLearned: question.needsReview ? question.isLearned : false,
          }
        : question,
    );

    await persistQuestionState();

    return Promise.resolve(questions.find((question) => question.id === id) ?? null);
  },
};
