import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
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

const registerSchema = z.object({
  name: z.string().trim().min(2, '请输入至少 2 个字符的昵称'),
  email: z.string().trim().email('请输入正确的邮箱'),
  phone: z.string().trim().min(6, '请输入正确的手机号或账号'),
  password: z.string().trim().min(6, '密码至少 6 位'),
  confirmPassword: z.string().trim().min(6, '请再次输入密码'),
}).refine((values) => values.password === values.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

type ApiErrorBody = {
  message?: string;
};

function getRegisterErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message ?? '注册失败，请稍后重试。';
  }

  return '注册失败，请稍后重试。';
}

export default function RegisterScreen() {
  const queryClient = useQueryClient();
  const appColors = useAppColors();
  const register = useAuthStore((state) => state.register);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await register(values);
      await queryClient.invalidateQueries();
      showSuccessMessage('注册成功，已自动登录。');
      router.replace(routes.home);
    } catch (error) {
      showErrorMessage(getRegisterErrorMessage(error));
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
                <Text style={[styles.badgeText, { color: appColors.primary }]}>NEW ACCOUNT</Text>
              </View>
              <Text style={[styles.title, { color: appColors.text }]}>创建账号</Text>
              <Text style={[styles.subtitle, { color: appColors.textSecondary }]}>注册后自动进入首页</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: appColors.border }]} />

            <View style={styles.form}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={[styles.fieldLabel, { color: appColors.text }]}>昵称</Text>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        placeholder="昵称"
                        placeholderTextColor={appColors.inputPlaceholder}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        style={[styles.input, { backgroundColor: appColors.inputBackground, borderColor: appColors.inputBorder, color: appColors.text }]}
                      />
                    )}
                  />
                  <HelperText type="error" visible={Boolean(errors.name)} style={styles.helperText}>{errors.name?.message}</HelperText>
                </View>

                <View style={styles.col}>
                  <Text style={[styles.fieldLabel, { color: appColors.text }]}>邮箱</Text>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        placeholder="邮箱"
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
                  <HelperText type="error" visible={Boolean(errors.email)} style={styles.helperText}>{errors.email?.message}</HelperText>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={[styles.fieldLabel, { color: appColors.text }]}>手机号</Text>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        placeholder="手机号"
                        placeholderTextColor={appColors.inputPlaceholder}
                        keyboardType="phone-pad"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        style={[styles.input, { backgroundColor: appColors.inputBackground, borderColor: appColors.inputBorder, color: appColors.text }]}
                      />
                    )}
                  />
                  <HelperText type="error" visible={Boolean(errors.phone)} style={styles.helperText}>{errors.phone?.message}</HelperText>
                </View>

                <View style={styles.col}>
                  <Text style={[styles.fieldLabel, { color: appColors.text }]}>密码</Text>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={styles.passwordInputWrapper}>
                        <Input
                          placeholder="密码"
                          placeholderTextColor={appColors.inputPlaceholder}
                          secureTextEntry={!isPasswordVisible}
                          textContentType="newPassword"
                          autoCapitalize="none"
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
                          <MaterialCommunityIcons color={appColors.textSecondary} name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={18} />
                        </Pressable>
                      </View>
                    )}
                  />
                  <HelperText type="error" visible={Boolean(errors.password)} style={styles.helperText}>{errors.password?.message}</HelperText>
                </View>
              </View>

              <View style={styles.full}>
                <Text style={[styles.fieldLabel, { color: appColors.text }]}>确认密码</Text>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.passwordInputWrapper}>
                      <Input
                        placeholder="请再次输入密码"
                        placeholderTextColor={appColors.inputPlaceholder}
                        secureTextEntry={!isConfirmPasswordVisible}
                        textContentType="newPassword"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        style={[styles.input, styles.passwordInput, { backgroundColor: appColors.inputBackground, borderColor: appColors.inputBorder, color: appColors.text }]}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={isConfirmPasswordVisible ? '隐藏确认密码' : '显示确认密码'}
                        onPress={() => setIsConfirmPasswordVisible((current) => !current)}
                        style={styles.passwordToggle}>
                        <MaterialCommunityIcons color={appColors.textSecondary} name={isConfirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={18} />
                      </Pressable>
                    </View>
                  )}
                />
                <HelperText type="error" visible={Boolean(errors.confirmPassword)} style={styles.helperText}>{errors.confirmPassword?.message}</HelperText>
              </View>

              <Button
                mode="contained"
                buttonColor={appColors.primary}
                onPress={onSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
                contentStyle={styles.primaryButtonContent}
                style={styles.primaryButton}>
                注册
              </Button>

              <Button mode="text" textColor={appColors.primary} onPress={() => router.replace(routes.login)}>
                已有账号？去登录
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
    top: 44,
    right: -18,
    width: 104,
    height: 104,
  },
  glowBottom: {
    left: -24,
    bottom: 72,
    width: 112,
    height: 112,
  },
  card: {
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 12,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  hero: {
    alignItems: 'center',
    gap: 6,
  },
  logoWrap: {
    width: 66,
    height: 66,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 38,
    height: 38,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  title: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.5,
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
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
    gap: 1,
  },
  full: {
    gap: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 42,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  helperText: {
    marginTop: -6,
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
    paddingVertical: 5,
  },
});
