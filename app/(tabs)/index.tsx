import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Animated, Easing, InteractionManager, Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ScrollView as RNScrollView } from 'react-native';
import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar, Button, Chip, Surface, Text } from 'react-native-paper';

import { LoadingState, ScreenContainer } from '@/components/common';
import { useTabScrollReset } from '@/hooks/use-tab-scroll-reset';
import { questionApiService as questionService } from '@/services/api/question-service';
import { statsApiService } from '@/services/api/stats-service';
import { colors, spacing, useAppColors } from '@/theme';
import { formatDateTime } from '@/utils/format-date-time';
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

function HomeSectionSkeleton({ appColors }: { appColors: ReturnType<typeof useAppColors> }) {
  return (
    <Surface style={[styles.panelCard, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
      <View style={[styles.skeletonLineLong, { backgroundColor: appColors.surfaceMuted }]} />
      <View style={[styles.skeletonLineShort, { backgroundColor: appColors.surfaceMuted }]} />
      <View style={[styles.skeletonListItem, { backgroundColor: appColors.primarySoft }]} />
      <View style={[styles.skeletonListItem, { backgroundColor: appColors.primarySoft }]} />
    </Surface>
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
  const reviewQuestions = dashboard?.reviewQuestions ?? [];
  const questionMap = new Map(
    (dashboard?.recentQuestions ?? [])
      .map((question) => [question.id, question] as const),
  );
  const isRefreshingHome = homeDashboardQuery.isFetching;
  const continueLearningQuestionId = recentViewed[0]?.questionId ?? reviewQuestions[0]?.id ?? recommendedQuestion?.id ?? null;
  const continueLearningTitle = continueLearningQuestionId ? questionMap.get(continueLearningQuestionId)?.title ?? '继续上次学习内容' : '当前还没有可继续的学习内容';
  const todayRecommendationTitle = recommendedQuestion?.title ?? '当前暂无推荐题目';
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
    if (!recommendedQuestion?.id) {
      showInfoMessage('当前暂无推荐题目。');
      return;
    }

    if (!canNavigate()) {
      return;
    }

    showInfoMessage('已打开今日推荐。');
    router.push({ pathname: '/question/[id]', params: { id: recommendedQuestion.id, mode: 'practice' } });
  };

  const handleStartMockInterview = () => {
    if (!canNavigate()) {
      return;
    }

    showInfoMessage('开始今天的模拟练习。');
    router.push('/(tabs)/mock-interview');
  };

  const progressTrackWidth = `${Math.max(learningProgress, 8)}%` as const;
  const shimmerStyle = {
    transform: [
      {
        translateX: shimmerProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [-180, 180],
        }),
      },
      {
        rotate: '18deg',
      },
    ],
    opacity: shimmerProgress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.18, 0.36, 0.18],
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
            <LinearGradient colors={appColors.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
              <View style={styles.heroGrid}>
                <View style={styles.heroGridLineHorizontal} />
                <View style={styles.heroGridLineVertical} />
              </View>
              <View style={styles.heroGlow} />
              <Animated.View style={[styles.heroShimmer, shimmerStyle]} />

              <View style={styles.heroTopRow}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>INTERVIEW OS</Text>
                </View>
              </View>

              <View style={styles.heroMainRow}>
                <View style={styles.heroContentColumn}>
                  <View style={styles.heroTextBlock}>
                    <Text variant="headlineMedium" style={styles.heroTitle}>你好，{user.name}</Text>
                    <Text style={styles.heroTitleAccent}>让表达发光。</Text>
                    <Text variant="bodyLarge" style={styles.heroSubtitle}>今天，先拿下一道题。</Text>
                  </View>

                  <View style={styles.heroMetaRow}>
                    <View style={styles.heroMetaPill}>
                      <Text style={styles.heroMetaText}>{user.streakDays} 天连击</Text>
                    </View>
                    <View style={styles.heroMetaPill}>
                      <Text style={styles.heroMetaText}>{favoriteCount} 个收藏</Text>
                    </View>
                    <View style={styles.heroMetaPill}>
                      <Text style={styles.heroMetaText}>{learningProgress}% 进度</Text>
                    </View>
                  </View>

                  <ScalePressable onPress={handleContinueLearning} style={styles.heroCtaCard}>
                    <View style={styles.heroCtaRow}>
                      <View style={styles.heroCtaTextWrap}>
                        <Text style={styles.heroCtaEyebrow}>继续学习</Text>
                        <Text numberOfLines={2} style={styles.heroCtaDescription}>{continueLearningTitle}</Text>
                      </View>
                      <View style={styles.heroCtaArrowWrap}>
                        <Text style={styles.heroCtaArrow}>→</Text>
                      </View>
                    </View>
                  </ScalePressable>
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
              </View>

              <View style={styles.heroStatsRow}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{user.streakDays}</Text>
                  <Text style={styles.heroStatLabel}>连击</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{learnedCount}</Text>
                  <Text style={styles.heroStatLabel}>已学</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{favoriteCount}</Text>
                  <Text style={styles.heroStatLabel}>收藏</Text>
                </View>
              </View>

              <View style={styles.heroDock}>
                <ScalePressable onPress={handleOpenRecommendedQuestion} style={styles.heroDockPrimaryAction}>
                  <Text style={styles.heroDockPrimaryLabel}>今日推荐</Text>
                </ScalePressable>
                <ScalePressable onPress={handleStartMockInterview} style={styles.heroDockSecondaryAction}>
                  <Text style={styles.heroDockSecondaryLabel}>开始模拟</Text>
                </ScalePressable>
              </View>
            </LinearGradient>
          </Animated.View>
        </FadeInSection>

      </Animated.ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 120,
  },
  hero: {
    overflow: 'hidden',
    borderRadius: 36,
    padding: 28,
    gap: 22,
    minHeight: 540,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 40,
  },
  heroGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.14,
  },
  heroGridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 104,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heroGridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '62%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroGlow: {
    position: 'absolute',
    top: -24,
    right: -12,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heroTopRow: {
    alignItems: 'flex-start',
  },
  heroBadge: {
    borderRadius: 999,
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
  heroShimmer: {
    position: 'absolute',
    top: -40,
    left: 0,
    width: 140,
    height: 520,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroMainRow: {
    flexDirection: 'column',
  },
  heroContentColumn: {
    gap: 24,
  },
  heroTextBlock: {
    gap: 8,
  },
  heroTitle: {
    color: colors.textOnPrimary,
    fontWeight: '800',
    fontSize: 48,
    lineHeight: 54,
    letterSpacing: -1,
  },
  heroTitleAccent: {
    color: colors.textOnPrimary,
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800',
    letterSpacing: -0.9,
    maxWidth: 520,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 300,
    marginTop: 10,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroMetaPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroMetaText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  heroCtaCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroCtaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  heroCtaTextWrap: {
    flex: 1,
  },
  heroCtaEyebrow: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '700',
  },
  heroCtaArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  heroCtaArrow: {
    color: colors.textOnPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  heroCtaDescription: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
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
  },
  heroProgressTrack: {
    height: PROGRESS_BAR_HEIGHT,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroProgressFill: {
    height: PROGRESS_BAR_HEIGHT,
    borderRadius: 999,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  heroStat: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 2,
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
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 14,
  },
  heroDockPrimaryAction: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  heroDockPrimaryLabel: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '700',
  },
  heroDockSecondaryAction: {
    minWidth: 116,
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroDockSecondaryLabel: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  featureCard: {
    borderRadius: 32,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  featureAura: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  featureCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  featureHeading: {
    flex: 1,
    gap: spacing.xs,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  featureTitle: {
    color: colors.text,
    fontWeight: '800',
    lineHeight: 32,
  },
  progressBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.tertiarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: {
    color: colors.tertiary,
    fontWeight: '800',
    fontSize: 18,
  },
  featureDescription: {
    color: colors.textSecondary,
    lineHeight: 22,
    maxHeight: 88,
  },
  featureFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureDataStrip: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  featureDataItem: {
    flex: 1,
    borderRadius: 18,
    padding: spacing.md,
    backgroundColor: 'rgba(108,92,231,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(108,92,231,0.08)',
    gap: 2,
  },
  featureDataValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  featureDataLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  softChip: {
    backgroundColor: colors.primarySoft,
  },
  softChipText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    lineHeight: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  categoryCardPressable: {
    width: '48%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  categoryCard: {
    width: '100%',
    minHeight: 156,
    borderRadius: 28,
    padding: spacing.lg,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
  },
  categoryCount: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryName: {
    color: colors.text,
    fontWeight: '800',
    lineHeight: 24,
  },
  categoryMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  panelCard: {
    borderRadius: 30,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    gap: spacing.md,
    borderWidth: 1,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
  },
  quickActionsCard: {
    borderRadius: 30,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.md,
  },
  quickActionPrimary: {
    borderRadius: 28,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    minHeight: 120,
    overflow: 'hidden',
  },
  quickActionItem: {
    flex: 1,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    minHeight: 132,
    overflow: 'hidden',
  },
  quickActionSignal: {
    position: 'absolute',
    top: -14,
    right: -18,
    width: 84,
    height: 84,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.36)',
  },
  quickActionKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  quickActionPrimaryDescription: {
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  quickActionDescription: {
    lineHeight: 22,
    marginTop: 'auto',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRadius: 20,
  },
  lastListItem: {
    paddingBottom: 0,
    marginBottom: 0,
    borderBottomWidth: 0,
  },
  listItemLeading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  listIndexBubble: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  listIndexText: {
    color: colors.primary,
    fontWeight: '800',
  },
  listTextWrap: {
    flex: 1,
    gap: 2,
  },
  listTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  listMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  listBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primarySoft,
  },
  listBadgeText: {
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 12,
  },
  reviewChip: {
    backgroundColor: colors.tertiarySoft,
  },
  reviewChipText: {
    color: colors.danger,
    fontWeight: '700',
  },
  smallAvatar: {
    backgroundColor: colors.primarySoft,
  },
  emptyText: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  skeletonLineLong: {
    width: '72%',
    height: 18,
    borderRadius: 10,
  },
  skeletonLineShort: {
    width: '42%',
    height: 14,
    borderRadius: 8,
  },
  skeletonListItem: {
    height: 56,
    borderRadius: 18,
  },
});
