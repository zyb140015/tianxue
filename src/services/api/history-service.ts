import type { MockInterviewRecord, RecentViewedQuestionRecord } from '@/types';

import { apiClient, getAuthorizedHeaders } from './http';

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

type HistoryRecordDto = {
  id: number;
  questionId: number;
  duration?: number;
  viewedAt?: string;
  startedAt?: string;
};

export const historyApiService = {
  async getViewedRecords() {
    const headers = await getAuthorizedHeaders();
    const response = await apiClient.get<ApiResponse<HistoryRecordDto[]>>('/history/viewed', { headers });

    return response.data.data.map<RecentViewedQuestionRecord>((record) => ({
      id: String(record.id),
      questionId: String(record.questionId),
      viewedAt: record.viewedAt ?? new Date().toISOString(),
    }));
  },
  async addViewedRecord(questionId: string) {
    const headers = await getAuthorizedHeaders();
    const response = await apiClient.post<ApiResponse<HistoryRecordDto>>('/history/viewed', { questionId: Number(questionId) }, { headers });

    return {
      id: String(response.data.data.id),
      questionId: String(response.data.data.questionId),
      viewedAt: response.data.data.viewedAt ?? new Date().toISOString(),
    } satisfies RecentViewedQuestionRecord;
  },
  async deleteViewedRecord(id: string) {
    const headers = await getAuthorizedHeaders();
    await apiClient.delete(`/history/viewed/${id}`, { headers });
  },
  async clearViewedRecords() {
    const headers = await getAuthorizedHeaders();
    await apiClient.delete('/history/viewed', { headers });
  },
  async getInterviewRecords() {
    const headers = await getAuthorizedHeaders();
    const response = await apiClient.get<ApiResponse<HistoryRecordDto[]>>('/history/interview', { headers });

    return response.data.data.map<MockInterviewRecord>((record) => ({
      id: String(record.id),
      questionId: String(record.questionId),
      duration: record.duration ?? 0,
      startedAt: record.startedAt ?? new Date().toISOString(),
    }));
  },
  async addInterviewRecord(input: { questionId: string; duration: number }) {
    const headers = await getAuthorizedHeaders();
    const response = await apiClient.post<ApiResponse<HistoryRecordDto>>('/history/interview', { questionId: Number(input.questionId), duration: input.duration }, { headers });

    return {
      id: String(response.data.data.id),
      questionId: String(response.data.data.questionId),
      duration: response.data.data.duration ?? 0,
      startedAt: response.data.data.startedAt ?? new Date().toISOString(),
    } satisfies MockInterviewRecord;
  },
  async deleteInterviewRecord(id: string) {
    const headers = await getAuthorizedHeaders();
    await apiClient.delete(`/history/interview/${id}`, { headers });
  },
  async clearInterviewRecords() {
    const headers = await getAuthorizedHeaders();
    await apiClient.delete('/history/interview', { headers });
  },
};
