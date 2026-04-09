import { Redirect, router } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';

import { ScreenContainer } from '@/components/common';
import { useAuthStore } from '@/store/use-auth-store';
import { radius, spacing, useAppColors } from '@/theme';

const BRAND_LOGO = require('../../assets/branding/splash-logo.png');

export default function WelcomeScreen() {
  const appColors = useAppColors();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  if (isHydrated && isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.stage}>
        <View style={[styles.glow, styles.glowTop, { backgroundColor: appColors.primarySoft }]} />
        <View style={[styles.glow, styles.glowBottom, { backgroundColor: appColors.overlayMint }]} />
        <View style={[styles.ring, styles.ringTop, { borderColor: appColors.overlayRing }]} />

        <Surface style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]} elevation={0}>
          <View style={[styles.logoWrap, { backgroundColor: appColors.surfaceMuted, borderColor: appColors.border }]}>
            <Image source={BRAND_LOGO} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={[styles.badge, { backgroundColor: appColors.primarySoft }]}>
            <Text style={[styles.badgeText, { color: appColors.primary }]}>TIANXUE</Text>
          </View>

          <View style={styles.copy}>
            <Text style={[styles.title, { color: appColors.text }]}>前端面试练习</Text>
            <Text style={[styles.description, { color: appColors.textSecondary }]}>题库、模拟与复盘，放进一个安静清爽的学习空间。</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: appColors.border }]} />

          <View style={styles.buttonGroup}>
            <Button
              mode="contained"
              buttonColor={appColors.primary}
              onPress={() => router.push('/(auth)/login')}
              contentStyle={styles.primaryButtonContent}
              style={styles.primaryButton}>
              登录开始练习
            </Button>
            <Button mode="text" textColor={appColors.primary} onPress={() => router.push('/(auth)/register')}>
              创建账号
            </Button>
          </View>
        </Surface>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  stage: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.8,
  },
  glowTop: {
    top: 56,
    right: -18,
    width: 104,
    height: 104,
  },
  glowBottom: {
    left: -28,
    bottom: 74,
    width: 124,
    height: 124,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  ringTop: {
    top: 8,
    right: 18,
    width: 196,
    height: 196,
  },
  card: {
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 26,
    alignItems: 'center',
    gap: 14,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  logoWrap: {
    width: 82,
    height: 82,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 50,
    height: 50,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  copy: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 260,
  },
  divider: {
    width: '100%',
    height: 1,
    opacity: 0.7,
  },
  buttonGroup: {
    width: '100%',
    gap: 2,
    marginTop: 4,
  },
  primaryButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryButtonContent: {
    paddingVertical: 8,
  },
});
