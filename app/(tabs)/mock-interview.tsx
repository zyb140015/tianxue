import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsFocused } from '@react-navigation/native';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, InteractionManager, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Chip, ProgressBar, Surface, Text } from 'react-native-paper';

import { EmptyState, LoadingState, ScreenContainer } from '@/components/common';
import { emptyStateCopy } from '@/constants/empty-state-copy';
import { useTabScrollReset } from '@/hooks/use-tab-scroll-reset';
import { historyApiService } from '@/services/api/history-service';
import { questionApiService as questionService } from '@/services/api/question-service';
import type { MockInterviewRecord, Question } from '@/types';
import { colors, spacing, useAppColors } from '@/theme';
import { showErrorMessage, showInfoMessage, showSuccessMessage } from '@/utils/feedback';

const defaultCountdownSeconds = 120;
const ENTRY_DURATION_MS = 360;
const ENTRY_STAGGER_MS = 80;

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

export default function MockInterviewScreen() {
  const appColors = useAppColors();
  const queryClient = useQueryClient();
  const isFocused = useIsFocused();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(defaultCountdownSeconds);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasCompletedCurrentQuestion, setHasCompletedCurrentQuestion] = useState(false);
  const [hasRecordedCurrentQuestion, setHasRecordedCurrentQuestion] = useState(false);
  const [isSubmittingRound, setIsSubmittingRound] = useState(false);
  const [isAdvancingQuestion, setIsAdvancingQuestion] = useState(false);
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
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
    if (isFocused || !hasStarted) {
      return;
    }

    setHasStarted(false);
    setHasCompletedCurrentQuestion(false);
    setRecordingUri(null);

    if (recorder.isRecording) {
      void recorder.stop().catch(() => undefined);
    }

    void setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    }).catch(() => undefined);
  }, [hasStarted, isFocused, recorder]);

  useEffect(() => {
    if (!isFocused && playerStatus.playing) {
      player.pause();
      void player.seekTo(0).catch(() => undefined);
    }
  }, [isFocused, player, playerStatus.playing]);

  useEffect(() => {
    return () => {
      if (recorder.isRecording) {
        void recorder.stop().catch(() => undefined);
      }

      if (playerStatus.playing) {
        player.pause();
      }

      void setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      }).catch(() => undefined);
    };
  }, [player, playerStatus.playing, recorder]);

  useEffect(() => {
    if (!hasStarted) {
      return;
    }

    if (remainingSeconds <= 0) {
      void handleComplete();
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
      setHasCompletedCurrentQuestion(false);
      setHasRecordedCurrentQuestion(false);
      setRecordingUri(null);
    }
  }, [currentQuestion, questionQuery.data]);

  const progress = useMemo(() => remainingSeconds / defaultCountdownSeconds, [remainingSeconds]);

  if (!currentQuestion && (questionQuery.isLoading || recordsQuery.isLoading)) {
    return <LoadingState />;
  }

  if (questionQuery.isError || recordsQuery.isError) {
    return <EmptyState title={emptyStateCopy.mockInterviewLoadFailed.title} description={emptyStateCopy.mockInterviewLoadFailed.description} />;
  }

  if (!currentQuestion) {
    return <EmptyState title="暂无可练习题目" description="请先补充题库数据后再开始模拟面试。" />;
  }

  const question = currentQuestion;
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
    try {
      setIsPreparingRecording(true);

      const permission = await requestRecordingPermissionsAsync();

      if (!permission.granted) {
        showErrorMessage('需要麦克风权限后才能开始录音作答。');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordingUri(null);
      setHasStarted(true);
      setHasCompletedCurrentQuestion(false);
      setHasRecordedCurrentQuestion(false);

      if (!question.isLearned) {
        await markLearnedMutation.mutateAsync(question.id);
      }

      showInfoMessage('开始本轮模拟，已同步开启录音。');
    } catch {
      showErrorMessage('录音启动失败，请稍后重试。');
    } finally {
      setIsPreparingRecording(false);
    }
  };

  const handleComplete = async () => {
    if (isSubmittingRound || isAdvancingQuestion || !hasStarted) {
      return;
    }

    const questionId = question.id;
    const duration = defaultCountdownSeconds - remainingSeconds;

    setHasStarted(false);

    try {
      if (recorder.isRecording) {
        await recorder.stop();
      }

      const latestRecordingUri = recorder.uri ?? recorderState.url ?? null;
      const completedRecord = await completeCurrentQuestion({ questionId, duration });

      if (!completedRecord && !hasRecordedCurrentQuestion) {
        setHasStarted(false);
        return;
      }

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      setRecordingUri(latestRecordingUri);
      setHasCompletedCurrentQuestion(true);
      showInfoMessage(latestRecordingUri ? '本题已完成，可以先回听录音再切换下一题。' : '本题已完成。');
    } catch {
      showErrorMessage('完成录音失败，请稍后重试。');
    } finally {
      if (recorder.isRecording) {
        await recorder.stop().catch(() => undefined);
      }
    }
  };

  const handlePlayRecording = async () => {
    if (!recordingUri) {
      showInfoMessage('当前还没有可播放的录音。');
      return;
    }

    try {
      if (playerStatus.playing) {
        player.pause();
        await player.seekTo(0);
        showInfoMessage('已停止当前录音播放。');
        return;
      }

      player.replace({ uri: recordingUri });
      player.play();
    } catch {
      showErrorMessage('录音播放失败，请稍后重试。');
    }
  };

  const handleNextQuestion = async () => {
    if (isAdvancingQuestion) {
      return;
    }

    const questionId = question.id;
    setIsAdvancingQuestion(true);

    try {
      if (playerStatus.playing) {
        player.pause();
        await player.seekTo(0);
      }

      const nextQuestion = nextQuestionQuery.data ?? await queryClient.fetchQuery({
        queryKey: ['mock-next-question', questionId],
        queryFn: () => questionService.getRandomQuestion(questionId),
        staleTime: 30_000,
      });

      if (nextQuestion?.id) {
        setCurrentQuestion(nextQuestion);
        setRemainingSeconds(defaultCountdownSeconds);
        setHasStarted(false);
        setHasCompletedCurrentQuestion(false);
        setHasRecordedCurrentQuestion(false);
        setRecordingUri(null);
        showInfoMessage('已切换到下一题。');
      }
    } finally {
      setIsAdvancingQuestion(false);
    }
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
          {!hasStarted && !hasCompletedCurrentQuestion ? (
            <View style={styles.activeActionsRow}>
              <Button
                mode="outlined"
                textColor={appColors.text}
                style={[styles.halfButton, { borderColor: appColors.border, backgroundColor: appColors.surfaceMuted }]}
                onPress={() => void handleNextQuestion()}
                loading={isAdvancingQuestion}
                disabled={isPreparingRecording || isAdvancingQuestion}>
                {isAdvancingQuestion ? '切换中...' : '切换题目'}
              </Button>
              <Button
                mode="contained"
                buttonColor={appColors.primary}
                labelStyle={{ fontWeight: '800', fontSize: 16 }}
                style={styles.halfButton}
                onPress={() => void handleStart()}
                loading={isPreparingRecording}
                disabled={isPreparingRecording || isAdvancingQuestion}>
                {isPreparingRecording ? '准备录音中...' : '开始作答'}
              </Button>
            </View>
          ) : hasStarted ? (
            <View style={styles.activeActionsRow}>
              <Button mode="contained" buttonColor="#10B981" style={styles.fullWidthButton} onPress={() => void handleComplete()} loading={isSubmittingRound} disabled={isSubmittingRound}>
                {isSubmittingRound ? '提交中...' : '完成此题'}
              </Button>
            </View>
          ) : (
            <View style={styles.activeActionsRow}>
              <Button
                mode="outlined"
                icon="microphone"
                textColor={appColors.text}
                style={[styles.halfButton, { borderColor: appColors.border, backgroundColor: appColors.surfaceMuted }]}
                onPress={() => void handlePlayRecording()}
                disabled={!recordingUri}>
                {playerStatus.playing ? '停止播放' : '播放录音'}
              </Button>
              <Button mode="contained" buttonColor={appColors.primary} style={styles.halfButton} onPress={() => void handleNextQuestion()} loading={isAdvancingQuestion} disabled={isAdvancingQuestion}>
                {isAdvancingQuestion ? '切换中...' : '切换下一题'}
              </Button>
            </View>
          )}
        </View>
        </FadeInSection>

        {hasCompletedCurrentQuestion ? (
          <FadeInSection index={3}>
          <Surface style={[styles.answerCard, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
            <View style={styles.answerHeader}>
              <Text variant="titleMedium" style={[styles.answerTitle, { color: appColors.text }]}>参考答案</Text>
              <Chip compact style={[styles.answerChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.primaryDark }}>
                完成后解锁
              </Chip>
            </View>
            <Text style={[styles.answerHint, { color: appColors.textSecondary }]}>先回听自己的表达，再对照这版答案看是否遗漏了关键点。</Text>
            <View style={[styles.answerPanel, { backgroundColor: appColors.surfaceMuted, borderColor: appColors.border }]}>
              <Text style={[styles.answerBody, { color: appColors.text }]}>{question.answer}</Text>
            </View>
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
  activeActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fullWidthButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 6,
  },
  answerCard: {
    borderRadius: 28,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    gap: spacing.md,
    borderWidth: 1,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  answerTitle: {
    fontWeight: '800',
  },
  answerChip: {
    alignSelf: 'flex-start',
  },
  answerHint: {
    lineHeight: 22,
  },
  answerPanel: {
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
  },
  answerBody: {
    lineHeight: 24,
    fontSize: 15,
  },
  halfButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 6,
  },
});
