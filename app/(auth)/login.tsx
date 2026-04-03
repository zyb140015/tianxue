import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, Surface, Text } from 'react-native-paper';
import { z } from 'zod';

import { Input, ScreenContainer } from '@/components/common';
import { useAuthStore } from '@/store/use-auth-store';
import { colors, spacing, useAppColors } from '@/theme';
import { showErrorMessage, showSuccessMessage } from '@/utils/feedback';

const loginSchema = z.object({
  identifier: z.string().trim().min(1, '请输入手机号或邮箱'),
  password: z.string().trim().min(4, '请输入至少 4 位的验证码或密码'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const queryClient = useQueryClient();
  const appColors = useAppColors();
  const login = useAuthStore((state) => state.login);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.identifier, values.password);
      await queryClient.invalidateQueries();
      showSuccessMessage('登录成功，开始今天的学习。');
      router.replace('/(tabs)');
    } catch {
      showErrorMessage('登录失败，请稍后重试。');
    }
  });

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.hero}>
        <LinearGradient colors={appColors.gradientHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.logo, { shadowColor: appColors.shadow }]}>
          <View style={styles.logoRing} />
          <View style={styles.logoDot} />
        </LinearGradient>

        <Text style={[styles.brand, { color: appColors.primaryLight }]}>天学</Text>
        <Text style={[styles.title, { color: appColors.text }]}>让每一次练习，都更接近拿下 offer</Text>
        <Text style={[styles.subtitle, { color: appColors.textSecondary }]}>用更顺手的题库、模拟与复习节奏，把学习状态重新拉回正轨。</Text>
        <View style={styles.heroTags}>
          <View style={[styles.heroTag, { backgroundColor: appColors.surfaceMuted, borderColor: appColors.border }]}>
            <Text style={[styles.heroTagText, { color: appColors.primary }]}>高频题库</Text>
          </View>
          <View style={[styles.heroTag, { backgroundColor: appColors.surfaceMuted, borderColor: appColors.border }]}>
            <Text style={[styles.heroTagText, { color: appColors.primary }]}>模拟输出</Text>
          </View>
          <View style={[styles.heroTag, { backgroundColor: appColors.surfaceMuted, borderColor: appColors.border }]}>
            <Text style={[styles.heroTagText, { color: appColors.primary }]}>收藏复习</Text>
          </View>
        </View>
      </View>

      <Surface style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]} elevation={0}>
        <View style={styles.cardTop}>
          <View style={[styles.badge, { backgroundColor: appColors.primarySoft }] }>
            <Text style={[styles.badgeText, { color: appColors.primary }]}>学习账号登录</Text>
          </View>
          <Text style={[styles.cardTitle, { color: appColors.text }]}>进入今天的学习流</Text>
          <Text style={[styles.cardDescription, { color: appColors.textSecondary }]}>登录后继续上次进度，直接开始刷题、模拟或复习收藏内容。</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: appColors.text }]}>手机号或邮箱</Text>
          <Controller
            control={control}
            name="identifier"
            render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="请输入手机号或邮箱"
                  placeholderTextColor={appColors.inputPlaceholder}
                  keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                  style={[styles.input, { backgroundColor: appColors.inputBackground, borderColor: appColors.inputBorder, color: appColors.text }]}
                />
              )}
          />
          <HelperText type="error" visible={Boolean(errors.identifier)} style={styles.helperText}>
            {errors.identifier?.message}
          </HelperText>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: appColors.text }]}>验证码或密码</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.passwordInputWrapper}>
                  <Input
                    placeholder="请输入验证码或密码"
                    placeholderTextColor={appColors.inputPlaceholder}
                    secureTextEntry={!isPasswordVisible}
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    style={[styles.input, styles.passwordInput, { backgroundColor: appColors.inputBackground, borderColor: appColors.inputBorder, color: appColors.text }]}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={isPasswordVisible ? '隐藏密码' : '显示密码'}
                    onPress={() => setIsPasswordVisible((current) => !current)}
                    style={styles.passwordToggle}>
                    <MaterialCommunityIcons color={appColors.textSecondary} name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={22} />
                  </Pressable>
                </View>
              )}
          />
          <HelperText type="error" visible={Boolean(errors.password)} style={styles.helperText}>
            {errors.password?.message}
          </HelperText>
        </View>

        <Button
          mode="contained"
          buttonColor={appColors.primary}
          onPress={onSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          contentStyle={styles.buttonContent}
          style={[styles.button, { shadowColor: appColors.shadow }]}>
          立即进入天学
        </Button>

        <View style={[styles.features, { borderTopColor: appColors.border }] }>
          <View style={styles.featureItem}>
            <Text style={[styles.featureTitle, { color: appColors.primary }]}>题库</Text>
            <Text style={[styles.featureText, { color: appColors.textSecondary }]}>高频知识点</Text>
          </View>
          <View style={[styles.featureDivider, { backgroundColor: appColors.border }]} />
          <View style={styles.featureItem}>
            <Text style={[styles.featureTitle, { color: appColors.primary }]}>模拟</Text>
            <Text style={[styles.featureText, { color: appColors.textSecondary }]}>结构化输出</Text>
          </View>
          <View style={[styles.featureDivider, { backgroundColor: appColors.border }]} />
          <View style={styles.featureItem}>
            <Text style={[styles.featureTitle, { color: appColors.primary }]}>收藏</Text>
            <Text style={[styles.featureText, { color: appColors.textSecondary }]}>复习节奏</Text>
          </View>
        </View>
      </Surface>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    gap: spacing.xl,
    paddingTop: spacing.md,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  logo: {
    width: 74,
    height: 74,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  logoRing: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 4,
    borderColor: colors.textOnPrimary,
    transform: [{ rotate: '14deg' }],
  },
  logoDot: {
    position: 'absolute',
    top: 14,
    left: 16,
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.textOnPrimary,
  },
  brand: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    maxWidth: 320,
  },
  subtitle: {
    color: colors.textSecondary,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 300,
  },
  heroTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  heroTag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(108,92,231,0.08)',
  },
  heroTagText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    borderRadius: 30,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    gap: spacing.md,
    borderWidth: 1,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  cardTop: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  cardDescription: {
    color: colors.textSecondary,
    lineHeight: 21,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 2,
  },
  input: {
    minHeight: 56,
    borderRadius: 18,
    paddingLeft: 20,
    paddingRight: 16,
    backgroundColor: '#F6F7FF',
    borderColor: '#E4E1F7',
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 52,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  helperText: {
    marginTop: -2,
  },
  button: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: spacing.xs,
    shadowColor: colors.shadow,
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  buttonContent: {
    paddingVertical: 10,
  },
  features: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  featureDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  featureTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  featureText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
