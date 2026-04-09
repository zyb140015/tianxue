import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { InteractionManager, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar, Button, Chip, Surface, Text } from 'react-native-paper';

import { LoadingState, ScreenContainer } from '@/components/common';
import { useTabScrollReset } from '@/hooks/use-tab-scroll-reset';
import { routes } from '@/constants/routes';
import { questionApiService as questionService } from '@/services/api/question-service';
import { statsApiService } from '@/services/api/stats-service';
import { useAuthStore } from '@/store/use-auth-store';
import { colors, spacing, useAppColors } from '@/theme';
import { formatDateTime } from '@/utils/format-date-time';
import { calculateLearningStreakDays } from '@/utils/learning-streak';

function getAvatarLabel(avatar: string | null | undefined, name: string) {
  const trimmedAvatar = avatar?.trim();
  if (trimmedAvatar && trimmedAvatar.length <= 2) {
    return trimmedAvatar;
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return '学';
  }

  return trimmedName.slice(0, 1).toUpperCase();
}

export default function ProfileScreen() {
  const appColors = useAppColors();
  const [shouldLoadScreenData, setShouldLoadScreenData] = useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const session = useAuthStore((state) => state.session);

  useTabScrollReset(scrollViewRef);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setShouldLoadScreenData(true);
    });

    return () => task.cancel();
  }, []);

  const profileDashboardQuery = useQuery({ queryKey: ['stats-profile'], queryFn: statsApiService.getProfileDashboard, enabled: shouldLoadScreenData });
  const logout = useAuthStore((state) => state.logout);

  const dashboard = profileDashboardQuery.data;
  const recentRecords = dashboard?.recentRecords ?? [];
  const recentViewed = dashboard?.recentViewed ?? [];
  const profileQuestionIds = Array.from(new Set([...recentRecords.map((record) => record.questionId), ...recentViewed.map((record) => record.questionId)]));
  const profileQuestionsQuery = useQuery({
    queryKey: ['questions-batch', 'profile', profileQuestionIds],
    queryFn: () => questionService.getQuestionsByIds(profileQuestionIds),
    enabled: shouldLoadScreenData && profileQuestionIds.length > 0,
  });

  if (profileDashboardQuery.isLoading || profileQuestionsQuery.isLoading) {
    return <LoadingState />;
  }

  const displayName = dashboard?.user.name ?? session?.userName ?? '学习用户';
  const avatarLabel = getAvatarLabel(dashboard?.user.avatar ?? session?.userAvatar, displayName);
  const questionMap = new Map(
    [...(dashboard?.recentQuestions ?? []), ...(profileQuestionsQuery.data ?? [])].map((question) => [question.id, question] as const),
  );
  const overview = dashboard?.overview;
  const streakDays = calculateLearningStreakDays({ recentRecords, recentViewed }) || (dashboard?.user.streakDays ?? 0);
  const totalQuestionCount = overview?.totalQuestionCount ?? 0;
  const learnedCount = overview?.learnedCount ?? dashboard?.user.learnedCount ?? 0;
  const needsReviewCount = overview?.needsReviewCount ?? 0;
  const averageInterviewDuration = overview?.averageInterviewDuration ?? 0;
  const learningProgress = totalQuestionCount ? Math.round((learnedCount / totalQuestionCount) * 100) : 0;

  return (
    <ScreenContainer>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={appColors.isDark ? ['#2F2850', '#433679'] : [colors.primary, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroHeader}>
            <Avatar.Text size={74} label={avatarLabel} color={appColors.primaryDark} style={styles.avatar} />
            <View style={styles.heroInfo}>
               <Text variant="headlineSmall" style={styles.name}>{displayName}</Text>
                <Text style={styles.heroMeta}>连续学习 {streakDays} 天</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStatCard}>
               <Text style={styles.heroStatValue}>{recentRecords.length}</Text>
              <Text style={styles.heroStatLabel}>模拟次数</Text>
            </View>
            <View style={styles.heroStatCard}>
               <Text style={styles.heroStatValue}>{dashboard?.user.favoriteCount ?? 0}</Text>
              <Text style={styles.heroStatLabel}>收藏题目</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{learningProgress}%</Text>
              <Text style={styles.heroStatLabel}>学习进度</Text>
            </View>
          </View>
        </LinearGradient>

        <Surface style={[styles.panel, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
          <Text variant="titleMedium" style={[styles.panelTitle, { color: appColors.text }]}>个人概览</Text>
          <View style={styles.badgeRow}>
            <Chip style={[styles.badgeChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>已学 {learnedCount} 题</Chip>
            <Chip style={[styles.badgeChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>浏览 {recentViewed.length} 条</Chip>
            <Chip style={[styles.badgeChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>待复习 {needsReviewCount} 题</Chip>
            <Chip style={[styles.badgeChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>平均时长 {averageInterviewDuration}s</Chip>
          </View>
          <View style={styles.panelActions}>
            <Button mode="outlined" textColor={appColors.primary} onPress={() => router.push(routes.favorites)}>查看我的收藏</Button>
            <Button mode="outlined" textColor={appColors.primary} onPress={() => router.push('/stats')}>查看完整统计</Button>
          </View>
        </Surface>

        <Surface style={[styles.panel, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
          <Text variant="titleMedium" style={[styles.panelTitle, { color: appColors.text }]}>最近练习</Text>
          {recentRecords.length ? (
            recentRecords.map((record, index) => (
              <Pressable key={record.id} onPress={() => router.push({ pathname: '/question/[id]', params: { id: record.questionId } })} style={[styles.recordItem, index === recentRecords.length - 1 ? styles.lastItem : null]}>
                <View style={styles.recordMain}>
                  <Text numberOfLines={2} style={[styles.recordTitle, { color: appColors.text }]}>{questionMap.get(record.questionId)?.title ?? record.questionId}</Text>
                  <Text style={[styles.recordMeta, { color: appColors.textSecondary }]}>{formatDateTime(record.startedAt)}</Text>
                  <View style={styles.recordTagRow}>
                    <Chip compact style={[styles.recordChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>{questionMap.get(record.questionId)?.category ?? '未知分类'}</Chip>
                    <Chip compact style={[styles.recordChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>{questionMap.get(record.questionId)?.difficulty ?? 'unknown'}</Chip>
                  </View>
                </View>
                <View style={[styles.recordDurationPill, { backgroundColor: appColors.primarySoft }]}>
                  <Text style={[styles.recordDuration, { color: appColors.primaryDark }]}>{record.duration}s</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>你还没有开始模拟面试，去练一轮吧。</Text>
          )}
        </Surface>

        <Surface style={[styles.panel, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
          <Text variant="titleMedium" style={[styles.panelTitle, { color: appColors.text }]}>最近浏览</Text>
          {recentViewed.length ? (
            recentViewed.map((record, index) => (
              <Pressable key={record.id} onPress={() => router.push({ pathname: '/question/[id]', params: { id: record.questionId } })} style={[styles.recordItem, index === recentViewed.length - 1 ? styles.lastItem : null]}>
                <View style={styles.recordMain}>
                  <Text style={[styles.recordTitle, { color: appColors.text }]}>{questionMap.get(record.questionId)?.title ?? record.questionId}</Text>
                  <Text style={[styles.recordMeta, { color: appColors.textSecondary }]}>{formatDateTime(record.viewedAt)}</Text>
                </View>
                <Chip compact style={[styles.recordChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>{questionMap.get(record.questionId)?.category ?? '未知分类'}</Chip>
              </Pressable>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>你还没有浏览记录，去题库看看吧。</Text>
          )}
        </Surface>

        <View style={styles.actions}>
          <Button mode="contained" buttonColor={appColors.primary} onPress={() => router.push('/settings')}>进入设置</Button>
          <Button mode="outlined" textColor={appColors.primary} onPress={async () => {
            await logout();
            router.replace('/(auth)/welcome');
          }}>
            退出登录
          </Button>
        </View>
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
    gap: spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  heroInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.textOnPrimary,
    fontWeight: '800',
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.8)',
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: 22,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.14)',
    gap: spacing.xs,
  },
  heroStatValue: {
    color: colors.textOnPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
  },
  panel: {
    borderRadius: 28,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  panelTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badgeChip: {
    backgroundColor: colors.primarySoft,
  },
  panelActions: {
    gap: spacing.sm,
  },
  recordItem: {
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
  recordMain: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  recordTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  recordMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  recordTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  recordChip: {
    backgroundColor: colors.primarySoft,
  },
  recordDurationPill: {
    flexShrink: 0,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primarySoft,
  },
  recordDuration: {
    color: colors.primaryDark,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.md,
  },
});
