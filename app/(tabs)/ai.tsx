import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Surface, Text } from 'react-native-paper';

import { Input, ScreenContainer } from '@/components/common';
import { useTabScrollReset } from '@/hooks/use-tab-scroll-reset';
import { aiApiService } from '@/services/api/ai-service';
import { spacing, useAppColors } from '@/theme';
import { showErrorMessage } from '@/utils/feedback';

type ApiErrorBody = {
  message?: string;
};

type AiHistoryItem = {
  id: string;
  question: string;
  answer: string;
};

function getAiErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message ?? '';

    if (message.includes('Insufficient Balance')) {
      return 'DeepSeek 余额不足，请充值后再试。';
    }

    if (error.response?.status === 404) {
      return 'AI 接口 /ai/ask 暂未接好，后端接入后即可直接使用。';
    }

    return message || '提问失败，请稍后重试。';
  }

  return '提问失败，请稍后重试。';
}

export default function AiScreen() {
  const appColors = useAppColors();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [history, setHistory] = useState<AiHistoryItem[]>([]);
  const scrollViewRef = useRef<ScrollView | null>(null);

  useTabScrollReset(scrollViewRef);

  const askMutation = useMutation({
    mutationFn: aiApiService.ask,
    onSuccess: (nextAnswer) => {
      setAnswer(nextAnswer);
      setHistory((current) => [
        {
          id: `${Date.now()}`,
          question: question.trim(),
          answer: nextAnswer,
        },
        ...current,
      ].slice(0, 10));
      setQuestion('');
    },
    onError: (error) => {
      showErrorMessage(getAiErrorMessage(error));
    },
  });

  const canSubmit = question.trim().length > 0 && !askMutation.isPending;

  const handleAsk = () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      showErrorMessage('请先输入你的问题。');
      return;
    }

    askMutation.mutate(trimmedQuestion);
  };

  return (
    <ScreenContainer>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Surface style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={[styles.title, { color: appColors.text }]}>AI 助手</Text>
            <Text style={[styles.description, { color: appColors.textSecondary }]}>先把提问体验接好，后端只要实现 `/ai/ask`，这里就能直接连上。</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: appColors.text }]}>你的问题</Text>
            <Input
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder="例如：帮我解释 React Native bridge 和新架构的区别"
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

          <Button mode="contained" buttonColor={appColors.primary} onPress={handleAsk} disabled={!canSubmit} loading={askMutation.isPending}>
            提问
          </Button>
        </Surface>

        <Surface style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
          <View style={styles.header}>
            <Text variant="titleMedium" style={[styles.answerTitle, { color: appColors.text }]}>回答</Text>
            <Text style={[styles.answerHint, { color: appColors.textSecondary }]}>这里预留给 `/ai/ask` 返回结果。</Text>
          </View>

          <Text style={[styles.answerText, { color: answer ? appColors.text : appColors.textSecondary }]}>
            {answer || '提交问题后，AI 的回答会显示在这里。'}
          </Text>
        </Surface>

        <Surface style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
          <View style={styles.historyHeader}>
            <Text variant="titleMedium" style={[styles.answerTitle, { color: appColors.text }]}>历史提问</Text>
            <Chip compact style={[styles.historyChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.primaryDark }}>
              最近 {history.length} 条
            </Chip>
          </View>

          {history.length ? history.map((item, index) => (
            <View key={item.id} style={[styles.historyItem, index === history.length - 1 ? styles.lastHistoryItem : null, { borderBottomColor: appColors.border }]}> 
              <Text style={[styles.historyQuestion, { color: appColors.text }]}>{item.question}</Text>
              <Text style={[styles.historyAnswer, { color: appColors.textSecondary }]}>{item.answer}</Text>
            </View>
          )) : (
            <Text style={[styles.answerText, { color: appColors.textSecondary }]}>你最近的提问会显示在这里，方便继续追问。</Text>
          )}
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
  answerTitle: {
    fontWeight: '800',
  },
  answerHint: {
    lineHeight: 20,
  },
  answerText: {
    lineHeight: 24,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyChip: {
    alignSelf: 'flex-start',
  },
  historyItem: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
  },
  lastHistoryItem: {
    paddingBottom: 0,
    marginBottom: 0,
    borderBottomWidth: 0,
  },
  historyQuestion: {
    fontWeight: '700',
    lineHeight: 22,
  },
  historyAnswer: {
    lineHeight: 22,
  },
});
