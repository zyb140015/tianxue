import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Chip, IconButton, Searchbar, Surface, Text } from 'react-native-paper';

import { EmptyState, LoadingState, ScreenContainer } from '@/components/common';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { questionApiService as questionService } from '@/services/api/question-service';
import { getQuestionBankFilters, saveQuestionBankFilters } from '@/services/storage/question-bank-filter-storage';
import { useFeedbackStore } from '@/store/use-feedback-store';
import { colors, spacing, useAppColors } from '@/theme';

const QUESTION_PAGE_SIZE = 20;
const LOAD_MORE_THRESHOLD = 160;

function QuestionBankSkeleton({ appColors }: { appColors: ReturnType<typeof useAppColors> }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: 3 }).map((_, index) => (
        <Surface key={index} style={[styles.card, styles.skeletonCard, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
          <View style={styles.skeletonTopRow}>
            <View style={[styles.skeletonBadge, { backgroundColor: appColors.primarySoft }]} />
            <View style={[styles.skeletonIcon, { backgroundColor: appColors.surfaceMuted }]} />
          </View>
          <View style={[styles.skeletonTitle, { backgroundColor: appColors.surfaceMuted }]} />
          <View style={[styles.skeletonMeta, { backgroundColor: appColors.surfaceMuted }]} />
          <View style={styles.statusRow}>
            <View style={[styles.skeletonChip, { backgroundColor: appColors.surfaceMuted }]} />
            <View style={[styles.skeletonChip, { backgroundColor: appColors.surfaceMuted }]} />
          </View>
          <View style={styles.tagRow}>
            <View style={[styles.skeletonTag, { backgroundColor: appColors.primarySoft }]} />
            <View style={[styles.skeletonTag, { backgroundColor: appColors.primarySoft }]} />
            <View style={[styles.skeletonTag, { backgroundColor: appColors.primarySoft }]} />
          </View>
        </Surface>
      ))}
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
  appColors,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  appColors: ReturnType<typeof useAppColors>;
}) {
  return (
    <Chip
      selected={selected}
      showSelectedCheck={false}
      selectedColor={selected ? '#FFFFFF' : appColors.text}
      onPress={onPress}
      style={[styles.filterChip, { backgroundColor: selected ? appColors.primary : appColors.primarySoft, borderColor: selected ? appColors.primary : 'transparent' }]}
      textStyle={{ color: selected ? '#FFFFFF' : appColors.text, fontWeight: '700' }}>
      {label}
    </Chip>
  );
}

