import { storageKeys } from '@/constants/storage-keys';
import type { MockInterviewRecord } from '@/types';

import { getStorageItem, setStorageItem } from './app-storage';

export async function getMockInterviewRecords() {
  const rawValue = await getStorageItem(storageKeys.mockInterviewRecords);

  if (!rawValue) {
    return [] as MockInterviewRecord[];
  }

  try {
    return JSON.parse(rawValue) as MockInterviewRecord[];
  } catch {
    return [] as MockInterviewRecord[];
  }
}

export async function saveMockInterviewRecords(records: MockInterviewRecord[]) {
  await setStorageItem(storageKeys.mockInterviewRecords, JSON.stringify(records));
}
