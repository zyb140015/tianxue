import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, InteractionManager, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ScrollView as RNScrollView } from 'react-native';
import { Surface, Text } from 'react-native-paper';

import { LoadingState, ScreenContainer } from '@/components/common';
import { useTabScrollReset } from '@/hooks/use-tab-scroll-reset';
import { questionApiService as questionService } from '@/services/api/question-service';
import { statsApiService } from '@/services/api/stats-service';
import { colors, radius, spacing, useAppColors } from '@/theme';
import { formatDateTime } from '@/utils/format-date-time';
import { calculateLearningStreakDays } from '@/utils/learning-streak';
import { showInfoMessage } from '@/utils/feedback';

const ENTRY_DURATION_MS = 420;
const ENTRY_STAGGER_MS = 70;
const PRESS_IN_SCALE = 0.98;
const HERO_SCROLL_DISTANCE = 220;
const SHIMMER_LOOP_DURATION_MS = 2800;
const NAVIGATION_THROTTLE_MS = 800;
const PROGRESS_BAR_HEIGHT = 10;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FadeInSection({ children, index = 0, style }: { children: ReactNode; index?: number; style?: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

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

  return <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}

function ScalePressable({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
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

export default function HomeScreen() {
  const appColors = useAppColors();
  const [shouldLoadScreenData, setShouldLoadScreenData] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const shimmerProgress = useRef(new Animated.Value(0)).current;
  const lastNavigationAtRef = useRef(0);
  const scrollViewRef = useRef<RNScrollView | null>(null);

  useTabScrollReset(scrollViewRef);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setShouldLoadScreenData(true);
    });

    return () => task.cancel();
  }, []);

  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerProgress, {
        toValue: 1,
        duration: SHIMMER_LOOP_DURATION_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );

    shimmerLoop.start();

    return () => {
      shimmerLoop.stop();
    };
  }, [shimmerProgress]);

  const categoryQuery = useQuery({ queryKey: ['categories'], queryFn: questionService.getCategories, enabled: shouldLoadScreenData });
  const homeDashboardQuery = useQuery({ queryKey: ['stats-home'], queryFn: statsApiService.getHomeDashboard, enabled: shouldLoadScreenData });

  const heroAnimatedStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: scrollY.interpolate({
            inputRange: [0, HERO_SCROLL_DISTANCE],
            outputRange: [0, -24],
            extrapolate: 'clamp',
          }),
        },
        {
          scale: scrollY.interpolate({
            inputRange: [0, HERO_SCROLL_DISTANCE],
            outputRange: [1, 0.97],
            extrapolate: 'clamp',
          }),
        },
      ],
      opacity: scrollY.interpolate({
        inputRange: [0, HERO_SCROLL_DISTANCE],
        outputRange: [1, 0.92],
        extrapolate: 'clamp',
      }),
    }),
    [scrollY],
  );

  if (categoryQuery.isLoading || homeDashboardQuery.isLoading) {
    return <LoadingState />;
  }

  const categories = categoryQuery.data ?? [];
  const dashboard = homeDashboardQuery.data;
  const overview = dashboard?.overview;
  const recommendedQuestion = dashboard?.recommendedQuestion ?? null;
  const user = dashboard?.user ?? {
    id: '0',
    name: '同学',
    avatar: '👨‍💻',
    streakDays: 0,
    learnedCount: 0,
    favoriteCount: 0,
  };

  const learnedCount = overview?.learnedCount ?? 0;
  const favoriteCount = overview?.favoriteCount ?? 0;
  const needsReviewCount = overview?.needsReviewCount ?? 0;
  const totalQuestionCount = overview?.totalQuestionCount ?? 0;
  const learningProgress = totalQuestionCount ? Math.round((learnedCount / totalQuestionCount) * 100) : 0;
  const recentRecords = dashboard?.recentRecords ?? [];
  const recentViewed = dashboard?.recentViewed ?? [];
  const streakDays = calculateLearningStreakDays({ recentRecords, recentViewed }) || user.streakDays;
  const reviewQuestions = dashboard?.reviewQuestions ?? [];
  const questionMap = new Map((dashboard?.recentQuestions ?? []).map((question) => [question.id, question] as const));
  const recentlyViewedIds = new Set(recentViewed.map((item) => item.questionId));
  const isRefreshingHome = homeDashboardQuery.isFetching;
  const continueLearningQuestionId = recentViewed[0]?.questionId ?? reviewQuestions[0]?.id ?? recommendedQuestion?.id ?? null;
  const continueLearningTitle = continueLearningQuestionId ? questionMap.get(continueLearningQuestionId)?.title ?? '继续上次学习内容' : '当前还没有可继续的学习内容';
  const nextRecommendedQuestion =
    [recommendedQuestion, ...reviewQuestions, ...(dashboard?.recentQuestions ?? [])]
      .filter((question): question is NonNullable<typeof question> => Boolean(question))
      .find((question) => !recentlyViewedIds.has(question.id)) ?? null;
  const todayRecommendationTitle = nextRecommendedQuestion?.title ?? '当前暂无推荐题目';
  const lastPracticeLabel = recentRecords[0]?.startedAt ? formatDateTime(recentRecords[0].startedAt) : '今天还没有练习记录';
  const lastViewedLabel = recentViewed[0]?.viewedAt ? formatDateTime(recentViewed[0].viewedAt) : '还没有最近浏览';
  const progressTrackWidth = `${Math.max(learningProgress, 8)}%` as const;
  const heroAccentGradient = appColors.isDark
    ? (['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)'] as const)
    : (['rgba(255,255,255,0.34)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0)'] as const);
  const overviewCards = [
    { label: '待复习', value: `${needsReviewCount}`, description: '优先回看薄弱题目' },
    { label: '最近练习', value: `${recentRecords.length}`, description: lastPracticeLabel },
    { label: '题库分类', value: `${categories.length}`, description: `${favoriteCount} 个收藏在架` },
  ] as const;
  const digestRows = [
    { label: '继续内容', value: continueLearningTitle },
    { label: '今日推荐', value: todayRecommendationTitle },
    { label: '最近浏览', value: lastViewedLabel },
  ] as const;

  const canNavigate = () => {
    const now = Date.now();

    if (now - lastNavigationAtRef.current < NAVIGATION_THROTTLE_MS) {
      return false;
    }

    lastNavigationAtRef.current = now;
    return true;
  };

  const handleContinueLearning = () => {
    if (!continueLearningQuestionId) {
      showInfoMessage('当前还没有可继续的学习内容。');
      return;
    }

    if (!canNavigate()) {
      return;
    }

    showInfoMessage('继续上次学习。');
    router.push({ pathname: '/question/[id]', params: { id: continueLearningQuestionId, mode: 'practice' } });
  };

  const handleOpenRecommendedQuestion = () => {
    if (!nextRecommendedQuestion?.id) {
      showInfoMessage('当前暂无推荐题目。');
      return;
    }

    if (!canNavigate()) {
      return;
    }

    showInfoMessage('已打开今日推荐。');
    router.push({ pathname: '/question/[id]', params: { id: nextRecommendedQuestion.id, mode: 'practice' } });
  };

  const handleStartMockInterview = () => {
    if (!canNavigate()) {
      return;
    }

    showInfoMessage('开始今天的模拟练习。');
    router.push('/(tabs)/mock-interview');
  };

  const shimmerStyle = {
    transform: [
      {
        translateX: shimmerProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [-180, 220],
        }),
      },
      {
        rotate: '18deg',
      },
    ],
    opacity: shimmerProgress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.16, 0.34, 0.16],
    }),
  };

  return (
    <ScreenContainer>
      <Animated.ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
      >
        <FadeInSection index={0}>
          <Animated.View style={heroAnimatedStyle}>
            <LinearGradient colors={appColors.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { shadowColor: appColors.shadow }]}>
              <View style={styles.heroGrid}>
                <View style={styles.heroGridLineHorizontal} />
                <View style={styles.heroGridLineVertical} />
              </View>
              <View style={styles.heroGlow} />
              <LinearGradient colors={heroAccentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroLens} />
              <Animated.View style={[styles.heroShimmer, shimmerStyle]} />

              <View style={styles.heroTopRow}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>DAILY STUDIO</Text>
                </View>
                <View style={styles.heroStatusWrap}>
                  <Text style={styles.heroStatusText}>{isRefreshingHome ? '同步中' : '已就绪'}</Text>
                </View>
              </View>

              <View style={styles.heroHeader}>
                <View style={[styles.heroAvatarWrap, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                  <Text style={styles.heroAvatar}>{user.avatar}</Text>
                </View>
                <View style={styles.heroTitleBlock}>
                  <Text style={styles.heroEyebrow}>今天的练习台已经展开</Text>
                  <Text style={styles.heroTitle}>你好，{user.name}</Text>
                  <Text style={styles.heroTitleAccent}>把答案说得更稳，也更亮一点。</Text>
                </View>
              </View>

              <View style={styles.heroMetaRow}>
                <View style={styles.heroMetaPill}>
                  <Text style={styles.heroMetaText}>{streakDays} 天连续学习</Text>
                </View>
                <View style={styles.heroMetaPill}>
                  <Text style={styles.heroMetaText}>{favoriteCount} 个重点收藏</Text>
                </View>
                <View style={styles.heroMetaPill}>
                  <Text style={styles.heroMetaText}>{categories.length} 个分类题库</Text>
                </View>
              </View>

              <View style={styles.heroCardGrid}>
                <ScalePressable onPress={handleContinueLearning} style={[styles.heroLeadCard, { backgroundColor: 'rgba(255,255,255,0.09)', borderColor: 'rgba(255,255,255,0.12)' }]}>
                  <Text style={styles.heroCardEyebrow}>继续学习</Text>
                  <Text numberOfLines={2} style={styles.heroLeadTitle}>{continueLearningTitle}</Text>
                  <Text numberOfLines={2} style={styles.heroLeadMeta}>从上次停下的位置继续，不需要重新找题。</Text>
                  <View style={styles.heroCardAction}>
                    <Text style={styles.heroCardActionText}>马上返回</Text>
                    <Text style={styles.heroCardArrow}>→</Text>
                  </View>
                </ScalePressable>

                <View style={styles.heroSideColumn}>
                  <ScalePressable onPress={handleOpenRecommendedQuestion} style={[styles.heroMiniCard, { backgroundColor: 'rgba(14,12,30,0.18)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                    <Text style={styles.heroCardEyebrow}>今日推荐</Text>
                    <Text numberOfLines={2} style={styles.heroMiniTitle}>{todayRecommendationTitle}</Text>
                  </ScalePressable>

                  <View style={[styles.heroMiniCard, styles.heroNoteCard, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.08)' }]}>
                    <Text style={styles.heroCardEyebrow}>今日简报</Text>
                    <Text style={styles.heroNoteText}>待复习 {needsReviewCount} 题，最近浏览时间是 {lastViewedLabel}。</Text>
                  </View>
                </View>
              </View>

              <View style={styles.heroProgressShell}>
                <View style={styles.heroProgressHeader}>
                  <Text style={styles.heroProgressLabel}>学习进度</Text>
                  <Text style={styles.heroProgressPercent}>{learningProgress}%</Text>
                </View>
                <View style={styles.heroProgressTrack}>
                  <LinearGradient colors={[colors.tertiary, '#FFD76E', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.heroProgressFill, { width: progressTrackWidth }]} />
                </View>
                <View style={styles.heroStatsRow}>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{streakDays}</Text>
                    <Text style={styles.heroStatLabel}>连击天数</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{learnedCount}</Text>
                    <Text style={styles.heroStatLabel}>已学题目</Text>
                  </View>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{favoriteCount}</Text>
                    <Text style={styles.heroStatLabel}>收藏内容</Text>
                  </View>
                </View>
              </View>

              <View style={styles.heroDock}>
                <ScalePressable onPress={handleStartMockInterview} style={styles.heroDockPrimaryAction}>
                  <Text style={styles.heroDockPrimaryLabel}>开始模拟</Text>
                </ScalePressable>
                <View style={styles.heroDockCaptionWrap}>
                  <Text style={styles.heroDockCaption}>今天先把一题讲顺，再把一轮节奏走完整。</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </FadeInSection>

        <FadeInSection index={1} style={styles.sectionStack}>
          <Surface style={[styles.infoPanel, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]} elevation={0}>
            <View style={styles.infoPanelHeader}>
              <Text style={[styles.sectionEyebrow, { color: appColors.primary }]}>HOME DIGEST</Text>
              <Text style={[styles.sectionTitle, { color: appColors.text }]}>今天的学习概览</Text>
              <Text style={[styles.sectionDescription, { color: appColors.textSecondary }]}>不改功能，只把首页信息重排成更清晰的战情板。</Text>
            </View>

            <View style={styles.overviewGrid}>
              {overviewCards.map((item) => (
                <View key={item.label} style={[styles.overviewCard, { backgroundColor: appColors.surfaceMuted, borderColor: appColors.border }]}>
                  <Text style={[styles.overviewLabel, { color: appColors.textSecondary }]}>{item.label}</Text>
                  <Text style={[styles.overviewValue, { color: appColors.text }]}>{item.value}</Text>
                  <Text numberOfLines={2} style={[styles.overviewDescription, { color: appColors.textSecondary }]}>{item.description}</Text>
                </View>
              ))}
            </View>
          </Surface>

          <Surface style={[styles.digestPanel, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]} elevation={0}>
            <View style={styles.digestHeader}>
              <Text style={[styles.sectionEyebrow, { color: appColors.primary }]}>FOCUS BOARD</Text>
              <Text style={[styles.sectionTitle, { color: appColors.text }]}>当前重点</Text>
            </View>

            <View style={styles.digestList}>
              {digestRows.map((item, index) => (
                <View key={item.label} style={[styles.digestItem, index === digestRows.length - 1 ? styles.digestItemLast : null, { borderBottomColor: appColors.border }]}>
                  <Text style={[styles.digestLabel, { color: appColors.textSecondary }]}>{item.label}</Text>
                  <Text numberOfLines={2} style={[styles.digestValue, { color: appColors.text }]}>{item.value}</Text>
                </View>
              ))}
            </View>
          </Surface>
        </FadeInSection>
      </Animated.ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 120,
  },
  hero: {
    overflow: 'hidden',
    borderRadius: 34,
    padding: 24,
    gap: 18,
    minHeight: 620,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 42,
  },
  heroGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.14,
  },
  heroGridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 92,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroGridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: '28%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroGlow: {
    position: 'absolute',
    top: -28,
    right: -18,
    width: 200,
    height: 200,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroLens: {
    position: 'absolute',
    top: 110,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 999,
  },
  heroShimmer: {
    position: 'absolute',
    top: -60,
    left: 0,
    width: 120,
    height: 680,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroBadgeText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 1.6,
  },
  heroStatusWrap: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(17,12,41,0.22)',
  },
  heroStatusText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroAvatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  heroAvatar: {
    fontSize: 30,
  },
  heroTitleBlock: {
    flex: 1,
    gap: 4,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: colors.textOnPrimary,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  heroTitleAccent: {
    color: colors.textOnPrimary,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    maxWidth: 280,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroMetaPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroMetaText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  heroCardGrid: {
    gap: spacing.sm,
  },
  heroLeadCard: {
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  heroSideColumn: {
    gap: spacing.sm,
  },
  heroMiniCard: {
    borderRadius: 22,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  heroNoteCard: {
    minHeight: 96,
    justifyContent: 'center',
  },
  heroCardEyebrow: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  heroLeadTitle: {
    color: colors.textOnPrimary,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
  },
  heroMiniTitle: {
    color: colors.textOnPrimary,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
  },
  heroLeadMeta: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 280,
  },
  heroNoteText: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 14,
    lineHeight: 21,
  },
  heroCardAction: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCardActionText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  heroCardArrow: {
    color: colors.textOnPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  heroProgressShell: {
    gap: spacing.sm,
    marginTop: 2,
  },
  heroProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroProgressLabel: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    fontWeight: '700',
  },
  heroProgressPercent: {
    color: colors.textOnPrimary,
    fontWeight: '800',
    fontSize: 14,
  },
  heroProgressTrack: {
    height: PROGRESS_BAR_HEIGHT,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroProgressFill: {
    height: PROGRESS_BAR_HEIGHT,
    borderRadius: radius.pill,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  heroStat: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    gap: 4,
  },
  heroStatValue: {
    color: colors.textOnPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
  },
  heroDock: {
    marginTop: 'auto',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  heroDockPrimaryAction: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  heroDockPrimaryLabel: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '800',
  },
  heroDockCaptionWrap: {
    borderRadius: 18,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroDockCaption: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  sectionStack: {
    gap: spacing.lg,
  },
  infoPanel: {
    borderRadius: 28,
    padding: spacing.xl,
    borderWidth: 1,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    gap: spacing.lg,
  },
  infoPanelHeader: {
    gap: spacing.xs,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  sectionTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 21,
  },
  overviewGrid: {
    gap: spacing.sm,
  },
  overviewCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  overviewValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  overviewDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  digestPanel: {
    borderRadius: 28,
    padding: spacing.xl,
    borderWidth: 1,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    gap: spacing.lg,
  },
  digestHeader: {
    gap: spacing.xs,
  },
  digestList: {
    gap: spacing.sm,
  },
  digestItem: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  digestItemLast: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  digestLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  digestValue: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
});
