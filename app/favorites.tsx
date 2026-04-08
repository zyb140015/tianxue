import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { InteractionManager, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

import { EmptyState, LoadingState, ScreenContainer } from '@/components/common';
import { questionApiService as questionService } from '@/services/api/question-service';
import { colors, spacing, useAppColors } from '@/theme';
import { showErrorMessage, showSuccessMessage } from '@/utils/feedback';

function FavoritesSkeleton({ appColors }: { appColors: ReturnType<typeof useAppColors> }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }]}> 
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <View style={[styles.skeletonLineShort, { backgroundColor: appColors.primarySoft }]} />
              <View style={[styles.skeletonLineLong, { backgroundColor: appColors.surfaceMuted }]} />
              <View style={[styles.skeletonLineMeta, { backgroundColor: appColors.surfaceMuted }]} />
            </View>
            <View style={[styles.skeletonIcon, { backgroundColor: appColors.primarySoft }]} />
          </View>
          <View style={styles.tags}>
            <View style={[styles.skeletonTag, { backgroundColor: appColors.primarySoft }]} />
            <View style={[styles.skeletonTag, { backgroundColor: appColors.primarySoft }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function FavoritesScreen() {
  const appColors = useAppColors();
  const queryClient = useQueryClient();
  const [shouldLoadScreenData, setShouldLoadScreenData] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setShouldLoadScreenData(true);
    });

    return () => task.cancel();
  }, []);

  const favoritesQuery = useQuery({ queryKey: ['favorite-questions'], queryFn: () => questionService.getFavoriteQuestions(), enabled: shouldLoadScreenData });
  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: string) => questionService.toggleFavorite(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['questions'] }),
        queryClient.invalidateQueries({ queryKey: ['favorite-questions'] }),
        queryClient.invalidateQueries({ queryKey: ['question-detail'] }),
        queryClient.invalidateQueries({ queryKey: ['recommended-question'] }),
      ]);
      showSuccessMessage('收藏状态已更新。');
    },
    onError: () => showErrorMessage('收藏更新失败，请稍后重试。'),
  });

  if (favoritesQuery.isLoading) {
    return <LoadingState />;
  }

  const isRefreshingFavorites = favoritesQuery.isFetching;
  const favorites = favoritesQuery.data ?? [];

  return (
    <ScreenContainer edges={['left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={appColors.isDark ? ['#2B2645', '#332D52'] : [colors.primarySoft, '#EAE6FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { borderColor: appColors.border }]}> 
          <Text style={[styles.heroTitle, { color: appColors.text }]}>我的收藏</Text>
          <Text style={[styles.heroSubtitle, { color: appColors.textSecondary }]}>把真正值得反复复习的题，集中收纳到这里。</Text>
        </LinearGradient>

        {isRefreshingFavorites ? (
          <FavoritesSkeleton appColors={appColors} />
        ) : !favorites.length ? (
          <EmptyState title="暂无收藏题目" description="先去题库页收藏几道高频题吧。" />
        ) : (
          <View style={styles.list}>
            {favorites.map((question, index) => (
              <View key={question.id} style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]}>
                <View style={styles.header}>
                  <View style={styles.titleWrap}>
                    <Text style={[styles.indexLabel, { color: appColors.primary }]}>No. {String(index + 1).padStart(2, '0')}</Text>
                    <Text style={[styles.cardTitle, { color: appColors.text }]} onPress={() => router.push({ pathname: '/question/[id]', params: { id: question.id } })}>
                      {question.title}
                    </Text>
                    <Text style={[styles.meta, { color: appColors.textSecondary }]}>{question.category}</Text>
                  </View>
                  <Pressable style={[styles.iconButton, { backgroundColor: appColors.primarySoft }]} onPress={() => toggleFavoriteMutation.mutate(question.id)}>
                    <FontAwesome name="star" size={18} color={colors.warning} />
                  </Pressable>
                </View>
                <View style={styles.tags}>
                  {question.tags?.map((tag) => (
                    <View key={tag} style={[styles.tagChip, { backgroundColor: appColors.primarySoft }]}><Text style={[styles.tagText, { color: appColors.primaryDark }]}>{tag}</Text></View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing.sm,
  },
  container: {
    gap: spacing.lg,
    paddingBottom: 120,
  },
  hero: {
    borderRadius: 32,
    padding: spacing.xl,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    borderRadius: 26,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#E7E1FF',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  titleWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  indexLabel: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 18,
  },
  meta: {
    color: colors.textSecondary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonLineShort: {
    width: 72,
    height: 14,
    borderRadius: 8,
  },
  skeletonLineLong: {
    width: '78%',
    height: 20,
    borderRadius: 10,
  },
  skeletonLineMeta: {
    width: '36%',
    height: 14,
    borderRadius: 8,
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
  },
  skeletonTag: {
    width: 56,
    height: 28,
    borderRadius: 999,
  },
});
