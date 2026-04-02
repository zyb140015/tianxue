import type { MockInterviewRecord } from '@/types';

import { getMockInterviewRecords, saveMockInterviewRecords } from '@/services/storage/mock-interview-storage';

type CreateMockInterviewRecordInput = {
  questionId: string;
  duration: number;
};

function createRecordId() {
  return `mock-${Date.now()}`;
}

export const mockInterviewService = {
  async getRecords() {
    const records = await getMockInterviewRecords();

    return records.sort((left, right) => right.startedAt.localeCompare(left.startedAt));
  },
  async addRecord(input: CreateMockInterviewRecordInput) {
    const records = await getMockInterviewRecords();
    const nextRecord: MockInterviewRecord = {
      id: createRecordId(),
      questionId: input.questionId,
      startedAt: new Date().toISOString(),
      duration: input.duration,
    };

    const nextRecords = [nextRecord, ...records].slice(0, 10);

    await saveMockInterviewRecords(nextRecords);

    return nextRecord;
  },
  async clearRecords() {
    await saveMockInterviewRecords([]);
  },
  async deleteRecord(id: string) {
    const records = await getMockInterviewRecords();
    await saveMockInterviewRecords(records.filter((record) => record.id !== id));
  },
};
