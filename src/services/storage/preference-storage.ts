import { storageKeys } from '@/constants/storage-keys';

import { getStorageItem, setStorageItem } from './app-storage';

export type ThemeMode = 'light' | 'dark';

export async function getThemeMode() {
  const value = await getStorageItem(storageKeys.themeMode);

  return value === 'dark' ? 'dark' : 'light';
}

export async function saveThemeMode(themeMode: ThemeMode) {
  await setStorageItem(storageKeys.themeMode, themeMode);
}
