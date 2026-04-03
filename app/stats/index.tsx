import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { InteractionManager, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import { Button, Card, Chip, IconButton, ProgressBar, Surface, Text } from 'react-native-paper';

import { EmptyState, LoadingState, ScreenContainer } from '@/components/common';
import { emptyStateCopy } from '@/constants/empty-state-copy';
import { historyApiService } from '@/services/api/history-service';
import { questionApiService as questionService } from '@/services/api/question-service';
import { statsApiService } from '@/services/api/stats-service';
import { colors, spacing, useAppColors } from '@/theme';
import { formatDateTime } from '@/utils/format-date-time';
import { showErrorMessage, showSuccessMessage } from '@/utils/feedback';

const MAX_VISIBLE_HISTORY_RECORDS = 10;

function StatsPanelSkeleton({ appColors }: { appColors: ReturnType<typeof useAppColors> }) {
  return (
    <Card mode="contained" style={[styles.panel, { backgroundColor: appColors.surface, borderColor: appColors.border }]}>
      <Card.Content style={styles.panelContent}>
        <View style={[styles.skeletonTitle, { backgroundColor: appColors.surfaceMuted }]} />
        <View style={[styles.skeletonRow, { backgroundColor: appColors.primarySoft }]} />
        <View style={[styles.skeletonRow, { backgroundColor: appColors.primarySoft }]} />
      </Card.Content>
    </Card>
  );
}

export default function StatsScreen() {
  const appColors = useAppColors();
  const queryClient = useQueryClient();
  const [shouldLoadScreenData, setShouldLoadScreenData] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setShouldLoadScreenData(true);
    });

    return () => task.cancel();
  }, []);

  const recordsQuery = useQuery({ queryKey: ['mock-interview-records'], queryFn: historyApiService.getInterviewRecords, enabled: shouldLoadScreenData });
  const recentViewedQuery = useQuery({ queryKey: ['recent-viewed-questions'], queryFn: historyApiService.getViewedRecords, enabled: shouldLoadScreenData });
  const overviewQuery = useQuery({ queryKey: ['stats-overview'], queryFn: statsApiService.getOverview, enabled: shouldLoadScreenData });
  const categoryProgressQuery = useQuery({ queryKey: ['stats-categories'], queryFn: statsApiService.getCategories, enabled: shouldLoadScreenData });
  const recordQuestionIds = recordsQuery.data?.map((record) => record.questionId) ?? [];
  const viewedQuestionIds = recentViewedQuery.data?.map((record) => record.questionId) ?? [];
  const questionIds = Array.from(new Set([...recordQuestionIds, ...viewedQuestionIds]));
  const questionsQuery = useQuery({
    queryKey: ['questions-batch', 'stats', questionIds],
    queryFn: () => questionService.getQuestionsByIds(questionIds),
    enabled: shouldLoadScreenData && questionIds.length > 0,
  });
  const clearRecordsMutation = useMutation({
    mutationFn: historyApiService.clearInterviewRecords,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mock-interview-records'] }),
        queryClient.invalidateQueries({ queryKey: ['profile-user'] }),
        queryClient.invalidateQueries({ queryKey: ['user'] }),
      ]);
      showSuccessMessage('练习记录已清空。');
    },
    onError: () => showErrorMessage('清空练习记录失败，请稍后重试。'),
  });
  const clearViewedMutation = useMutation({
    mutationFn: historyApiService.clearViewedRecords,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['recent-viewed-questions'] });
      showSuccessMessage('浏览记录已清空。');
    },
    onError: () => showErrorMessage('清空浏览记录失败，请稍后重试。'),
  });
  const deleteRecordMutation = useMutation({
    mutationFn: (id: string) => historyApiService.deleteInterviewRecord(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['mock-interview-records'] }),
        queryClient.invalidateQueries({ queryKey: ['profile-user'] }),
        queryClient.invalidateQueries({ queryKey: ['user'] }),
      ]);
      showSuccessMessage('练习记录已删除。');
    },
    onError: () => showErrorMessage('删除练习记录失败，请稍后重试。'),
  });
  const deleteViewedMutation = useMutation({
    mutationFn: (id: string) => historyApiService.deleteViewedRecord(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['recent-viewed-questions'] });
      showSuccessMessage('浏览记录已删除。');
    },
    onError: () => showErrorMessage('删除浏览记录失败，请稍后重试。'),
  });

  if (recordsQuery.isLoading || recentViewedQuery.isLoading || overviewQuery.isLoading || categoryProgressQuery.isLoading || questionsQuery.isLoading) {
    return <LoadingState />;
  }

  if (questionsQuery.isError || recordsQuery.isError || recentViewedQuery.isError || overviewQuery.isError || categoryProgressQuery.isError) {
    return <EmptyState title={emptyStateCopy.statsLoadFailed.title} description={emptyStateCopy.statsLoadFailed.description} />;
  }

  const questions = questionsQuery.data ?? [];
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const visibleInterviewRecords = (recordsQuery.data ?? []).slice(0, MAX_VISIBLE_HISTORY_RECORDS);
  const visibleViewedRecords = (recentViewedQuery.data ?? []).slice(0, MAX_VISIBLE_HISTORY_RECORDS);
  const learnedCount = overviewQuery.data?.learnedCount ?? 0;
  const favoriteCount = overviewQuery.data?.favoriteCount ?? 0;
  const needsReviewCount = overviewQuery.data?.needsReviewCount ?? 0;
  const totalQuestionCount = overviewQuery.data?.totalQuestionCount ?? 0;
  const progress = totalQuestionCount ? Math.round((learnedCount / totalQuestionCount) * 100) : 0;
  const averageDuration = overviewQuery.data?.averageInterviewDuration ?? 0;
  const categoryProgressList = categoryProgressQuery.data ?? [];
  const isRefreshingSummary = questionsQuery.isFetching || overviewQuery.isFetching || categoryProgressQuery.isFetching;
  const isRefreshingInterviewRecords = recordsQuery.isFetching;
  const isRefreshingViewedRecords = recentViewedQuery.isFetching;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Surface style={[styles.hero, { backgroundColor: appColors.surfaceStrong, borderColor: appColors.border, shadowColor: appColors.shadow }]} elevation={0}>
          <Text variant="headlineSmall" style={[styles.heroTitle, { color: appColors.text }]}>学习统计</Text>
          <Text variant="bodyMedium" style={[styles.heroSubtitle, { color: appColors.textSecondary }]}>用数据回看学习进度、练习频率和浏览痕迹，帮助你决定下一步该补哪类题。</Text>
          <View style={styles.progressBlock}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: appColors.text }]}>学习完成度</Text>
              <Text style={[styles.progressNumber, { color: appColors.primary }]}>{progress}%</Text>
            </View>
            <ProgressBar progress={progress / 100} color={appColors.primary} style={[styles.progressBar, { backgroundColor: appColors.surfaceMuted }]} />
          </View>
          <View style={styles.heroChips}>
            <Chip style={[styles.heroChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>进度 {progress}%</Chip>
            <Chip style={[styles.heroChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>练习 {recordsQuery.data?.length ?? 0} 次</Chip>
            <Chip style={[styles.heroChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>浏览 {recentViewedQuery.data?.length ?? 0} 条</Chip>
            <Chip style={[styles.heroChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>未掌握 {needsReviewCount} 题</Chip>
          </View>
        </Surface>

        <View style={styles.metricsGrid}>
          <Card mode="contained" style={[styles.metricCard, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]} onPress={() => router.push('/(tabs)/question-bank')}>
            <Card.Content>
              <Text style={[styles.metricValue, { color: appColors.text }]}>{learnedCount}</Text>
              <Text style={[styles.metricLabel, { color: appColors.textSecondary }]}>已学题目</Text>
            </Card.Content>
          </Card>
          <Card mode="contained" style={[styles.metricCard, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]} onPress={() => router.push('/(tabs)/favorites')}>
            <Card.Content>
              <Text style={[styles.metricValue, { color: appColors.text }]}>{favoriteCount}</Text>
              <Text style={[styles.metricLabel, { color: appColors.textSecondary }]}>收藏题目</Text>
            </Card.Content>
          </Card>
          <Card
            mode="contained"
            style={[styles.metricCard, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/question-bank',
                params: {
                  needsReview: 'true',
                },
              })
            }>
            <Card.Content>
              <Text style={[styles.metricValue, { color: appColors.text }]}>{needsReviewCount}</Text>
              <Text style={[styles.metricLabel, { color: appColors.textSecondary }]}>未掌握题目</Text>
            </Card.Content>
          </Card>
          <Card mode="contained" style={[styles.metricCard, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]} onPress={() => router.push('/(tabs)/mock-interview')}>
            <Card.Content>
              <Text style={[styles.metricValue, { color: appColors.text }]}>{averageDuration}s</Text>
              <Text style={[styles.metricLabel, { color: appColors.textSecondary }]}>平均练习时长</Text>
            </Card.Content>
          </Card>
        </View>

        {isRefreshingSummary ? <StatsPanelSkeleton appColors={appColors} /> : <View><Card mode="contained" style={[styles.panel, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]}>
          <Card.Content style={styles.panelContent}>
            <View style={styles.panelHeader}>
              <Text variant="titleMedium" style={[styles.panelTitle, { color: appColors.text }]}>按分类掌握度</Text>
              <Chip compact style={[styles.heroChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>共 {categoryProgressList.length} 类</Chip>
            </View>
            {categoryProgressList.map((item) => (
              <Pressable
                key={item.category}
                style={styles.categoryProgressItem}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/question-bank',
                    params: {
                      category: item.category,
                      needsReview: item.review > 0 ? 'true' : 'false',
                    },
                  })
                }>
                <View style={styles.categoryProgressHeader}>
                  <Text style={[styles.rowTitle, { color: appColors.text }]}>{item.category}</Text>
                  <Text style={[styles.rowMeta, { color: appColors.textSecondary }]}>{item.learned}/{item.total} · 未掌握 {item.review}</Text>
                </View>
                <ProgressBar progress={item.progress / 100} color={appColors.primary} style={[styles.progressBar, { backgroundColor: appColors.surfaceMuted }]} />
              </Pressable>
            ))}
          </Card.Content>
        </Card></View>}

        {isRefreshingInterviewRecords ? <StatsPanelSkeleton appColors={appColors} /> : <View><Card mode="contained" style={[styles.panel, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]}>
          <Card.Content style={styles.panelContent}>
            <View style={styles.panelHeader}>
              <Text variant="titleMedium" style={[styles.panelTitle, { color: appColors.text }]}>完整练习记录（共 {recordsQuery.data?.length ?? 0} 条）</Text>
              <View style={styles.panelActions}>
                <Button compact mode="text" textColor={appColors.primary} onPress={() => router.push('/(tabs)/mock-interview')}>去模拟</Button>
                <Button compact mode="text" textColor={colors.danger} onPress={() => clearRecordsMutation.mutate()} disabled={clearRecordsMutation.isPending}>清空</Button>
              </View>
            </View>
            {visibleInterviewRecords.length ? (
              <>
                {visibleInterviewRecords.map((record) => (
                  <View key={record.id} style={styles.rowItem}>
                    <View style={styles.rowTextWrap}>
                      <Text style={[styles.rowTitle, { color: appColors.text }]}>{questionMap.get(record.questionId)?.title ?? record.questionId}</Text>
                      <Text style={[styles.rowMeta, { color: appColors.textSecondary }]}>{formatDateTime(record.startedAt)}</Text>
                    </View>
                    <View style={styles.rowActions}>
                      <Chip compact style={[styles.rowChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>{record.duration}s</Chip>
                      <IconButton icon="delete-outline" size={18} iconColor={colors.danger} onPress={() => deleteRecordMutation.mutate(record.id)} />
                    </View>
                  </View>
                ))}
                {(recordsQuery.data?.length ?? 0) > MAX_VISIBLE_HISTORY_RECORDS ? (
                  <Text style={[styles.historyLimitHint, { color: appColors.textSecondary }]}>仅展示最近 10 条练习记录</Text>
                ) : null}
              </>
            ) : (
              <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>暂无练习记录。</Text>
            )}
          </Card.Content>
        </Card></View>}

        {isRefreshingViewedRecords ? <StatsPanelSkeleton appColors={appColors} /> : <View><Card mode="contained" style={[styles.panel, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]}>
          <Card.Content style={styles.panelContent}>
            <View style={styles.panelHeader}>
              <Text variant="titleMedium" style={[styles.panelTitle, { color: appColors.text }]}>完整浏览记录（共 {recentViewedQuery.data?.length ?? 0} 条）</Text>
              <View style={styles.panelActions}>
                <Button compact mode="text" textColor={appColors.primary} onPress={() => router.push('/(tabs)/question-bank')}>去题库</Button>
                <Button compact mode="text" textColor={colors.danger} onPress={() => clearViewedMutation.mutate()} disabled={clearViewedMutation.isPending}>清空</Button>
              </View>
            </View>
            {visibleViewedRecords.length ? (
              <>
                {visibleViewedRecords.map((record) => (
                  <View key={record.id} style={styles.rowItem}>
                    <View style={styles.rowTextWrap}>
                      <Text style={[styles.rowTitle, { color: appColors.text }]}>{questionMap.get(record.questionId)?.title ?? record.questionId}</Text>
                      <Text style={[styles.rowMeta, { color: appColors.textSecondary }]}>{formatDateTime(record.viewedAt)}</Text>
                    </View>
                    <View style={styles.rowActions}>
                      <Chip compact style={[styles.rowChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.text }}>{questionMap.get(record.questionId)?.category ?? '未分类'}</Chip>
                      <IconButton icon="delete-outline" size={18} iconColor={colors.danger} onPress={() => deleteViewedMutation.mutate(record.id)} />
                    </View>
                  </View>
                ))}
                {(recentViewedQuery.data?.length ?? 0) > MAX_VISIBLE_HISTORY_RECORDS ? (
                  <Text style={[styles.historyLimitHint, { color: appColors.textSecondary }]}>仅展示最近 10 条浏览记录</Text>
                ) : null}
              </>
            ) : (
              <Text style={[styles.emptyText, { color: appColors.textSecondary }]}>暂无浏览记录。</Text>
            )}
          </Card.Content>
        </Card></View>}
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
    borderRadius: 28,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
  },
  heroTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  progressBlock: {
    gap: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  progressNumber: {
    color: colors.primary,
    fontWeight: '800',
  },
  progressBar: {
    height: 10,
    borderRadius: 999,
  },
  heroChip: {
    backgroundColor: colors.surface,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    width: '47%',
    borderRadius: 22,
    borderWidth: 1,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
  },
  metricValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  metricLabel: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  panel: {
    borderRadius: 28,
    borderWidth: 1,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
  },
  panelContent: {
    gap: spacing.md,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  panelActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTextWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  rowMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  rowChip: {
    backgroundColor: colors.primarySoft,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryProgressItem: {
    gap: spacing.sm,
  },
  categoryProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
  },
  historyLimitHint: {
    fontSize: 12,
    textAlign: 'center',
  },
  skeletonTitle: {
    width: '46%',
    height: 18,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
  },
  skeletonRow: {
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
});
