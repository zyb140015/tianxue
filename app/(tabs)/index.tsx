import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Avatar, Button, Chip, Surface, Text } from 'react-native-paper';

import { EmptyState, LoadingState, ScreenContainer } from '@/components/common';
import { emptyStateCopy } from '@/constants/empty-state-copy';
import { mockInterviewService } from '@/services/mock/mock-interview-service';
import { questionService } from '@/services/mock/question-service';
import { recentViewedService } from '@/services/mock/recent-viewed-service';
import { userService } from '@/services/mock/user-service';
import { colors, spacing, useAppColors } from '@/theme';
import { formatDateTime } from '@/utils/format-date-time';
import { showInfoMessage } from '@/utils/feedback';

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
  const userQuery = useQuery({ queryKey: ['user'], queryFn: userService.getCurrentUser });
  const questionQuery = useQuery({ queryKey: ['recommended-question'], queryFn: questionService.getRecommendedQuestion });
  const categoryQuery = useQuery({ queryKey: ['categories'], queryFn: questionService.getCategories });
  const allQuestionsQuery = useQuery({ queryKey: ['questions', 'home-summary'], queryFn: () => questionService.getQuestions() });
  const recordsQuery = useQuery({ queryKey: ['mock-interview-records'], queryFn: mockInterviewService.getRecords });
  const recentViewedQuery = useQuery({ queryKey: ['recent-viewed-questions'], queryFn: recentViewedService.getRecords });

  if (userQuery.isLoading || questionQuery.isLoading || categoryQuery.isLoading || allQuestionsQuery.isLoading || recordsQuery.isLoading || recentViewedQuery.isLoading) {
    return <LoadingState />;
  }

  if (userQuery.isError || questionQuery.isError || categoryQuery.isError || allQuestionsQuery.isError || recordsQuery.isError || recentViewedQuery.isError) {
    return <EmptyState title={emptyStateCopy.homeLoadFailed.title} description={emptyStateCopy.homeLoadFailed.description} />;
  }

  const learnedCount = allQuestionsQuery.data?.filter((question) => question.isLearned).length ?? 0;
  const favoriteCount = allQuestionsQuery.data?.filter((question) => question.isFavorite).length ?? 0;
  const needsReviewCount = allQuestionsQuery.data?.filter((question) => question.needsReview).length ?? 0;
  const totalQuestionCount = allQuestionsQuery.data?.length ?? 0;
  const learningProgress = totalQuestionCount ? Math.round((learnedCount / totalQuestionCount) * 100) : 0;
  const recentRecords = recordsQuery.data?.slice(0, 2) ?? [];
  const recentViewed = recentViewedQuery.data?.slice(0, 2) ?? [];
  const reviewQuestions = (allQuestionsQuery.data ?? []).filter((question) => question.needsReview).slice(0, 2);
  const questionMap = new Map((allQuestionsQuery.data ?? []).map((question) => [question.id, question]));
  const isRefreshingHome = questionQuery.isFetching || recordsQuery.isFetching || recentViewedQuery.isFetching;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={appColors.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>今日冲刺</Text>
            </View>
            <Avatar.Text size={50} label="Q" color={appColors.primaryDark} style={styles.heroAvatar} />
          </View>

          <View style={styles.heroTextBlock}>
            <Text variant="headlineMedium" style={styles.heroTitle}>你好，{userQuery.data?.name}</Text>
            <Text variant="bodyLarge" style={styles.heroSubtitle}>
              今天先刷高频题，再来一轮模拟，让学习过程更有节奏。
            </Text>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{userQuery.data?.streakDays ?? 0}</Text>
              <Text style={styles.heroStatLabel}>连续天数</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{learnedCount}</Text>
              <Text style={styles.heroStatLabel}>已学题目</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{favoriteCount}</Text>
              <Text style={styles.heroStatLabel}>收藏题目</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{needsReviewCount}</Text>
              <Text style={styles.heroStatLabel}>未掌握</Text>
            </View>
          </View>
        </LinearGradient>

        <Animated.View entering={FadeIn.duration(160)}>
        <Surface style={[styles.featureCard, { backgroundColor: appColors.surface, shadowColor: appColors.shadow, borderColor: appColors.border }]} elevation={0}>
          <View style={styles.sectionRow}>
            <View>
              <Text style={[styles.sectionEyebrow, { color: appColors.primary }]}>Featured Quiz</Text>
              <Text variant="titleLarge" style={[styles.featureTitle, { color: appColors.text }]}>{questionQuery.data?.title}</Text>
            </View>
            <View style={[styles.progressBadge, { backgroundColor: appColors.tertiarySoft }]}>
              <Text style={[styles.progressValue, { color: appColors.tertiary }]}>{learningProgress}%</Text>
            </View>
          </View>
          <Text style={[styles.featureDescription, { color: appColors.textSecondary }]}>{questionQuery.data?.content}</Text>
          <View style={styles.featureFooter}>
            <Chip compact style={[styles.softChip, { backgroundColor: appColors.primarySoft }]} textStyle={[styles.softChipText, { color: appColors.primaryDark }]}>推荐路线</Chip>
            <Button mode="contained" buttonColor={appColors.primary} onPress={() => {
              showInfoMessage('已打开推荐题目。');
              router.push({ pathname: '/question/[id]', params: { id: questionQuery.data?.id ?? '' } });
            }}>
              开始学习
            </Button>
          </View>
        </Surface>
        </Animated.View>

        <View style={styles.sectionRow}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: appColors.text }]}>专题分类</Text>
          <Button compact mode="text" textColor={appColors.primary} onPress={() => router.push('/(tabs)/question-bank')}>
            去题库
          </Button>
        </View>

        <View style={styles.categoryGrid}>
          {categoryQuery.data?.slice(0, 4).map((category, index) => (
            <LinearGradient
              key={category.id}
              colors={appColors.isDark ? (index % 2 === 0 ? ['#35305A', '#40386A'] : ['#312B4F', '#3A345C']) : (index % 2 === 0 ? [colors.primarySoft, '#E8E2FF'] : [colors.surfaceStrong, '#E6E0FF'])}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.categoryCard}>
              <Text style={[styles.categoryCount, { color: appColors.textSecondary }]}>{String(index + 1).padStart(2, '0')}</Text>
              <Text variant="titleMedium" style={[styles.categoryName, { color: appColors.text }]}>{category.name}</Text>
              <Text style={[styles.categoryMeta, { color: appColors.textSecondary }]}>适合整理知识地图</Text>
            </LinearGradient>
          ))}
        </View>

        {isRefreshingHome ? <HomeSectionSkeleton appColors={appColors} /> : <Surface style={[styles.panelCard, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]} elevation={0}>
          <View style={styles.sectionRow}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: appColors.text }]}>待复习</Text>
            <Button compact mode="text" textColor={appColors.primary} onPress={() => router.push('/(tabs)/question-bank')}>
              去题库
            </Button>
          </View>
          {reviewQuestions.length ? (
            reviewQuestions.map((question, index) => (
              <Pressable key={question.id} onPress={() => router.push({ pathname: '/question/[id]', params: { id: question.id } })}>
                <View style={[styles.listItem, index === reviewQuestions.length - 1 ? styles.lastListItem : null]}>
                  <View style={styles.listItemLeading}>
                    <View style={[styles.listIndexBubble, { backgroundColor: appColors.primarySoft }]}>
                      <Text style={[styles.listIndexText, { color: appColors.primary }]}>{index + 1}</Text>
                    </View>
                    <View style={styles.listTextWrap}>
                      <Text style={[styles.listTitle, { color: appColors.text }]}>{question.title}</Text>
                      <Text style={[styles.listMeta, { color: appColors.textSecondary }]}>{question.category} · {question.difficulty}</Text>
                    </View>
                  </View>
                  <Chip compact style={[styles.reviewChip, { backgroundColor: appColors.tertiarySoft }]} textStyle={styles.reviewChipText}>未掌握</Chip>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>当前没有待复习题目，继续保持这个节奏。</Text>
          )}
        </Surface>}

        {isRefreshingHome ? <HomeSectionSkeleton appColors={appColors} /> : <Surface style={[styles.panelCard, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]} elevation={0}>
          <View style={styles.sectionRow}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: appColors.text }]}>最近练习</Text>
            <Button compact mode="text" textColor={appColors.primary} onPress={() => router.push('/(tabs)/mock-interview')}>
              查看更多
            </Button>
          </View>
          {recentRecords.length ? (
            recentRecords.map((record, index) => (
              <Pressable key={record.id} onPress={() => router.push({ pathname: '/question/[id]', params: { id: record.questionId } })}>
                <View style={[styles.listItem, index === recentRecords.length - 1 ? styles.lastListItem : null]}>
                  <View style={styles.listItemLeading}>
                    <View style={[styles.listIndexBubble, { backgroundColor: appColors.primarySoft }]}>
                      <Text style={[styles.listIndexText, { color: appColors.primary }]}>{index + 1}</Text>
                    </View>
                    <View style={styles.listTextWrap}>
                      <Text style={[styles.listTitle, { color: appColors.text }]}>{questionMap.get(record.questionId)?.title ?? record.questionId}</Text>
                      <Text style={[styles.listMeta, { color: appColors.textSecondary }]}>{formatDateTime(record.startedAt)}</Text>
                    </View>
                  </View>
                  <View style={[styles.listBadge, { backgroundColor: appColors.primarySoft }]}>
                    <Text style={[styles.listBadgeText, { color: appColors.primaryDark }]}>{record.duration}s</Text>
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>你还没有模拟记录，先来一轮让主页数据活起来。</Text>
          )}
        </Surface>}

        <Surface style={[styles.panelCard, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]} elevation={0}>
          <View style={styles.sectionRow}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: appColors.text }]}>最近浏览</Text>
            <Button compact mode="text" textColor={appColors.primary} onPress={() => router.push('/stats')}>
              查看统计
            </Button>
          </View>
          {recentViewed.length ? (
            recentViewed.map((record, index) => (
              <Pressable key={record.id} onPress={() => router.push({ pathname: '/question/[id]', params: { id: record.questionId } })}>
                <View style={[styles.listItem, index === recentViewed.length - 1 ? styles.lastListItem : null]}>
                  <View style={styles.listItemLeading}>
                    <Avatar.Text size={40} label={String(index + 1)} color={appColors.primary} style={[styles.smallAvatar, { backgroundColor: appColors.primarySoft }]} />
                    <View style={styles.listTextWrap}>
                      <Text style={[styles.listTitle, { color: appColors.text }]}>{questionMap.get(record.questionId)?.title ?? record.questionId}</Text>
                      <Text style={[styles.listMeta, { color: appColors.textSecondary }]}>{formatDateTime(record.viewedAt)}</Text>
                    </View>
                  </View>
                  <Chip compact style={[styles.softChip, { backgroundColor: appColors.primarySoft }]} textStyle={[styles.softChipText, { color: appColors.primaryDark }]}>
                    {questionMap.get(record.questionId)?.category ?? '未分类'}
                  </Chip>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>你还没有浏览记录，去挑一道题开场吧。</Text>
          )}
        </Surface>

        <Surface style={[styles.panelCard, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]} elevation={0}>
          <View style={styles.sectionRow}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: appColors.text }]}>学习统计</Text>
            <Button compact mode="text" textColor={appColors.primary} onPress={() => router.push('/stats')}>
              查看全部
            </Button>
          </View>
          <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>已完成 {learningProgress}% · 共 {totalQuestionCount} 题 · 收藏 {favoriteCount} 题 · 未掌握 {needsReviewCount} 题。去统计页查看完整练习与浏览历史。</Text>
        </Surface>
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
    gap: spacing.lg,
    minHeight: 260,
  },
  heroGlow: {
    position: 'absolute',
    top: -32,
    right: -24,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBadge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroBadgeText: {
    color: colors.textOnPrimary,
    fontWeight: '700',
  },
  heroAvatar: {
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  heroTextBlock: {
    gap: spacing.sm,
  },
  heroTitle: {
    color: colors.textOnPrimary,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.86)',
    lineHeight: 24,
    maxWidth: 280,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroStat: {
    flex: 1,
    borderRadius: 22,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.16)',
    gap: spacing.xs,
  },
  heroStatValue: {
    color: colors.textOnPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  featureCard: {
    borderRadius: 28,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    borderWidth: 1,
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
    textTransform: 'uppercase',
  },
  featureTitle: {
    color: colors.text,
    fontWeight: '800',
    marginTop: 4,
  },
  progressBadge: {
    width: 58,
    height: 58,
    borderRadius: 18,
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
  },
  featureFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
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
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCard: {
    width: '47%',
    minHeight: 132,
    borderRadius: 24,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  categoryCount: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryName: {
    color: colors.text,
    fontWeight: '800',
  },
  categoryMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  panelCard: {
    borderRadius: 28,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    gap: spacing.md,
    borderWidth: 1,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
