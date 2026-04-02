import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography, useAppColors } from '@/theme';

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  const appColors = useAppColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: appColors.text }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: appColors.textSecondary }]}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  title: {
    fontSize: typography.subheading,
    fontWeight: '600',
  },
  description: {
    fontSize: typography.body,
    textAlign: 'center',
  },
});
