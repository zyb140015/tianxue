import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { radius, spacing, typography, useAppColors } from '@/theme';

export function Input({ style, placeholderTextColor, ...props }: TextInputProps) {
  const appColors = useAppColors();

  return (
    <TextInput
      placeholderTextColor={placeholderTextColor ?? appColors.inputPlaceholder}
      style={[
        styles.input,
        {
          borderColor: appColors.inputBorder,
          backgroundColor: appColors.inputBackground,
          color: appColors.text,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: typography.body,
  },
});
