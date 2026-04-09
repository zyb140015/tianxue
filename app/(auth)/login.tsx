import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, Surface, Text } from 'react-native-paper';
import { z } from 'zod';

import { Input, ScreenContainer } from '@/components/common';
import { routes } from '@/constants/routes';
import { useAuthStore } from '@/store/use-auth-store';
import { radius, spacing, useAppColors } from '@/theme';
import { showErrorMessage, showSuccessMessage } from '@/utils/feedback';

const BRAND_LOGO = require('../../assets/branding/splash-logo.png');

const loginSchema = z.object({
  identifier: z.string().trim().min(1, '请输入手机号或邮箱'),
  password: z.string().trim().min(4, '请输入至少 4 位密码'),
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
      router.replace(routes.home);
    } catch {
      showErrorMessage('登录失败，请稍后重试。');
    }
  });

  return (
    <ScreenContainer style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardWrap}>
        <View style={styles.stage}>
          <View style={[styles.glow, styles.glowTop, { backgroundColor: appColors.primarySoft }]} />
          <View style={[styles.glow, styles.glowBottom, { backgroundColor: appColors.overlayMint }]} />
          <Surface style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border, shadowColor: appColors.shadow }]} elevation={0}>
            <View style={styles.hero}>
              <View style={[styles.logoWrap, { backgroundColor: appColors.surfaceMuted, borderColor: appColors.border }]}>
                <Image source={BRAND_LOGO} style={styles.logo} resizeMode="contain" />
              </View>
              <View style={[styles.badge, { backgroundColor: appColors.primarySoft }]}>
                <Text style={[styles.badgeText, { color: appColors.primary }]}>WELCOME BACK</Text>
              </View>
              <Text style={[styles.title, { color: appColors.text }]}>欢迎回来</Text>
              <Text style={[styles.subtitle, { color: appColors.textSecondary }]}>继续你的学习进度</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: appColors.border }]} />

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: appColors.text }]}>账号</Text>
                <Controller
                  control={control}
                  name="identifier"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="手机号或邮箱"
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
                <Text style={[styles.fieldLabel, { color: appColors.text }]}>密码</Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.passwordInputWrapper}>
                      <Input
                        placeholder="请输入密码"
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
                        <MaterialCommunityIcons color={appColors.textSecondary} name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} />
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
                contentStyle={styles.primaryButtonContent}
                style={styles.primaryButton}>
                登录
              </Button>

              <Button mode="text" textColor={appColors.primary} onPress={() => router.push(routes.register)}>
                没有账号？去注册
              </Button>
            </View>
          </Surface>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  keyboardWrap: {
    flex: 1,
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
    top: 52,
    right: -20,
    width: 110,
    height: 110,
  },
  glowBottom: {
    left: -26,
    bottom: 90,
    width: 118,
    height: 118,
  },
  card: {
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 24,
    gap: 14,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  hero: {
    alignItems: 'center',
    gap: 7,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 42,
    height: 42,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  divider: {
    width: '100%',
    height: 1,
    opacity: 0.7,
  },
  form: {
    gap: 6,
  },
  fieldGroup: {
    gap: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordToggle: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  helperText: {
    marginTop: -3,
    paddingHorizontal: 0,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  primaryButtonContent: {
    paddingVertical: 7,
  },
});
