import { Pressable, StyleSheet, Text } from 'react-native';
import type { PropsWithChildren } from 'react';

import { colors, radius, spacing, typography } from '@/theme';

type ButtonProps = PropsWithChildren<{
  onPress?: () => void;
}>;

export function Button({ children, onPress }: ButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.label}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  label: {
    color: colors.surface,
    fontSize: typography.subheading,
    fontWeight: '600',
  },
});
