import { apiClient } from './http';

type LoginResponseDto = {
  code: number;
  message: string;
  data: {
    token: string;
    user: {
      id: number;
      name: string;
      avatar: string;
      streakDays: number;
      learnedCount: number;
      favoriteCount: number;
    };
  };
};

export const authApiService = {
  async login(identifier: string, password: string) {
    const response = await apiClient.post<LoginResponseDto>('/auth/login', {
      identifier,
      password,
    });

    return response.data.data;
  },
};
