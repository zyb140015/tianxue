import { storageKeys } from '@/constants/storage-keys';

import { getStorageItem, setStorageItem } from './app-storage';

export type PersistedQuestionState = {
  id: string;
  isFavorite: boolean;
  isLearned: boolean;
  needsReview: boolean;
};

type PersistedQuestionStateMap = Record<string, PersistedQuestionState>;

export async function getPersistedQuestionState() {
  const rawValue = await getStorageItem(storageKeys.questionState);

  if (!rawValue) {
    return {} as PersistedQuestionStateMap;
  }

  try {
    return JSON.parse(rawValue) as PersistedQuestionStateMap;
  } catch {
    return {} as PersistedQuestionStateMap;
  }
}

export async function savePersistedQuestionState(state: PersistedQuestionStateMap) {
  await setStorageItem(storageKeys.questionState, JSON.stringify(state));
}
