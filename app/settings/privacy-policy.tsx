import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { ScreenContainer } from '@/components/common';
import { legalLastUpdatedAt, privacyPolicySections } from '@/constants/legal';
import { colors, spacing, useAppColors } from '@/theme';

export default function PrivacyPolicyScreen() {
  const appColors = useAppColors();

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={[styles.title, { color: appColors.text }]}>隐私政策</Text>
        <Text style={[styles.meta, { color: appColors.textSecondary }]}>更新日期：{legalLastUpdatedAt}</Text>
        <Text style={[styles.intro, { color: appColors.textSecondary }]}>欢迎使用天学。为了说明我们如何处理你的个人信息与本地学习数据，请你仔细阅读以下内容。</Text>

        {privacyPolicySections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: appColors.text }]}>{section.title}</Text>
            {section.paragraphs.map((paragraph) => (
              <Text key={paragraph} style={[styles.paragraph, { color: appColors.textSecondary }]}>{paragraph}</Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
  },
  meta: {
    color: colors.textSecondary,
  },
  intro: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  paragraph: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
