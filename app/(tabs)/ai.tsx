import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Surface, Text } from 'react-native-paper';

import { Input, ScreenContainer } from '@/components/common';
import { useTabScrollReset } from '@/hooks/use-tab-scroll-reset';
import { spacing, useAppColors } from '@/theme';
import { showInfoMessage } from '@/utils/feedback';

const QUICK_PROMPTS = [
  '帮我梳理 React 核心知识点',
  '模拟一轮前端面试',
  '怎么回答性能优化问题',
  '帮我复盘刚做错的题',
] as const;

export default function AiScreen() {
  const appColors = useAppColors();
  const [question, setQuestion] = useState('');
  const scrollViewRef = useRef<ScrollView | null>(null);

  useTabScrollReset(scrollViewRef);

  const canSubmit = question.trim().length > 0;

  const handleAsk = () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      showInfoMessage('请先输入你的问题。');
      return;
    }

    showInfoMessage('付费功能开发中，敬请期待。');
  };

  return (
    <ScreenContainer>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Surface style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={[styles.title, { color: appColors.text }]}>AI 助手</Text>
            <Text style={[styles.description, { color: appColors.textSecondary }]}>这个入口会保留在产品里，后续会作为付费能力提供更完整的面试陪练、回答优化和复盘建议。</Text>
          </View>

          <View style={styles.quickPromptBlock}>
            <Text style={[styles.label, { color: appColors.text }]}>可用场景预览</Text>
            <View style={styles.quickPromptRow}>
              {QUICK_PROMPTS.map((item) => (
                <Chip
                  key={item}
                  compact
                  onPress={() => setQuestion(item)}
                  style={[styles.quickPromptChip, { backgroundColor: appColors.primarySoft }]}
                  textStyle={{ color: appColors.primaryDark }}>
                  {item}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: appColors.text }]}>你的问题</Text>
            <Input
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder="输入你想咨询的面试问题"
              placeholderTextColor={appColors.inputPlaceholder}
              value={question}
              onChangeText={setQuestion}
              style={[
                styles.textarea,
                {
                  backgroundColor: appColors.inputBackground,
                  borderColor: appColors.inputBorder,
                  color: appColors.text,
                },
              ]}
            />
          </View>

          <Button mode="contained" buttonColor={appColors.primary} onPress={handleAsk} disabled={!canSubmit}>
            提问
          </Button>
        </Surface>

        <Surface style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
          <View style={styles.previewHeader}>
            <Text variant="titleMedium" style={[styles.previewTitle, { color: appColors.text }]}>功能状态</Text>
            <Chip compact style={[styles.statusChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.primaryDark }}>
              开发中
            </Chip>
          </View>
          <Text style={[styles.previewDescription, { color: appColors.textSecondary }]}>当前阶段不展示 AI 回答内容，避免造成能力已经开放的误解。等付费功能正式上线后，这里再展示真实回答结果。</Text>
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
  card: {
    borderRadius: 28,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontWeight: '800',
  },
  description: {
    lineHeight: 22,
  },
  quickPromptBlock: {
    gap: spacing.sm,
  },
  quickPromptRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickPromptChip: {
    alignSelf: 'flex-start',
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    fontWeight: '700',
  },
  textarea: {
    minHeight: 144,
    borderRadius: 20,
    paddingTop: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewTitle: {
    fontWeight: '800',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  previewDescription: {
    lineHeight: 24,
  },
});
