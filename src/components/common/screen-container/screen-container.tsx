import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, useAppColors } from '@/theme';

export function ScreenContainer({ children, style, ...props }: ViewProps) {
  const appColors = useAppColors();

  return (
    <SafeAreaView {...props} style={[styles.container, { backgroundColor: appColors.background }, style]}>
      <LinearGradient colors={appColors.gradientBackground} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[styles.orb, styles.orbTop, { backgroundColor: appColors.overlayOrb }]} />
      <View pointerEvents="none" style={[styles.orb, styles.orbMiddle, { backgroundColor: appColors.overlayMint }]} />
      <View pointerEvents="none" style={[styles.ring, styles.ringLarge, { borderColor: appColors.overlayRing }]} />
      <View pointerEvents="none" style={[styles.ring, styles.ringSmall, { borderColor: appColors.overlayRing }]} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbTop: {
    top: -36,
    right: -24,
    width: 180,
    height: 180,
  },
  orbMiddle: {
    top: '38%',
    left: -60,
    width: 132,
    height: 132,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  ringLarge: {
    width: 320,
    height: 320,
    top: -80,
    left: 80,
  },
  ringSmall: {
    width: 220,
    height: 220,
    bottom: 40,
    right: -80,
  },
});
