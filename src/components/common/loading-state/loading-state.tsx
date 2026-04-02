import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { spacing, useAppColors } from '@/theme';

export function LoadingState() {
  const appColors = useAppColors();

  return (
    <View style={styles.container}>
      <ActivityIndicator color={appColors.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
