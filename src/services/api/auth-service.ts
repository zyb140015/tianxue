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

type RegisterRequestDto = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export const authApiService = {
  async login(identifier: string, password: string) {
    const response = await apiClient.post<LoginResponseDto>('/auth/login', {
      identifier,
      password,
    });

    return response.data.data;
  },
  async register(payload: RegisterRequestDto) {
    const response = await apiClient.post<LoginResponseDto>('/auth/register', payload);

    return response.data.data;
  },
};
