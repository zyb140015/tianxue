import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';

import { ScreenContainer } from '@/components/common';
import { useAuthStore } from '@/store/use-auth-store';
import { colors, spacing, useAppColors } from '@/theme';

export default function WelcomeScreen() {
  const appColors = useAppColors();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  if (isHydrated && isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.heroWrap}>
        <View style={[styles.bgOrbLeft, { backgroundColor: appColors.overlayMint }]} />
        <View style={[styles.bgOrbRight, { backgroundColor: appColors.tertiary }]} />
        <View style={[styles.bgRing, { borderColor: appColors.overlayRing }]} />

        <LinearGradient colors={appColors.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoCard}>
          <View style={styles.logoSquare} />
          <View style={styles.logoCircle} />
          <View style={styles.logoAccent} />
        </LinearGradient>

        <Text style={[styles.brand, { color: appColors.primaryLight } ]}>天学</Text>
        <Text variant="displaySmall" style={[styles.title, { color: appColors.text }]}>把刷题这件事，做得像一个认真设计过的产品</Text>
        <Text variant="bodyLarge" style={[styles.description, { color: appColors.textSecondary }] }>
          用更轻盈的视觉和更明确的节奏感，完成题库、收藏、模拟面试和学习管理。
        </Text>
      </View>

      <Surface style={[styles.infoCard, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]} elevation={0}>
        <Text variant="titleMedium" style={[styles.infoTitle, { color: appColors.text }]}>这一版包含</Text>
        <Text variant="bodyMedium" style={[styles.infoText, { color: appColors.textSecondary }]}>紫色渐变主视觉、悬浮导航和更统一的内容卡片</Text>
        <Text variant="bodyMedium" style={[styles.infoText, { color: appColors.textSecondary }]}>题库、首页、收藏、模拟面试、个人页已同步升级</Text>
        <Text variant="bodyMedium" style={[styles.infoText, { color: appColors.textSecondary }]}>现在从登录进入，就能看到整套新的“天学”风格</Text>
      </Surface>

      <Button mode="contained" buttonColor={appColors.primary} onPress={() => router.push('/(auth)/login')} contentStyle={styles.buttonContent}>
        进入天学
      </Button>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    gap: spacing.xl,
    paddingTop: spacing.xl,
  },
  heroWrap: {
    position: 'relative',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  bgOrbLeft: {
    position: 'absolute',
    left: -18,
    top: 24,
    width: 120,
    height: 120,
    borderRadius: 999,
  },
  bgOrbRight: {
    position: 'absolute',
    right: 16,
    top: 10,
    width: 24,
    height: 24,
    borderRadius: 999,
  },
  bgRing: {
    position: 'absolute',
    right: -28,
    top: -10,
    width: 180,
    height: 180,
    borderRadius: 999,
    borderWidth: 1,
  },
  logoCard: {
    width: 108,
    height: 108,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoSquare: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.92)',
    transform: [{ rotate: '10deg' }],
  },
  logoCircle: {
    position: 'absolute',
    top: 22,
    left: 24,
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  logoAccent: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: colors.warning,
  },
  brand: {
    color: colors.primaryLight,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 6,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    textAlign: 'center',
    fontWeight: '800',
  },
  description: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 25,
    maxWidth: 320,
  },
  infoCard: {
    borderRadius: 28,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    gap: spacing.md,
    borderWidth: 1,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
  },
  infoTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  infoText: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
});
