import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { storageKeys } from '@/constants/storage-keys';

async function getWebStorageItem(key: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(key);
}

async function setWebStorageItem(key: string, value: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, value);
}

async function removeWebStorageItem(key: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(key);
}

export async function getStorageItem(key: string) {
  if (Platform.OS === 'web') {
    return getWebStorageItem(key);
  }

  return SecureStore.getItemAsync(key);
}

export async function setStorageItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    return setWebStorageItem(key, value);
  }

  return SecureStore.setItemAsync(key, value);
}

export async function deleteStorageItem(key: string) {
  if (Platform.OS === 'web') {
    return removeWebStorageItem(key);
  }

  return SecureStore.deleteItemAsync(key);
}

export async function clearAllStorageItems() {
  await Promise.all(Object.values(storageKeys).map((key) => deleteStorageItem(key)));
}

export async function dumpAllStorageItems() {
  const entries = await Promise.all(
    Object.entries(storageKeys).map(async ([name, key]) => {
      const value = await getStorageItem(key);

      return [name, value] as const;
    }),
  );

  return Object.fromEntries(entries);
}

export async function restoreAllStorageItems(data: Partial<Record<keyof typeof storageKeys, string | null>>) {
  await Promise.all(
    Object.entries(storageKeys).map(async ([name, key]) => {
      const value = data[name as keyof typeof storageKeys];

      if (typeof value === 'string') {
        await setStorageItem(key, value);
        return;
      }

      await deleteStorageItem(key);
    }),
  );
}
