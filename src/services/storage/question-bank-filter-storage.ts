import { storageKeys } from '@/constants/storage-keys';

import { getStorageItem, setStorageItem } from './app-storage';

export type QuestionBankFilterState = {
  search: string;
  selectedCategory: string;
  favoriteOnly: boolean;
  unlearnedOnly: boolean;
  needsReviewOnly: boolean;
  selectedDifficulty: 'all' | 'easy' | 'medium' | 'hard';
  selectedTag: string;
  selectedSort: 'default' | 'difficulty' | 'favorites-first';
};

export async function getQuestionBankFilters() {
  const rawValue = await getStorageItem(storageKeys.questionBankFilters);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as QuestionBankFilterState;
  } catch {
    return null;
  }
}

export async function saveQuestionBankFilters(filters: QuestionBankFilterState) {
  await setStorageItem(storageKeys.questionBankFilters, JSON.stringify(filters));
}
