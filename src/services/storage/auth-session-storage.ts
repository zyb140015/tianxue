import { storageKeys } from '@/constants/storage-keys';

import { deleteStorageItem, getStorageItem, setStorageItem } from './app-storage';

export type AuthSession = {
  identifier: string;
  loggedInAt: string;
  token: string;
  userId: string;
  userName: string;
  userAvatar: string;
};

export async function getAuthSession() {
  const rawValue = await getStorageItem(storageKeys.authSession);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<AuthSession>;

    // 这里兼容旧版本本地 session。
    //
    // 旧前端只保存了 identifier / loggedInAt，没有 token。
    // 现在既然后端已经接入 JWT，没有 token 的 session 就不能再视为有效登录态。
    if (!parsedValue?.token || !parsedValue?.userId || !parsedValue?.identifier || !parsedValue?.userName || !parsedValue?.userAvatar) {
      return null;
    }

    return parsedValue as AuthSession;
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