export default function QuestionBankScreen() {
  const appColors = useAppColors();
  const params = useLocalSearchParams<{ category?: string; needsReview?: string }>();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [unlearnedOnly, setUnlearnedOnly] = useState(false);
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedSort, setSelectedSort] = useState<'default' | 'difficulty' | 'favorites-first'>('default');
  const [hasHydratedFilters, setHasHydratedFilters] = useState(false);
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);
  const queryClient = useQueryClient();
  const showFeedback = useFeedbackStore((state) => state.showFeedback);
  const previousFilterSignatureRef = useRef('');
  const debouncedSearch = useDebouncedValue(search, 250);

  useEffect(() => {
    let mounted = true;

    void getQuestionBankFilters().then((filters) => {
      if (!mounted) {
        return;
      }

      if (filters) {
        setSearch(filters.search);
        setSelectedCategory(filters.selectedCategory);
        setFavoriteOnly(filters.favoriteOnly);
        setUnlearnedOnly(filters.unlearnedOnly);
        setNeedsReviewOnly(filters.needsReviewOnly);
        setSelectedDifficulty(filters.selectedDifficulty);
        setSelectedTag(filters.selectedTag);
        setSelectedSort(filters.selectedSort);
      }

      setHasHydratedFilters(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedFilters) {
      return;
    }

    if (params.category) {
      setSelectedCategory(params.category);
    }

    if (params.needsReview === 'true') {
      setNeedsReviewOnly(true);
      setFavoriteOnly(false);
      setUnlearnedOnly(false);
    }
  }, [hasHydratedFilters, params.category, params.needsReview]);

  useEffect(() => {
    if (!hasHydratedFilters) {
      return;
    }

    void saveQuestionBankFilters({
      search,
      selectedCategory,
      favoriteOnly,
      unlearnedOnly,
      needsReviewOnly,
      selectedDifficulty,
      selectedTag,
      selectedSort,
    });
  }, [
    hasHydratedFilters,
    search,
    selectedCategory,
    favoriteOnly,
    unlearnedOnly,
    needsReviewOnly,
    selectedDifficulty,
    selectedTag,
    selectedSort,
  ]);

  const filterSignature = useMemo(
    () =>
      JSON.stringify({
        search: debouncedSearch,
        selectedCategory,
        favoriteOnly,
        unlearnedOnly,
        needsReviewOnly,
        selectedDifficulty,
        selectedTag,
        selectedSort,
      }),
    [debouncedSearch, selectedCategory, favoriteOnly, unlearnedOnly, needsReviewOnly, selectedDifficulty, selectedTag, selectedSort],
  );

  useEffect(() => {
    if (!hasHydratedFilters) {
      return;
    }

    if (!previousFilterSignatureRef.current) {
      previousFilterSignatureRef.current = filterSignature;
      return;
    }

    if (previousFilterSignatureRef.current !== filterSignature) {
      previousFilterSignatureRef.current = filterSignature;
      setIsFilterTransitioning(true);
    }
  }, [filterSignature, hasHydratedFilters]);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setFavoriteOnly(false);
    setUnlearnedOnly(false);
    setNeedsReviewOnly(false);
    setSelectedDifficulty('all');
    setSelectedTag('all');
    setSelectedSort('default');
    router.replace('/(tabs)/question-bank');
  };

  const questionQuery = useInfiniteQuery({
    queryKey: ['questions', selectedCategory, selectedDifficulty, selectedTag, selectedSort, debouncedSearch, favoriteOnly, unlearnedOnly, needsReviewOnly],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      questionService.getQuestionPage({
        page: pageParam,
        pageSize: QUESTION_PAGE_SIZE,
        category: selectedCategory,
        difficulty: selectedDifficulty,
        tag: selectedTag,
        sort: selectedSort,
        search: debouncedSearch,
        favoriteOnly,
        unlearnedOnly,
        needsReviewOnly,
      }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });
  const categoryQuery = useQuery({ queryKey: ['categories'], queryFn: questionService.getCategories });
  const tagsQuery = useQuery({ queryKey: ['question-tags'], queryFn: questionService.getAvailableTags });
  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: string) => questionService.toggleFavorite(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['questions'] }),
        queryClient.invalidateQueries({ queryKey: ['question-pages'] }),
        queryClient.invalidateQueries({ queryKey: ['favorite-questions'] }),
        queryClient.invalidateQueries({ queryKey: ['question-detail'] }),
        queryClient.invalidateQueries({ queryKey: ['recommended-question'] }),
      ]);
      showFeedback('收藏状态已更新。', 'success');
    },
    onError: () => showFeedback('收藏更新失败，请稍后重试。', 'error'),
  });

  useEffect(() => {
    if (!questionQuery.isFetching) {
      setIsFilterTransitioning(false);
    }
  }, [questionQuery.isFetching]);

  if (!hasHydratedFilters || questionQuery.isLoading || categoryQuery.isLoading || tagsQuery.isLoading) {
    return <LoadingState />;
  }

  if (questionQuery.isError || categoryQuery.isError || tagsQuery.isError) {
    return <EmptyState title="题库加载失败" description="请稍后重试或重置筛选条件。" />;
  }

  const pagedQuestionData = questionQuery.data?.pages ?? [];
  const questions = pagedQuestionData.flatMap((page) => page.items);
  const totalQuestionCount = pagedQuestionData[0]?.total ?? 0;
  const hasMoreQuestions = questionQuery.hasNextPage;
  const isRefreshingQuestionList = isFilterTransitioning && questionQuery.isFetching && !questionQuery.isFetchingNextPage;
  const isLoadingMoreQuestions = questionQuery.isFetchingNextPage;

  const loadMoreQuestions = () => {
    if (!hasMoreQuestions || isLoadingMoreQuestions) {
      return;
    }

    void questionQuery.fetchNextPage();
  };

  const handleQuestionListScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!hasMoreQuestions || isRefreshingQuestionList) {
      return;
    }

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const remainingDistance = contentSize.height - (contentOffset.y + layoutMeasurement.height);

    if (remainingDistance <= LOAD_MORE_THRESHOLD) {
      loadMoreQuestions();
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} onScroll={handleQuestionListScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={appColors.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Text variant="headlineMedium" style={[styles.heroTitle, { color: colors.textOnPrimary }]}>Question Bank</Text>
          <Text style={[styles.heroSubtitle, { color: 'rgba(255,255,255,0.82)' }]}>把筛选、搜索和收藏组合成一套更像产品的浏览体验。</Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStatCard}>
              <Text style={[styles.heroStatValue, { color: colors.textOnPrimary }]}>{totalQuestionCount}</Text>
              <Text style={[styles.heroStatLabel, { color: 'rgba(255,255,255,0.76)' }]}>当前结果</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={[styles.heroStatValue, { color: colors.textOnPrimary }]}>{categoryQuery.data?.length ?? 0}</Text>
              <Text style={[styles.heroStatLabel, { color: 'rgba(255,255,255,0.76)' }]}>专题分类</Text>
            </View>
          </View>
        </LinearGradient>

        <Surface style={[styles.filterPanel, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
          <View style={styles.filterHeader}>
            <Text style={[styles.filterHeaderTitle, { color: appColors.text }]}>筛选条件</Text>
            <Chip onPress={resetFilters} style={[styles.resetChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.isDark ? '#F5F2FF' : appColors.primaryDark }}>重置筛选</Chip>
          </View>

          <Searchbar
            placeholder="搜索 React Native、Hooks、TypeScript..."
            value={search}
            onChangeText={setSearch}
            style={[styles.searchbar, { backgroundColor: appColors.surfaceMuted }]}
            inputStyle={[styles.searchInput, { color: appColors.text }]}
            iconColor={appColors.primary}
            placeholderTextColor={appColors.textSecondary}
          />

          <View style={styles.segmentedRow}>
            <FilterChip
              label="全部"
              selected={!favoriteOnly && !unlearnedOnly && !needsReviewOnly}
              onPress={() => {
                setFavoriteOnly(false);
                setUnlearnedOnly(false);
                setNeedsReviewOnly(false);
              }}
              appColors={appColors}
            />
            <FilterChip
              label="收藏"
              selected={favoriteOnly}
              onPress={() => {
                setFavoriteOnly(true);
                setUnlearnedOnly(false);
                setNeedsReviewOnly(false);
              }}
              appColors={appColors}
            />
            <FilterChip
              label="未学习"
              selected={unlearnedOnly}
              onPress={() => {
                setFavoriteOnly(false);
                setUnlearnedOnly(true);
                setNeedsReviewOnly(false);
              }}
              appColors={appColors}
            />
            <FilterChip
              label="未掌握"
              selected={needsReviewOnly}
              onPress={() => {
                setFavoriteOnly(false);
                setUnlearnedOnly(false);
                setNeedsReviewOnly(true);
              }}
              appColors={appColors}
            />
          </View>

          <View style={[styles.filterBlock, { backgroundColor: appColors.surfaceMuted, borderColor: appColors.border }]}> 
            <Text style={[styles.filterTitle, { color: appColors.text }]}>分类</Text>
            <View style={styles.chips}>
               <FilterChip label="全部" selected={selectedCategory === 'all'} onPress={() => setSelectedCategory('all')} appColors={appColors} />
               {categoryQuery.data?.map((category) => (
                 <FilterChip key={category.id} label={category.name} selected={selectedCategory === category.id} onPress={() => setSelectedCategory(category.id)} appColors={appColors} />
               ))}
            </View>
          </View>

          <View style={[styles.filterBlock, { backgroundColor: appColors.surfaceMuted, borderColor: appColors.border }]}> 
            <Text style={[styles.filterTitle, { color: appColors.text }]}>难度</Text>
            <View style={styles.chips}>
              <FilterChip label="全部难度" selected={selectedDifficulty === 'all'} onPress={() => setSelectedDifficulty('all')} appColors={appColors} />
              <FilterChip label="简单" selected={selectedDifficulty === 'easy'} onPress={() => setSelectedDifficulty('easy')} appColors={appColors} />
              <FilterChip label="中等" selected={selectedDifficulty === 'medium'} onPress={() => setSelectedDifficulty('medium')} appColors={appColors} />
              <FilterChip label="困难" selected={selectedDifficulty === 'hard'} onPress={() => setSelectedDifficulty('hard')} appColors={appColors} />
            </View>
          </View>

          <View style={[styles.filterBlock, { backgroundColor: appColors.surfaceMuted, borderColor: appColors.border }]}> 
            <Text style={[styles.filterTitle, { color: appColors.text }]}>标签</Text>
            <View style={styles.chips}>
              <FilterChip label="全部标签" selected={selectedTag === 'all'} onPress={() => setSelectedTag('all')} appColors={appColors} />
              {tagsQuery.data?.map((tag) => (
                <FilterChip key={tag} label={tag} selected={selectedTag === tag} onPress={() => setSelectedTag(tag)} appColors={appColors} />
              ))}
            </View>
          </View>

          <View style={[styles.filterBlock, { backgroundColor: appColors.surfaceMuted, borderColor: appColors.border }]}> 
            <Text style={[styles.filterTitle, { color: appColors.text }]}>排序</Text>
            <View style={styles.chips}>
              <FilterChip label="默认" selected={selectedSort === 'default'} onPress={() => setSelectedSort('default')} appColors={appColors} />
              <FilterChip label="按难度" selected={selectedSort === 'difficulty'} onPress={() => setSelectedSort('difficulty')} appColors={appColors} />
              <FilterChip label="收藏优先" selected={selectedSort === 'favorites-first'} onPress={() => setSelectedSort('favorites-first')} appColors={appColors} />
            </View>
          </View>
        </Surface>

        {isRefreshingQuestionList ? (
          <QuestionBankSkeleton appColors={appColors} />
        ) : !questions.length ? (
          <EmptyState title="没有匹配题目" description="试试切换分类或修改搜索关键词。" />
        ) : (
          <View style={styles.list}>
            {questions.map((question, index) => (
              <Surface key={question.id} style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]} elevation={0}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.orderBadge, { backgroundColor: appColors.primarySoft }]}>
                    <Text style={[styles.orderBadgeText, { color: appColors.primary }]}>{String(index + 1).padStart(2, '0')}</Text>
                  </View>
                  <IconButton
                    icon={question.isFavorite ? 'star' : 'star-outline'}
                    iconColor={question.isFavorite ? colors.warning : appColors.textSecondary}
                    containerColor={question.isFavorite ? appColors.tertiarySoft : appColors.surfaceMuted}
                    onPress={() => toggleFavoriteMutation.mutate(question.id)}
                  />
                </View>

                <Text variant="titleMedium" style={[styles.cardTitle, { color: appColors.text }]} onPress={() => router.push({ pathname: '/question/[id]', params: { id: question.id } })}>
                  {question.title}
                </Text>
                <Text style={[styles.meta, { color: appColors.textSecondary }]}>{question.category} · {question.difficulty}</Text>

                <View style={styles.statusRow}>
                  {question.isLearned ? <Chip compact style={[styles.learnedChip, { backgroundColor: appColors.primarySoft }]} textStyle={[styles.learnedChipText, { color: appColors.primaryDark }]}>已学习</Chip> : null}
                  {question.needsReview ? (
                    <Chip compact style={[styles.reviewChip, { backgroundColor: appColors.tertiarySoft }]} textStyle={styles.reviewChipText}>未掌握</Chip>
                  ) : null}
                </View>

                <View style={styles.tagRow}>
                  {question.tags.map((tag) => (
                    <Chip key={tag} compact style={[styles.tagChip, { backgroundColor: appColors.primarySoft }]} textStyle={[styles.tagText, { color: appColors.primaryDark }]}>{tag}</Chip>
                  ))}
                </View>
              </Surface>
            ))}
            <Text style={[styles.loadMoreHint, { color: appColors.textSecondary }]}>
              {isLoadingMoreQuestions
                ? '正在加载更多题目...'
                : hasMoreQuestions
                  ? `继续上拉加载更多（已显示 ${questions.length}/${totalQuestionCount}）`
                  : `已显示全部 ${totalQuestionCount} 条题目`}
            </Text>
          </View>
        )}
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
  },
  heroTitle: {
    color: colors.textOnPrimary,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 22,
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
  filterPanel: {
    borderRadius: 28,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    gap: spacing.lg,
    borderWidth: 1,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  filterHeaderTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  resetChip: {
    backgroundColor: colors.primarySoft,
  },
  searchbar: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
  },
  searchInput: {
    color: colors.text,
  },
  segmentedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterBlock: {
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.md,
  },
  filterTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    borderRadius: 26,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    gap: spacing.sm,
    borderWidth: 1,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
  },
  loadMoreHint: {
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: spacing.sm,
  },
  skeletonCard: {
    overflow: 'hidden',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  skeletonBadge: {
    width: 56,
    height: 28,
    borderRadius: 999,
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
  },
  skeletonTitle: {
    width: '82%',
    height: 22,
    borderRadius: 10,
  },
  skeletonMeta: {
    width: '40%',
    height: 16,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  skeletonChip: {
    width: 64,
    height: 28,
    borderRadius: 999,
  },
  skeletonTag: {
    width: 52,
    height: 28,
    borderRadius: 999,
  },
  orderBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primarySoft,
  },
  orderBadgeText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  meta: {
    color: colors.textSecondary,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tagChip: {
    backgroundColor: colors.primarySoft,
  },
  tagText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  learnedChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
  },
  learnedChipText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  reviewChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.tertiarySoft,
  },
  reviewChipText: {
    color: colors.danger,
    fontWeight: '700',
  },
});
