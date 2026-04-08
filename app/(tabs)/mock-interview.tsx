import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, InteractionManager, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Chip, ProgressBar, Surface, Text } from 'react-native-paper';

import { EmptyState, LoadingState, ScreenContainer } from '@/components/common';
import { emptyStateCopy } from '@/constants/empty-state-copy';
import { useTabScrollReset } from '@/hooks/use-tab-scroll-reset';
import { historyApiService } from '@/services/api/history-service';
import { questionApiService as questionService } from '@/services/api/question-service';
import type { MockInterviewRecord, Question } from '@/types';
import { colors, spacing, useAppColors } from '@/theme';
import { formatDateTime } from '@/utils/format-date-time';
import { showErrorMessage, showInfoMessage, showSuccessMessage } from '@/utils/feedback';

const defaultCountdownSeconds = 120;
const ENTRY_DURATION_MS = 360;
const ENTRY_STAGGER_MS = 80;
const PRESS_IN_SCALE = 0.985;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FadeInSection({ children, index = 0 }: { children: React.ReactNode; index?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ENTRY_DURATION_MS,
        delay: index * ENTRY_STAGGER_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: ENTRY_DURATION_MS,
        delay: index * ENTRY_STAGGER_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => animation.stop();
  }, [index, opacity, translateY]);

  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

function ScalePressable({ children, onPress, style }: { children: React.ReactNode; onPress?: () => void; style?: object }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      tension: 220,
      friction: 18,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => animateScale(PRESS_IN_SCALE)}
      onPressOut={() => animateScale(1)}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}

