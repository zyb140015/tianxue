import type { RecentViewedQuestionRecord } from '@/types';

import { getRecentViewedQuestions, saveRecentViewedQuestions } from '@/services/storage/recent-viewed-storage';

const maxRecentViewedRecords = 10;

function createRecentViewedRecord(questionId: string): RecentViewedQuestionRecord {
  return {
    id: `view-${questionId}-${Date.now()}`,
    questionId,
    viewedAt: new Date().toISOString(),
  };
}

export const recentViewedService = {
  async getRecords() {
    const records = await getRecentViewedQuestions();

    return records.sort((left, right) => right.viewedAt.localeCompare(left.viewedAt));
  },
  async addRecord(questionId: string) {
    const records = await getRecentViewedQuestions();
    const nextRecord = createRecentViewedRecord(questionId);
    const filteredRecords = records.filter((record) => record.questionId !== questionId);
    const nextRecords = [nextRecord, ...filteredRecords].slice(0, maxRecentViewedRecords);

    await saveRecentViewedQuestions(nextRecords);

    return nextRecord;
  },
  async clearRecords() {
    await saveRecentViewedQuestions([]);
  },
  async deleteRecord(id: string) {
    const records = await getRecentViewedQuestions();
    await saveRecentViewedQuestions(records.filter((record) => record.id !== id));
  },
};
