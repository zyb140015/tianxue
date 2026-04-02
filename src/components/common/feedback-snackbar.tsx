import { StyleSheet } from 'react-native';
import { Snackbar, Text } from 'react-native-paper';

import { useFeedbackStore } from '@/store/use-feedback-store';
import { spacing, useAppColors } from '@/theme';

export function FeedbackSnackbar() {
  const appColors = useAppColors();
  const visible = useFeedbackStore((state) => state.visible);
  const message = useFeedbackStore((state) => state.message);
  const type = useFeedbackStore((state) => state.type);
  const hideFeedback = useFeedbackStore((state) => state.hideFeedback);

  const backgroundColor =
    type === 'success' ? appColors.success : type === 'error' ? appColors.danger : appColors.surfaceMuted;
  const textColor = type === 'info' ? appColors.text : '#FFFFFF';

  return (
    <Snackbar
      visible={visible}
      onDismiss={hideFeedback}
      duration={2400}
      style={[styles.snackbar, { backgroundColor }]}
      action={{
        label: '关闭',
        textColor,
        onPress: hideFeedback,
      }}>
      <Text style={[styles.message, { color: textColor }]}>{message}</Text>
    </Snackbar>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    margin: spacing.lg,
    borderRadius: 16,
  },
  message: {
    fontWeight: '600',
  },
});
