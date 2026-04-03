import axios from 'axios';

import { backendApiBaseUrl } from '@/constants/api';
import { getAuthSession } from '@/services/storage/auth-session-storage';
import { useAuthStore } from '@/store/use-auth-store';

export const apiClient = axios.create({
  baseURL: backendApiBaseUrl,
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  },
);

// getAuthorizedHeaders 获取带 token 的请求头。
//
// 这里没有直接用 axios interceptor，
// 是因为当前项目还处于学习和快速联调阶段，
// 显式读取 session 会更容易理解请求链路。
export async function getAuthorizedHeaders() {
  const session = await getAuthSession();

  if (!session?.token) {
    return {};
  }

  return {
    Authorization: `Bearer ${session.token}`,
  };
}
