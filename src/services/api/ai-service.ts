import { apiClient, getAuthorizedHeaders } from './http';

type AiAskResponseDto = {
  code: number;
  message: string;
  data: {
    answer: string;
  };
};

export const aiApiService = {
  async ask(question: string) {
    const headers = await getAuthorizedHeaders();
    const response = await apiClient.post<AiAskResponseDto>(
      '/ai/ask',
      { question },
      { headers },
    );

    return response.data.data.answer;
  },
};