export default function MockInterviewScreen() {
  const appColors = useAppColors();
  const queryClient = useQueryClient();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(defaultCountdownSeconds);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasRecordedCurrentQuestion, setHasRecordedCurrentQuestion] = useState(false);
  const [isSubmittingRound, setIsSubmittingRound] = useState(false);
  const [isAdvancingQuestion, setIsAdvancingQuestion] = useState(false);
  const [shouldLoadScreenData, setShouldLoadScreenData] = useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);

  useTabScrollReset(scrollViewRef);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setShouldLoadScreenData(true);
    });

    return () => task.cancel();
  }, []);

  const questionQuery = useQuery({
    queryKey: ['mock-question-initial'],
    queryFn: () => questionService.getRandomQuestion(),
    enabled: shouldLoadScreenData,
    placeholderData: keepPreviousData,
  });
  const recordsQuery = useQuery({ queryKey: ['mock-interview-records'], queryFn: historyApiService.getInterviewRecords, enabled: shouldLoadScreenData, placeholderData: keepPreviousData });
  const recentRecordQuestionIds = Array.from(new Set((recordsQuery.data ?? []).slice(0, 3).map((record) => record.questionId)));
  const recentRecordQuestionsQuery = useQuery({
    queryKey: ['questions-batch', 'mock-records', recentRecordQuestionIds],
    queryFn: () => questionService.getQuestionsByIds(recentRecordQuestionIds),
    enabled: shouldLoadScreenData && recentRecordQuestionIds.length > 0,
    placeholderData: keepPreviousData,
  });
  const nextQuestionQuery = useQuery({
    queryKey: ['mock-next-question', currentQuestion?.id],
    queryFn: () => questionService.getRandomQuestion(currentQuestion?.id),
    enabled: shouldLoadScreenData && Boolean(currentQuestion?.id),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
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

  if (!currentQuestion && (questionQuery.isLoading || recordsQuery.isLoading || recentRecordQuestionsQuery.isLoading)) {
    return <LoadingState />;
  }

  if (questionQuery.isError || recordsQuery.isError || recentRecordQuestionsQuery.isError) {
    return <EmptyState title={emptyStateCopy.mockInterviewLoadFailed.title} description={emptyStateCopy.mockInterviewLoadFailed.description} />;
  }

  if (!currentQuestion) {
    return <EmptyState title="暂无可练习题目" description="请先补充题库数据后再开始模拟面试。" />;
  }

  const question = currentQuestion;
  const questionMap = new Map(
    (recentRecordQuestionsQuery.data ?? [])
      .map((item) => [item.id, item] as const),
  );

  const completeCurrentQuestion = async (input?: { questionId: string; duration: number }) => {
    const questionId = input?.questionId ?? question.id;
    const duration = input?.duration ?? (defaultCountdownSeconds - remainingSeconds);

    if ((!hasStarted && !input) || hasRecordedCurrentQuestion || isSubmittingRound) {
      return null;
    }

    try {
      setIsSubmittingRound(true);

      const createdRecord = await historyApiService.addInterviewRecord({
        questionId,
        duration,
      });

      queryClient.setQueryData<MockInterviewRecord[]>(['mock-interview-records'], (current = []) => [createdRecord, ...current]);
      queryClient.setQueryData<Question[]>(['questions-batch', 'mock-records', recentRecordQuestionIds], (current = []) => {
        if (current.some((item) => item.id === questionId)) {
          return current;
        }

        return [question, ...current.filter((item) => item.id !== questionId)].slice(0, 3);
      });

      setHasRecordedCurrentQuestion(true);
      showSuccessMessage('本轮练习已记录。');

      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stats-profile'] }),
        queryClient.invalidateQueries({ queryKey: ['stats-home'] }),
      ]);

      return createdRecord;
    } catch {
      showErrorMessage('本轮练习记录失败，请稍后重试。');
      return null;
    } finally {
      setIsSubmittingRound(false);
    }
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
    if (isSubmittingRound || isAdvancingQuestion) {
      return;
    }

    const questionId = question.id;
    const duration = defaultCountdownSeconds - remainingSeconds;

    setHasStarted(false);
    setIsAdvancingQuestion(true);

    const completedRecord = await completeCurrentQuestion({ questionId, duration });

    if (!completedRecord && !hasRecordedCurrentQuestion) {
      setHasStarted(true);
      setIsAdvancingQuestion(false);
      return;
    }

    try {
      const nextQuestion = nextQuestionQuery.data ?? await queryClient.fetchQuery({
        queryKey: ['mock-next-question', questionId],
        queryFn: () => questionService.getRandomQuestion(questionId),
        staleTime: 30_000,
      });

      if (nextQuestion?.id) {
        setCurrentQuestion(nextQuestion);
        setRemainingSeconds(defaultCountdownSeconds);
        setHasRecordedCurrentQuestion(false);
        showInfoMessage('已切换到下一题。');
      }
    } finally {
      setIsAdvancingQuestion(false);
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
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <FadeInSection index={0}>
        <LinearGradient colors={appColors.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { borderColor: appColors.border }]}> 
          <View style={[styles.heroGlow, { backgroundColor: appColors.overlayOrb }]} />
          
          <View style={styles.heroTop}>
            <View style={[styles.heroPill, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <Text style={styles.heroPillText}>Mock Session</Text>
            </View>
            <View style={[styles.heroPill, hasStarted ? { backgroundColor: colors.warning } : { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <Text style={[styles.heroPillText, hasStarted ? { color: '#000' } : null]}>
                {isAdvancingQuestion ? '切换题目中' : hasStarted ? '正在作答' : '准备就绪'}
              </Text>
            </View>
          </View>

          <View style={styles.heroTimerBlock}>
            <Text style={styles.heroTimerLabel}>剩余时间</Text>
            <Text style={[styles.heroTimerNumber, remainingSeconds <= 10 && hasStarted ? { color: colors.warning } : null]}>
              {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
            </Text>
            <ProgressBar progress={progress} style={styles.progress} color="#FFFFFF" />
          </View>

          <View style={styles.heroMetricRow}>
            <View style={styles.heroMetricCard}>
              <Text style={styles.heroMetricValue}>{recordsQuery.data?.length ?? 0}</Text>
              <Text style={styles.heroMetricLabel}>累计轮次</Text>
            </View>
            <View style={styles.heroMetricCard}>
              <Text style={styles.heroMetricValue} numberOfLines={1}>{question.category || '综合'}</Text>
              <Text style={styles.heroMetricLabel}>当前练习方向</Text>
            </View>
          </View>
        </LinearGradient>
        </FadeInSection>

        <FadeInSection index={1}>
        <View key={question.id}>
          <Surface style={[styles.questionCard, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
            <View style={styles.questionHeader}>
              <Text style={[styles.questionSectionTitle, { color: appColors.primary }]}>抽取题目</Text>
              <View style={[styles.smallBadge, { backgroundColor: appColors.primarySoft }]}>
                <Text style={[styles.smallBadgeText, { color: appColors.primaryDark }]}>{question.difficulty || '随机'}</Text>
              </View>
            </View>
            
            <Text variant="titleLarge" style={[styles.questionTitle, { color: appColors.text }]}>{question.title}</Text>
            
            <View style={[styles.guidePanel, { backgroundColor: appColors.isDark ? '#2A2542' : '#F8F7FF', borderColor: appColors.border }]}> 
              <Text style={[styles.guidePanelHeader, { color: appColors.textSecondary }]}>建议表达结构：</Text>
              <View style={styles.guideFlow}>
                <Text style={[styles.guideText, { color: appColors.primaryDark }]}>1. 背景</Text>
                <View style={[styles.guideSeparator, { backgroundColor: appColors.primarySoft }]} />
                <Text style={[styles.guideText, { color: appColors.primaryDark }]}>2. 思路</Text>
                <View style={[styles.guideSeparator, { backgroundColor: appColors.primarySoft }]} />
                <Text style={[styles.guideText, { color: appColors.primaryDark }]}>3. 核心</Text>
                <View style={[styles.guideSeparator, { backgroundColor: appColors.primarySoft }]} />
                <Text style={[styles.guideText, { color: appColors.primaryDark }]}>4. 总结</Text>
              </View>
            </View>
          </Surface>
        </View>
        </FadeInSection>

        <FadeInSection index={2}>
        <View style={styles.actionContainer}>
          {!hasStarted ? (
            <Button mode="contained" buttonColor={appColors.primary} labelStyle={{ fontWeight: '800', fontSize: 16 }} style={styles.bigPrimaryButton} onPress={() => void handleStart()} loading={isAdvancingQuestion} disabled={isAdvancingQuestion}>
              {isAdvancingQuestion ? '切换下一题...' : '开始作答 (2分钟)'}
            </Button>
          ) : (
            <View style={styles.activeActionsRow}>
              <Button mode="outlined" textColor={appColors.text} style={[styles.halfButton, { borderColor: appColors.border, backgroundColor: appColors.surfaceMuted }]} onPress={handleRestart}>
                重答
              </Button>
              <Button mode="contained" buttonColor="#10B981" style={styles.halfButton} onPress={() => void handleNext()} loading={isSubmittingRound} disabled={isSubmittingRound}>
                {isSubmittingRound ? '提交中...' : '完成此题'}
              </Button>
            </View>
          )}
        </View>
        </FadeInSection>

        {recordsQuery.data?.length ? (
          <FadeInSection index={3}>
          <Surface style={[styles.historyCard, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
            <View style={styles.historyHeader}>
              <View>
                <Text variant="titleMedium" style={[styles.historyTitle, { color: appColors.text }]}>最近练习</Text>
                <Text style={[styles.historySubtitle, { color: appColors.textSecondary }]}>回看最近几轮输出，保持节奏和手感。</Text>
              </View>
            </View>
            {recordsQuery.data.slice(0, 3).map((record, index) => (
              <ScalePressable key={record.id} onPress={() => router.push({ pathname: '/question/[id]', params: { id: record.questionId } })} style={[styles.historyTimelineItem, index === 2 ? styles.lastItem : null]}>
                <View style={styles.historyTimelineRail}>
                  <View style={[styles.historyTimelineDot, { backgroundColor: appColors.primary }]} />
                  {index !== 2 ? <View style={[styles.historyTimelineLine, { backgroundColor: appColors.border }]} /> : null}
                </View>
                <View style={[styles.historyItemCard, { backgroundColor: appColors.surfaceMuted, borderColor: appColors.border }]}> 
                  <View style={styles.historyItemTopRow}>
                    <Text style={[styles.historyLabel, { color: appColors.text }]}>{questionMap.get(record.questionId)?.title ?? record.questionId}</Text>
                    <View style={[styles.historyValuePill, { backgroundColor: appColors.primarySoft }]}> 
                      <Text style={[styles.historyValue, { color: appColors.primaryDark }]}>{record.duration}s</Text>
                    </View>
                  </View>
                  <View style={styles.historyTagRow}>
                    <Chip compact style={[styles.historyChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>{questionMap.get(record.questionId)?.category ?? '未知分类'}</Chip>
                    <Chip compact style={[styles.historyChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>{questionMap.get(record.questionId)?.difficulty ?? 'unknown'}</Chip>
                  </View>
                  <Text style={[styles.historyDate, { color: appColors.textSecondary }]}>{formatDateTime(record.startedAt)}</Text>
                </View>
              </ScalePressable>
            ))}
          </Surface>
          </FadeInSection>
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
    overflow: 'hidden',
    borderRadius: 32,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroGlow: {
    position: 'absolute',
    top: -36,
    right: -24,
    width: 160,
    height: 160,
    borderRadius: 999,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroPillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  heroTimerBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  heroTimerLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  heroTimerNumber: {
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 70,
  },
  progress: {
    height: 6,
    width: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: spacing.sm,
  },
  heroMetricRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  heroMetricCard: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    gap: 4,
  },
  heroMetricValue: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  heroMetricLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  questionCard: {
    borderRadius: 28,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    gap: spacing.lg,
    borderWidth: 1,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    shadowColor: 'rgba(0,0,0,0.05)',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  questionSectionTitle: {
    fontWeight: '800',
    fontSize: 14,
  },
  smallBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  smallBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  questionTitle: {
    fontWeight: '800',
    lineHeight: 30,
    fontSize: 20,
  },
  guidePanel: {
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  guidePanelHeader: {
    fontSize: 12,
    fontWeight: '600',
  },
  guideFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  guideText: {
    fontWeight: '700',
    fontSize: 13,
  },
  guideSeparator: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  actionContainer: {
    paddingHorizontal: spacing.sm,
    marginTop: -spacing.sm,
  },
  bigPrimaryButton: {
    borderRadius: 999,
    paddingVertical: 8,
    shadowColor: colors.shadow,
    shadowOpacity: 0.6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  activeActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 6,
  },
  historyCard: {
    borderRadius: 28,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#E7E1FF',
  },
  historyHeader: {
    gap: 4,
  },
  historyTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  historySubtitle: {
    fontSize: 12,
  },
  historyTimelineItem: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  historyTimelineRail: {
    alignItems: 'center',
    width: 18,
  },
  historyTimelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 10,
  },
  historyTimelineLine: {
    flex: 1,
    width: 2,
    marginTop: 6,
    borderRadius: 999,
  },
  historyItemCard: {
    flex: 1,
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  historyItemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
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
