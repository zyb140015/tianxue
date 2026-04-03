import type { User } from '@/types';

import { apiClient, getAuthorizedHeaders } from './http';

type CurrentUserResponseDto = {
  code: number;
  message: string;
  data: {
    id: number;
    name: string;
    avatar: string;
    streakDays: number;
    learnedCount: number;
    favoriteCount: number;
  };
};

function mapUserDtoToUser(dto: CurrentUserResponseDto['data']): User {
  return {
    id: String(dto.id),
    name: dto.name,
    avatar: dto.avatar,
    streakDays: dto.streakDays,
    learnedCount: dto.learnedCount,
    favoriteCount: dto.favoriteCount,
  };
}

export const userApiService = {
  async getCurrentUser() {
    const headers = await getAuthorizedHeaders();
    const response = await apiClient.get<CurrentUserResponseDto>('/users/me', {
      headers,
    });

    return mapUserDtoToUser(response.data.data);
  },
};
