import type { Category, Question, QuestionDifficulty } from '@/types';

import { getAuthorizedHeaders, apiClient } from './http';

type GetQuestionsInput = {
  search?: string;
  category?: string;
  favoriteOnly?: boolean;
  unlearnedOnly?: boolean;
  needsReviewOnly?: boolean;
  difficulty?: QuestionDifficulty | 'all';
  tag?: string;
  sort?: 'default' | 'difficulty' | 'favorites-first';
  page?: number;
  pageSize?: number;
};

type QuestionPageDto = {
  items: QuestionDto[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type QuestionPage = {
  items: Question[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type QuestionNavigation = {
  previous: Question | null;
  next: Question | null;
};

type QuestionDto = {
  id: number;
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

type CategoryDto = {
  id: number;
  name: string;
  slug?: string;
};

type TagDto = {
  id: number;
  name: string;
  slug: string;
};

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

type QuestionStateDto = {
  questionId: number;
  isFavorite: boolean;
  isLearned: boolean;
  needsReview: boolean;
};

function mapQuestionDto(question: QuestionDto): Question {
  return {
    id: String(question.id),
    title: question.title,
    content: question.content,
    answer: question.answer,
    category: question.category,
    tags: question.tags ?? [],
    difficulty: question.difficulty,
    isFavorite: question.isFavorite,
    isLearned: question.isLearned,
    needsReview: question.needsReview,
  };
}

function mapCategoryDto(category: CategoryDto): Category {
  return {
    id: String(category.id),
    name: category.name,
  };
}

function mapQuestionPageDto(page: QuestionPageDto): QuestionPage {
  return {
    items: page.items.map(mapQuestionDto),
    page: page.page,
    pageSize: page.pageSize,
    total: page.total,
    hasMore: page.hasMore,
  };
}

function mapQuestionNavigationDto(navigation: { previous: QuestionDto | null; next: QuestionDto | null }): QuestionNavigation {
  return {
    previous: navigation.previous ? mapQuestionDto(navigation.previous) : null,
    next: navigation.next ? mapQuestionDto(navigation.next) : null,
  };
}

export const questionApiService = {
  async getCategories() {
    const response = await apiClient.get<ApiResponse<CategoryDto[]>>('/questions/categories');
    return response.data.data.map(mapCategoryDto);
  },
  async getAvailableTags() {
    const response = await apiClient.get<ApiResponse<TagDto[]>>('/questions/tags');
    return response.data.data.map((tag) => tag.name);
  },
  async getQuestionPage(input?: GetQuestionsInput) {
    const headers = await getAuthorizedHeaders();
    const response = await apiClient.get<ApiResponse<QuestionPageDto>>('/question-pages', {
      headers,
      params: {
        page: input?.page ?? 1,
        pageSize: input?.pageSize ?? 20,
        search: input?.search || undefined,
        categoryId: input?.category && input.category !== 'all' ? input.category : undefined,
        difficulty: input?.difficulty && input.difficulty !== 'all' ? input.difficulty : undefined,
        tag: input?.tag && input.tag !== 'all' ? input.tag : undefined,
        sort: input?.sort && input.sort !== 'default' ? input.sort : undefined,
        favoriteOnly: input?.favoriteOnly || undefined,
        unlearnedOnly: input?.unlearnedOnly || undefined,
        needsReviewOnly: input?.needsReviewOnly || undefined,
      },
    });

    return mapQuestionPageDto(response.data.data);
  },
  async getQuestionById(id: string) {
    const headers = await getAuthorizedHeaders();
    const response = await apiClient.get<ApiResponse<QuestionDto>>(`/questions/${id}`, { headers });
    return mapQuestionDto(response.data.data);
  },
  async getQuestionNavigation(id: string) {
    const headers = await getAuthorizedHeaders();
    const response = await apiClient.get<ApiResponse<{ previous: QuestionDto | null; next: QuestionDto | null }>>(`/questions/${id}/navigation`, { headers });
    return mapQuestionNavigationDto(response.data.data);
  },
  async getQuestionsByIds(ids: string[]) {
    if (!ids.length) {
      return [] as Question[];
    }

    const headers = await getAuthorizedHeaders();
    const response = await apiClient.get<ApiResponse<QuestionDto[]>>('/questions/batch', {
      headers,
      params: {
        ids: ids.join(','),
      },
    });

    return response.data.data.map(mapQuestionDto);
  },
  async getFavoriteQuestions() {
    const page = await questionApiService.getQuestionPage({ favoriteOnly: true, page: 1, pageSize: 100 });
    return page.items;
  },
  async getRecommendedQuestion() {
    return questionApiService.getRandomQuestion();
  },
  async getRandomQuestion(excludedQuestionId?: string) {
    const headers = await getAuthorizedHeaders();
    const response = await apiClient.get<ApiResponse<QuestionDto | null>>('/questions/random', {
      headers,
      params: {
        excludedQuestionId: excludedQuestionId || undefined,
      },
    });

    return response.data.data ? mapQuestionDto(response.data.data) : null;
  },
  async getRelatedQuestions(id: string) {
    const headers = await getAuthorizedHeaders();
    const response = await apiClient.get<ApiResponse<QuestionDto[]>>(`/questions/${id}/related`, { headers });
    return response.data.data.map(mapQuestionDto);
  },
  async toggleFavorite(id: string) {
    const question = await questionApiService.getQuestionById(id);
    const headers = await getAuthorizedHeaders();

    if (!question) {
      return null;
    }

    if (question.isFavorite) {
      const response = await apiClient.delete<ApiResponse<QuestionStateDto>>(`/questions/${id}/favorite`, { headers });
      const nextQuestion = {
        ...question,
        isFavorite: response.data.data.isFavorite,
      };
      return nextQuestion;
    }

    const response = await apiClient.post<ApiResponse<QuestionStateDto>>(`/questions/${id}/favorite`, undefined, { headers });
    const nextQuestion = {
      ...question,
      isFavorite: response.data.data.isFavorite,
    };
    return nextQuestion;
  },
  async markLearned(id: string) {
    const question = await questionApiService.getQuestionById(id);
    const headers = await getAuthorizedHeaders();

    if (!question) {
      return null;
    }

    const response = await apiClient.post<ApiResponse<QuestionStateDto>>(`/questions/${id}/learned`, undefined, { headers });
    const nextQuestion = {
      ...question,
      isLearned: response.data.data.isLearned,
      needsReview: response.data.data.needsReview,
    };
    return nextQuestion;
  },
  async toggleNeedsReview(id: string) {
    const question = await questionApiService.getQuestionById(id);
    const headers = await getAuthorizedHeaders();

    if (!question) {
      return null;
    }

    if (question.needsReview) {
      const response = await apiClient.delete<ApiResponse<QuestionStateDto>>(`/questions/${id}/review`, { headers });
      const nextQuestion = {
        ...question,
        needsReview: response.data.data.needsReview,
        isLearned: response.data.data.isLearned,
      };
      return nextQuestion;
    }

    const response = await apiClient.post<ApiResponse<QuestionStateDto>>(`/questions/${id}/review`, undefined, { headers });
    const nextQuestion = {
      ...question,
      needsReview: response.data.data.needsReview,
      isLearned: response.data.data.isLearned,
    };
    return nextQuestion;
  },
};
