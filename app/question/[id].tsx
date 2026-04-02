import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Chip, Surface, Text } from 'react-native-paper';

import { EmptyState, LoadingState, ScreenContainer } from '@/components/common';
import { emptyStateCopy } from '@/constants/empty-state-copy';
import { recentViewedService } from '@/services/mock/recent-viewed-service';
import { questionService } from '@/services/mock/question-service';
import { colors, spacing, useAppColors } from '@/theme';
import { showErrorMessage, showSuccessMessage } from '@/utils/feedback';

export default function QuestionDetailScreen() {
  const appColors = useAppColors();
  const params = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const questionQuery = useQuery({
    queryKey: ['question-detail', params.id],
    queryFn: () => questionService.getQuestionById(params.id),
    enabled: Boolean(params.id),
  });
  const relatedQuestionsQuery = useQuery({
    queryKey: ['related-questions', params.id],
    queryFn: () => questionService.getRelatedQuestions(params.id),
    enabled: Boolean(params.id),
  });
  const allQuestionsQuery = useQuery({
    queryKey: ['questions', 'detail-navigation'],
    queryFn: () => questionService.getQuestions(),
  });
  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: string) => questionService.toggleFavorite(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['questions'] }),
        queryClient.invalidateQueries({ queryKey: ['favorite-questions'] }),
        queryClient.invalidateQueries({ queryKey: ['question-detail', params.id] }),
        queryClient.invalidateQueries({ queryKey: ['recommended-question'] }),
      ]);
      showSuccessMessage('收藏状态已更新。');
    },
    onError: () => showErrorMessage('收藏操作失败，请稍后重试。'),
  });
  const markLearnedMutation = useMutation({
    mutationFn: (id: string) => questionService.markLearned(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['questions'] }),
        queryClient.invalidateQueries({ queryKey: ['question-detail', params.id] }),
      ]);
      showSuccessMessage('已标记为已学习。');
    },
    onError: () => showErrorMessage('标记已学习失败，请稍后重试。'),
  });
  const toggleNeedsReviewMutation = useMutation({
    mutationFn: (id: string) => questionService.toggleNeedsReview(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['questions'] }),
        queryClient.invalidateQueries({ queryKey: ['question-detail', params.id] }),
        queryClient.invalidateQueries({ queryKey: ['related-questions', params.id] }),
      ]);
      showSuccessMessage('待复习状态已更新。');
    },
    onError: () => showErrorMessage('未掌握状态更新失败，请稍后重试。'),
  });

  useEffect(() => {
    if (questionQuery.data?.id) {
      void recentViewedService.addRecord(questionQuery.data.id);
    }
  }, [questionQuery.data?.id]);

  if (questionQuery.isLoading || relatedQuestionsQuery.isLoading || allQuestionsQuery.isLoading) {
    return <LoadingState />;
  }

  if (questionQuery.isError || relatedQuestionsQuery.isError || allQuestionsQuery.isError) {
    return <EmptyState title={emptyStateCopy.commonLoadFailed.title} description={emptyStateCopy.commonLoadFailed.description} />;
  }

  if (!questionQuery.data) {
    return <EmptyState title={emptyStateCopy.questionMissing.title} description={emptyStateCopy.questionMissing.description} />;
  }

  const question = questionQuery.data;
  const relatedQuestions = relatedQuestionsQuery.data ?? [];
  const questions = allQuestionsQuery.data ?? [];
  const currentQuestionIndex = questions.findIndex((item) => item.id === question.id);
  const previousQuestion = currentQuestionIndex > 0 ? questions[currentQuestionIndex - 1] : null;
  const nextQuestion = currentQuestionIndex >= 0 && currentQuestionIndex < questions.length - 1 ? questions[currentQuestionIndex + 1] : null;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={appColors.isDark ? ['#2B2645', '#332D52'] : ['#F4F1FF', '#E7E1FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { borderColor: appColors.border }]}>
          <View style={styles.metaRow}>
            <Chip style={[styles.heroChip, { backgroundColor: appColors.isDark ? '#3A345C' : appColors.surfaceMuted, borderColor: appColors.border }]} textStyle={[styles.heroChipText, { color: appColors.isDark ? '#F5F2FF' : appColors.primaryLight }]}>{question.category}</Chip>
            <Chip style={[styles.heroChip, { backgroundColor: appColors.isDark ? '#3A345C' : appColors.surfaceMuted, borderColor: appColors.border }]} textStyle={[styles.heroChipText, { color: appColors.isDark ? '#F5F2FF' : appColors.primaryLight }]}>{question.difficulty}</Chip>
            {question.isLearned ? <Chip style={[styles.heroChip, { backgroundColor: appColors.isDark ? '#3A345C' : appColors.surfaceMuted, borderColor: appColors.border }]} textStyle={[styles.heroChipText, { color: appColors.isDark ? '#F5F2FF' : appColors.primaryLight }]}>已学习</Chip> : null}
            {question.needsReview ? <Chip style={[styles.reviewHeroChip, { backgroundColor: appColors.tertiarySoft }]} textStyle={styles.reviewHeroChipText}>未掌握</Chip> : null}
          </View>
          <Text variant="headlineSmall" style={[styles.title, { color: appColors.text }]}>{question.title}</Text>
          <View style={styles.actions}>
            <Button
              mode="contained"
              buttonColor={appColors.primary}
              textColor={appColors.isDark ? '#FFFFFF' : appColors.textOnPrimary}
              icon={question.isFavorite ? 'star' : 'star-outline'}
              style={styles.primaryAction}
              labelStyle={styles.primaryActionLabel}
              onPress={() => toggleFavoriteMutation.mutate(question.id)}>
              {question.isFavorite ? '已收藏' : '收藏题目'}
            </Button>
            <View style={styles.secondaryActionsRow}>
              <Button
                mode="contained-tonal"
                textColor={appColors.isDark ? '#F5F2FF' : appColors.textSecondary}
                buttonColor={appColors.isDark ? '#3A345C' : appColors.surfaceMuted}
                icon="check"
                style={[
                  styles.secondaryInlineAction,
                  { borderColor: appColors.border },
                  question.isLearned
                    ? { backgroundColor: appColors.isDark ? '#4A456A' : '#E8E3FA' }
                    : null,
                ]}
                labelStyle={[
                  styles.secondaryActionLabel,
                  question.isLearned
                    ? { color: appColors.isDark ? '#F5F2FF' : appColors.textSecondary }
                    : { color: appColors.isDark ? '#F5F2FF' : appColors.textSecondary },
                ]}
                onPress={() => markLearnedMutation.mutate(question.id)}
                disabled={question.isLearned}>
                {question.isLearned ? '已标记学习' : '标记已学习'}
              </Button>
              <Button
                mode="outlined"
                textColor={colors.danger}
                style={[styles.secondaryInlineAction, styles.reviewAction, { borderColor: colors.danger, backgroundColor: appColors.isDark ? '#3A2D42' : 'transparent' }]}
                icon={question.needsReview ? 'alert-circle' : 'alert-circle-outline'}
                labelStyle={styles.reviewActionLabel}
                onPress={() => toggleNeedsReviewMutation.mutate(question.id)}>
                {question.needsReview ? '取消未掌握' : '标记未掌握'}
              </Button>
            </View>
          </View>
          <View style={styles.navigationRow}>
            <Button
              mode="outlined"
              textColor={previousQuestion ? appColors.text : appColors.textSecondary}
              style={[styles.navigationButton, { borderColor: appColors.border, backgroundColor: appColors.isDark ? '#332D52' : appColors.surfaceMuted }]}
              labelStyle={[
                styles.navigationButtonLabel,
                { color: previousQuestion ? appColors.text : appColors.textSecondary },
              ]}
              disabled={!previousQuestion}
              onPress={() => previousQuestion ? router.replace({ pathname: '/question/[id]', params: { id: previousQuestion.id } }) : undefined}>
              上一题
            </Button>
            <Button
              mode="outlined"
              textColor={nextQuestion ? appColors.text : appColors.textSecondary}
              style={[styles.navigationButton, { borderColor: appColors.border, backgroundColor: appColors.isDark ? '#332D52' : appColors.surfaceMuted }]}
              labelStyle={[
                styles.navigationButtonLabel,
                { color: nextQuestion ? appColors.text : appColors.textSecondary },
              ]}
              disabled={!nextQuestion}
              onPress={() => nextQuestion ? router.replace({ pathname: '/question/[id]', params: { id: nextQuestion.id } }) : undefined}>
              下一题
            </Button>
          </View>
        </LinearGradient>

        <Surface style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
          <Text style={[styles.sectionTitle, { color: appColors.primary }]}>题干</Text>
          <Text style={[styles.body, { color: appColors.text }]}>{question.content}</Text>
        </Surface>
        <Surface style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
          <Text style={[styles.sectionTitle, { color: appColors.primary }]}>答案</Text>
          <Text style={[styles.body, { color: appColors.text }]}>{question.answer}</Text>
        </Surface>

        {relatedQuestions.length ? (
          <Surface style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
            <Text style={[styles.sectionTitle, { color: appColors.primary }]}>相关推荐</Text>
            <View style={styles.relatedList}>
              {relatedQuestions.map((relatedQuestion) => (
                <Surface key={relatedQuestion.id} style={[styles.relatedCard, { backgroundColor: appColors.isDark ? '#2A2542' : appColors.surfaceMuted, borderColor: appColors.border }]} elevation={0}>
                  <Text style={[styles.relatedTitle, { color: appColors.text }]} onPress={() => router.push({ pathname: '/question/[id]', params: { id: relatedQuestion.id } })}>
                    {relatedQuestion.title}
                  </Text>
                  <View style={styles.relatedMetaRow}>
                    <Chip compact style={[styles.relatedChip, { backgroundColor: appColors.isDark ? '#3A345C' : appColors.primarySoft }]} textStyle={[styles.relatedChipText, { color: appColors.isDark ? '#F5F2FF' : appColors.primaryDark }]}>{relatedQuestion.category}</Chip>
                    <Chip compact style={[styles.relatedChip, { backgroundColor: appColors.isDark ? '#3A345C' : appColors.primarySoft }]} textStyle={[styles.relatedChipText, { color: appColors.isDark ? '#F5F2FF' : appColors.primaryDark }]}>{relatedQuestion.difficulty}</Chip>
                  </View>
                </Surface>
              ))}
            </View>
          </Surface>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingBottom: 48,
  },
  hero: {
    borderRadius: 32,
    padding: spacing.xl,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  heroChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCD3FF',
  },
  heroChipText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  reviewHeroChip: {
    backgroundColor: colors.tertiarySoft,
  },
  reviewHeroChipText: {
    color: colors.danger,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontWeight: '800',
    lineHeight: 52,
    fontSize: 34,
  },
  sectionTitle: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  body: {
    color: colors.text,
    lineHeight: 24,
    fontSize: 15,
  },
  actions: {
    gap: spacing.md,
  },
  primaryAction: {
    borderRadius: 18,
  },
  primaryActionLabel: {
    fontWeight: '800',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryInlineAction: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
  },
  secondaryActionLabel: {
    fontWeight: '700',
  },
  reviewAction: {
    borderRadius: 18,
    borderColor: colors.danger,
  },
  reviewActionLabel: {
    fontWeight: '700',
  },
  navigationRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  navigationButton: {
    flex: 1,
    borderWidth: 1,
  },
  navigationButtonLabel: {
    fontWeight: '700',
  },
  card: {
    borderRadius: 28,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    gap: spacing.md,
    borderWidth: 1,
  },
  relatedList: {
    gap: spacing.md,
  },
  relatedCard: {
    borderRadius: 20,
    padding: spacing.lg,
    backgroundColor: '#FAF9FF',
    borderWidth: 1,
    borderColor: '#E8E3FA',
    gap: spacing.sm,
  },
  relatedTitle: {
    color: colors.text,
    fontWeight: '700',
    lineHeight: 30,
  },
  relatedMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  relatedChip: {
    backgroundColor: '#F1EEFF',
  },
  relatedChipText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
