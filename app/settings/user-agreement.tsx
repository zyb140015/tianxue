import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { AppTopBar, ScreenContainer } from '@/components/common';
import { legalLastUpdatedAt, userAgreementSections } from '@/constants/legal';
import { colors, spacing, useAppColors } from '@/theme';

export default function UserAgreementScreen() {
  const appColors = useAppColors();

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      <AppTopBar title="用户协议" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.meta, { color: appColors.textSecondary }]}>更新日期：{legalLastUpdatedAt}</Text>
        <Text style={[styles.intro, { color: appColors.textSecondary }]}>请在使用天学前认真阅读本协议。你使用本应用，即表示你已阅读、理解并同意受本协议约束。</Text>

        {userAgreementSections.map((section) => (
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
