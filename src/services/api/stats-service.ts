import { apiClient, getAuthorizedHeaders } from './http';
import type { Question, User } from '@/types';

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type StatsOverview = {
  totalQuestionCount: number;
  learnedCount: number;
  favoriteCount: number;
  needsReviewCount: number;
  averageInterviewDuration: number;
};

export type CategoryProgress = {
  category: string;
  total: number;
  learned: number;
  review: number;
  progress: number;
};

export type HomeDashboard = {
  user: User;
  overview: StatsOverview;
  recommendedQuestion: Question | null;
  reviewQuestions: Question[];
  recentRecords: Array<{ id: string; questionId: string; duration: number; startedAt: string }>;
  recentViewed: Array<{ id: string; questionId: string; viewedAt: string }>;
  recentQuestions: Question[];
};

export type ProfileDashboard = {
  user: User;
  overview: StatsOverview;
  recentRecords: Array<{ id: string; questionId: string; duration: number; startedAt: string }>;
  recentViewed: Array<{ id: string; questionId: string; viewedAt: string }>;
  recentQuestions: Question[];
};

type HomeDashboardDto = {
  recommendedQuestion: QuestionDto | null;
  reviewQuestions: QuestionDto[];
  recentQuestions: QuestionDto[];
  user: {
    id: number;
    name: string;
    avatar: string;
    streakDays: number;
    learnedCount: number;
    favoriteCount: number;
  };
  overview: StatsOverview;
  recentRecords: Array<{ id: number; questionId: number; duration?: number; startedAt?: string }>;
  recentViewed: Array<{ id: number; questionId: number; viewedAt?: string }>;
};

type ProfileDashboardDto = {
  user: HomeDashboardDto['user'];
  overview: StatsOverview;
  recentRecords: HomeDashboardDto['recentRecords'];
  recentViewed: HomeDashboardDto['recentViewed'];
  recentQuestions: QuestionDto[];
};

type QuestionDto = {
  id: number;
  title: string;
  content: string;
  answer: string;
  category: string;
  tags: string[];
  difficulty: Question['difficulty'];
  isFavorite: boolean;
  isLearned: boolean;
  needsReview: boolean;
};

function mapQuestionDto(dto: QuestionDto): Question {
  return {
    id: String(dto.id),
    title: dto.title,
    content: dto.content,
    answer: dto.answer,
    category: dto.category,
    tags: dto.tags,
    difficulty: dto.difficulty,
    isFavorite: dto.isFavorite,
    isLearned: dto.isLearned,
    needsReview: dto.needsReview,
  };
}

function mapUserDto(dto: HomeDashboardDto['user']): User {
  return {
    id: String(dto.id),
    name: dto.name,
    avatar: dto.avatar,
    streakDays: dto.streakDays,
    learnedCount: dto.learnedCount,
    favoriteCount: dto.favoriteCount,
  };
}

function mapRecentRecordDto(record: { id: number; questionId: number; duration?: number; startedAt?: string }) {
  return {
    id: String(record.id),
    questionId: String(record.questionId),
    duration: record.duration ?? 0,
    startedAt: record.startedAt ?? new Date().toISOString(),
  };
}

function mapRecentViewedDto(record: { id: number; questionId: number; viewedAt?: string }) {
  return {
    id: String(record.id),
    questionId: String(record.questionId),
    viewedAt: record.viewedAt ?? new Date().toISOString(),
  };
}

export const statsApiService = {
  async getOverview() {
    const headers = await getAuthorizedHeaders();
    const response = await apiClient.get<ApiResponse<StatsOverview>>('/stats/overview', { headers });
    return response.data.data;
  },
  async getCategories() {
    const headers = await getAuthorizedHeaders();
    const response = await apiClient.get<ApiResponse<CategoryProgress[]>>('/stats/categories', { headers });
    return response.data.data;
  },
  async getHomeDashboard() {
    const headers = await getAuthorizedHeaders();
    const response = await apiClient.get<ApiResponse<HomeDashboardDto>>('/stats/home', { headers });
    const data = response.data.data;

    return {
      user: mapUserDto(data.user),
      overview: data.overview,
      recommendedQuestion: data.recommendedQuestion ? mapQuestionDto(data.recommendedQuestion) : null,
      reviewQuestions: data.reviewQuestions.map(mapQuestionDto),
      recentRecords: data.recentRecords.map(mapRecentRecordDto),
      recentViewed: data.recentViewed.map(mapRecentViewedDto),
      recentQuestions: data.recentQuestions.map(mapQuestionDto),
    } satisfies HomeDashboard;
  },
  async getProfileDashboard() {
    const headers = await getAuthorizedHeaders();
    const response = await apiClient.get<ApiResponse<ProfileDashboardDto>>('/stats/profile', { headers });
    const data = response.data.data;

    return {
      user: mapUserDto(data.user),
      overview: data.overview,
      recentRecords: data.recentRecords.map(mapRecentRecordDto),
      recentViewed: data.recentViewed.map(mapRecentViewedDto),
      recentQuestions: data.recentQuestions.map(mapQuestionDto),
    } satisfies ProfileDashboard;
  },
};
