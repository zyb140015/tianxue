import { questionService } from './question-service';
import { mockUser } from './mock-user';
import { mockInterviewService } from './mock-interview-service';

export const userService = {
  async getCurrentUser() {
    const [questions, records] = await Promise.all([
      questionService.getQuestions(),
      mockInterviewService.getRecords(),
    ]);

    return Promise.resolve({
      ...mockUser,
      learnedCount: questions.filter((question) => question.isLearned).length,
      favoriteCount: questions.filter((question) => question.isFavorite).length,
      streakDays: Math.max(mockUser.streakDays, records.length > 0 ? 8 : mockUser.streakDays),
    });
  },
};
