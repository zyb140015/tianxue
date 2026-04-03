import { questionService } from './question-service';
import { mockUser } from './mock-user';
import { mockInterviewService } from './mock-interview-service';

export const userService = {
  async getCurrentUser() {
    const [favoriteQuestions, learnedQuestionCandidate, records] = await Promise.all([
      questionService.getFavoriteQuestions(),
      questionService.getQuestionById('1'),
      mockInterviewService.getRecords(),
    ]);

    const learnedCount = learnedQuestionCandidate?.isLearned ? 1 : 0;

    return Promise.resolve({
      ...mockUser,
      learnedCount,
      favoriteCount: favoriteQuestions.length,
      streakDays: Math.max(mockUser.streakDays, records.length > 0 ? 8 : mockUser.streakDays),
    });
  },
};
