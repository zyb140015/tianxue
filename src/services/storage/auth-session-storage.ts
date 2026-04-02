import { storageKeys } from '@/constants/storage-keys';

import { deleteStorageItem, getStorageItem, setStorageItem } from './app-storage';

export type AuthSession = {
  identifier: string;
  loggedInAt: string;
};

export async function getAuthSession() {
  const rawValue = await getStorageItem(storageKeys.authSession);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthSession;
  } catch {
    return null;
  }
}

export async function saveAuthSession(session: AuthSession) {
  await setStorageItem(storageKeys.authSession, JSON.stringify(session));
}

export async function clearAuthSession() {
  await deleteStorageItem(storageKeys.authSession);
}
