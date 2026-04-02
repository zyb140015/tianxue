import type { RecentViewedQuestionRecord } from '@/types';
import { storageKeys } from '@/constants/storage-keys';

import { getStorageItem, setStorageItem } from './app-storage';

export async function getRecentViewedQuestions() {
  const rawValue = await getStorageItem(storageKeys.recentViewedQuestions);

  if (!rawValue) {
    return [] as RecentViewedQuestionRecord[];
  }

  try {
    return JSON.parse(rawValue) as RecentViewedQuestionRecord[];
  } catch {
    return [] as RecentViewedQuestionRecord[];
  }
}

export async function saveRecentViewedQuestions(records: RecentViewedQuestionRecord[]) {
  await setStorageItem(storageKeys.recentViewedQuestions, JSON.stringify(records));
}
