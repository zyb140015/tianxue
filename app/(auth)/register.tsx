import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Surface, Text } from 'react-native-paper';
import { z } from 'zod';

import { Input, ScreenContainer } from '@/components/common';
import { routes } from '@/constants/routes';
import { useAuthStore } from '@/store/use-auth-store';
import { spacing, useAppColors } from '@/theme';
import { showErrorMessage, showSuccessMessage } from '@/utils/feedback';

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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Surface style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }]} elevation={0}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: appColors.text }]}>创建学习账号</Text>
          <Text style={[styles.description, { color: appColors.textSecondary }]}>注册后将自动登录，可直接进入题库、模拟和收藏复习。</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: appColors.text }]}>昵称</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="请输入昵称"
                placeholderTextColor={appColors.inputPlaceholder}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                style={[styles.input, { backgroundColor: appColors.inputBackground, borderColor: appColors.inputBorder, color: appColors.text }]}
              />
            )}
          />
          <HelperText type="error" visible={Boolean(errors.name)}>{errors.name?.message}</HelperText>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: appColors.text }]}>邮箱</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="请输入邮箱"
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
          <HelperText type="error" visible={Boolean(errors.email)}>{errors.email?.message}</HelperText>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: appColors.text }]}>手机号</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="请输入手机号"
                placeholderTextColor={appColors.inputPlaceholder}
                keyboardType="phone-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                style={[styles.input, { backgroundColor: appColors.inputBackground, borderColor: appColors.inputBorder, color: appColors.text }]}
              />
            )}
          />
          <HelperText type="error" visible={Boolean(errors.phone)}>{errors.phone?.message}</HelperText>
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
                  <MaterialCommunityIcons color={appColors.textSecondary} name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={22} />
                </Pressable>
              </View>
            )}
          />
          <HelperText type="error" visible={Boolean(errors.password)}>{errors.password?.message}</HelperText>
        </View>

        <View style={styles.fieldGroup}>
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
                  <MaterialCommunityIcons color={appColors.textSecondary} name={isConfirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={22} />
                </Pressable>
              </View>
            )}
          />
          <HelperText type="error" visible={Boolean(errors.confirmPassword)}>{errors.confirmPassword?.message}</HelperText>
        </View>

        <Button mode="contained" buttonColor={appColors.primary} onPress={onSubmit} loading={isSubmitting} disabled={isSubmitting} contentStyle={styles.buttonContent}>
          注册并开始学习
        </Button>
        <Button mode="text" textColor={appColors.primary} onPress={() => router.replace(routes.login)}>
          已有账号，返回登录
        </Button>
      </Surface>
      </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
  },
  keyboardWrap: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  card: {
    borderRadius: 28,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  description: {
    lineHeight: 22,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontWeight: '700',
  },
  input: {
    minHeight: 56,
    borderRadius: 18,
    paddingLeft: 20,
    paddingRight: 16,
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
  buttonContent: {
    paddingVertical: 10,
  },
});
