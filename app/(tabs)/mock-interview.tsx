import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Button, Chip, ProgressBar, Surface, Text } from 'react-native-paper';

import { EmptyState, LoadingState, ScreenContainer } from '@/components/common';
import { emptyStateCopy } from '@/constants/empty-state-copy';
import { mockInterviewService } from '@/services/mock/mock-interview-service';
import { questionService } from '@/services/mock/question-service';
import type { Question } from '@/types';
import { colors, spacing, useAppColors } from '@/theme';
import { formatDateTime } from '@/utils/format-date-time';
import { showErrorMessage, showInfoMessage, showSuccessMessage } from '@/utils/feedback';

const defaultCountdownSeconds = 120;

export default function MockInterviewScreen() {
  const appColors = useAppColors();
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(defaultCountdownSeconds);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasRecordedCurrentQuestion, setHasRecordedCurrentQuestion] = useState(false);
  const questionQuery = useQuery({
    queryKey: ['mock-question-initial'],
    queryFn: () => questionService.getRandomQuestion(),
  });
  const recordsQuery = useQuery({ queryKey: ['mock-interview-records'], queryFn: mockInterviewService.getRecords });
  const questionsQuery = useQuery({ queryKey: ['questions', 'mock-records'], queryFn: () => questionService.getQuestions() });
  const markLearnedMutation = useMutation({
    mutationFn: (id: string) => questionService.markLearned(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['questions'] }),
        queryClient.invalidateQueries({ queryKey: ['question-detail'] }),
      ]);
      showSuccessMessage('当前题目已标记为已学习。');
    },
    onError: () => showErrorMessage('学习状态更新失败，请稍后重试。'),
  });

  useEffect(() => {
    if (!hasStarted) {
      return;
    }

    if (remainingSeconds <= 0) {
      void completeCurrentQuestion();
      setHasStarted(false);
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, remainingSeconds]);

  useEffect(() => {
    if (!currentQuestion && questionQuery.data) {
      setCurrentQuestion(questionQuery.data);
      setRemainingSeconds(defaultCountdownSeconds);
      setHasStarted(false);
      setHasRecordedCurrentQuestion(false);
    }
  }, [currentQuestion, questionQuery.data]);

  const progress = useMemo(() => remainingSeconds / defaultCountdownSeconds, [remainingSeconds]);

  if ((questionQuery.isLoading && !currentQuestion) || questionsQuery.isLoading) {
    return <LoadingState />;
  }

  if (questionQuery.isError || recordsQuery.isError || questionsQuery.isError) {
    return <EmptyState title={emptyStateCopy.mockInterviewLoadFailed.title} description={emptyStateCopy.mockInterviewLoadFailed.description} />;
  }

  if (!currentQuestion) {
    return <EmptyState title="暂无可练习题目" description="请先补充题库数据后再开始模拟面试。" />;
  }

  const question = currentQuestion;
  const questionMap = new Map((questionsQuery.data ?? []).map((item) => [item.id, item]));

  const completeCurrentQuestion = async () => {
    if (!hasStarted || hasRecordedCurrentQuestion) {
      return;
    }

    await mockInterviewService.addRecord({
      questionId: question.id,
      duration: defaultCountdownSeconds - remainingSeconds,
    });
    setHasRecordedCurrentQuestion(true);
    showSuccessMessage('本轮练习已记录。');

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['mock-interview-records'] }),
      queryClient.invalidateQueries({ queryKey: ['profile-user'] }),
      queryClient.invalidateQueries({ queryKey: ['user'] }),
    ]);
  };

  const handleStart = async () => {
    setHasStarted(true);
    setHasRecordedCurrentQuestion(false);

    if (!question.isLearned) {
      await markLearnedMutation.mutateAsync(question.id);
    }

    showInfoMessage('开始本轮模拟，请按结构化方式作答。');
  };

  const handleNext = async () => {
    await completeCurrentQuestion();

    const nextQuestion = await questionService.getRandomQuestion(question.id);

    if (nextQuestion?.id) {
      setCurrentQuestion(nextQuestion);
      setRemainingSeconds(defaultCountdownSeconds);
      setHasStarted(false);
      setHasRecordedCurrentQuestion(false);
      showInfoMessage('已切换到下一题。');
    }
  };

  const handleRestart = () => {
    setRemainingSeconds(defaultCountdownSeconds);
    setHasStarted(false);
    setHasRecordedCurrentQuestion(false);
    showInfoMessage('已重新开始本轮模拟。');
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={appColors.isDark ? ['#2A2542', '#2B3550'] : ['#F5F2FF', '#ECE7FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { borderColor: appColors.border }]}> 
          <View style={styles.heroTop}>
            <Chip style={[styles.heroChip, { backgroundColor: appColors.surface, borderColor: appColors.border }]} textStyle={[styles.heroChipText, { color: appColors.primary }]}>Mock Session</Chip>
            <Text style={[styles.heroCounter, { color: appColors.primary }]}>{remainingSeconds}s</Text>
          </View>
          <Text variant="headlineMedium" style={[styles.heroTitle, { color: appColors.text }]}>模拟面试</Text>
          <Text style={[styles.heroSubtitle, { color: appColors.textSecondary }]}>按“背景 - 思路 - 核心点 - 总结”输出，训练稳定表达。</Text>
          <ProgressBar progress={progress} style={[styles.progress, { backgroundColor: appColors.isDark ? '#332D52' : colors.primarySoft }]} color={appColors.isDark ? appColors.primaryLight : colors.primary} />
        </LinearGradient>

        <Animated.View key={question.id} entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
          <Surface style={[styles.questionCard, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
            <View style={styles.headerRow}>
              <Chip compact style={[styles.cardChip, { backgroundColor: appColors.primarySoft }]} textStyle={[styles.cardChipText, { color: appColors.primaryDark }]}>随机题</Chip>
              <Chip compact style={[styles.cardChip, { backgroundColor: appColors.primarySoft }]} textStyle={[styles.cardChipText, { color: appColors.primaryDark }]}>倒计时 {remainingSeconds} 秒</Chip>
            </View>
            <Text variant="titleLarge" style={[styles.questionTitle, { color: appColors.text }]}>{question.title}</Text>
            <Text style={[styles.questionDescription, { color: appColors.textSecondary }]}>建议开口前先用 5 秒整理结构，再按模块表达答案，会比直接展开更稳。</Text>
          </Surface>
        </Animated.View>

        <View style={styles.actions}>
          <Button mode="contained" buttonColor={appColors.primary} style={[styles.primaryButton, { shadowColor: appColors.shadow }]} onPress={() => void handleStart()} disabled={hasStarted || remainingSeconds <= 0}>
            {hasStarted ? '回答中...' : '开始回答'}
          </Button>
          <Button mode="outlined" textColor={appColors.text} style={[styles.outlineButton, { borderColor: appColors.border, backgroundColor: appColors.surfaceMuted }]} onPress={handleRestart}>
            重新开始本轮
          </Button>
          <Button mode="contained-tonal" buttonColor={appColors.surfaceStrong} textColor={appColors.primaryDark} style={styles.tonalButton} onPress={() => void handleNext()}>
            下一题
          </Button>
        </View>

        {recordsQuery.data?.length ? (
          <Surface style={[styles.historyCard, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
            <Text variant="titleMedium" style={[styles.historyTitle, { color: appColors.text }]}>最近练习</Text>
            {recordsQuery.data.slice(0, 3).map((record, index) => (
              <Pressable key={record.id} onPress={() => router.push({ pathname: '/question/[id]', params: { id: record.questionId } })} style={[styles.historyItem, index === 2 ? styles.lastItem : null]}>
                <View style={styles.historyMain}>
                  <Text style={[styles.historyLabel, { color: appColors.text }]}>{questionMap.get(record.questionId)?.title ?? record.questionId}</Text>
                  <View style={styles.historyTagRow}>
                    <Chip compact style={[styles.historyChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>{questionMap.get(record.questionId)?.category ?? '未知分类'}</Chip>
                    <Chip compact style={[styles.historyChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>{questionMap.get(record.questionId)?.difficulty ?? 'unknown'}</Chip>
                  </View>
                  <Text style={[styles.historyDate, { color: appColors.textSecondary }]}>{formatDateTime(record.startedAt)}</Text>
                </View>
                <View style={[styles.historyValuePill, { backgroundColor: appColors.primarySoft }]}>
                  <Text style={[styles.historyValue, { color: appColors.primaryDark }]}>{record.duration}s</Text>
                </View>
              </Pressable>
            ))}
          </Surface>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingBottom: 120,
  },
  hero: {
    borderRadius: 32,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD8FF',
  },
  heroChipText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  heroCounter: {
    color: colors.primaryDark,
    fontSize: 24,
    fontWeight: '800',
  },
  heroTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  progress: {
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  questionCard: {
    borderRadius: 28,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#E7E1FF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardChip: {
    backgroundColor: colors.surfaceMuted,
  },
  cardChipText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  questionTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  questionDescription: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.md,
  },
  primaryButton: {
    borderRadius: 18,
    shadowColor: colors.shadow,
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  outlineButton: {
    borderRadius: 18,
    borderColor: '#D6D0F7',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  tonalButton: {
    borderRadius: 18,
  },
  historyCard: {
    borderRadius: 28,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#E7E1FF',
  },
  historyTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastItem: {
    paddingBottom: 0,
    marginBottom: 0,
    borderBottomWidth: 0,
  },
  historyMain: {
    flex: 1,
    gap: spacing.xs,
  },
  historyLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  historyValuePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primarySoft,
  },
  historyValue: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  historyDate: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  historyTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  historyChip: {
    backgroundColor: colors.surfaceMuted,
  },
});
