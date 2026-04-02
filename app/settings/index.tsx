import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, Platform, StyleSheet } from 'react-native';
import { Card, List, Switch, Text } from 'react-native-paper';

import { ScreenContainer } from '@/components/common';
import { clearAllStorageItems, dumpAllStorageItems, restoreAllStorageItems } from '@/services/storage/app-storage';
import { useAuthStore } from '@/store/use-auth-store';
import { usePreferenceStore } from '@/store/use-preference-store';
import { colors, spacing, useAppColors } from '@/theme';
import { showErrorMessage, showInfoMessage, showSuccessMessage } from '@/utils/feedback';

export default function SettingsScreen() {
  const appColors = useAppColors();
  const queryClient = useQueryClient();
  const themeMode = usePreferenceStore((state) => state.themeMode);
  const setThemeMode = usePreferenceStore((state) => state.setThemeMode);
  const hydratePreferences = usePreferenceStore((state) => state.hydrate);
  const logout = useAuthStore((state) => state.logout);
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const resetAppMutation = useMutation({
    mutationFn: clearAllStorageItems,
    onSuccess: async () => {
      await queryClient.clear();
      await logout();
      await setThemeMode('light');
      showSuccessMessage('本地数据已清空。');
      router.replace('/(auth)/welcome');
    },
    onError: () => {
      showErrorMessage('清空失败，请稍后重试。');
    },
  });

  const isDarkMode = themeMode === 'dark';

  const handleExportData = async () => {
    const snapshot = await dumpAllStorageItems();
    const content = JSON.stringify(snapshot, null, 2);

    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      showInfoMessage('当前导出仅支持 Web 端。');
      return;
    }

    const blob = new Blob([content], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'frontend-interview-app-backup.json';
    link.click();
    window.URL.revokeObjectURL(url);
    showSuccessMessage('本地数据导出成功。');
  };

  const handleImportData = async () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      showInfoMessage('当前导入仅支持 Web 端。');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      const content = await file.text();

      try {
        const parsed = JSON.parse(content) as Partial<Record<string, string | null>>;
        await restoreAllStorageItems(parsed);
        await queryClient.clear();
        await hydrateAuth();
        await hydratePreferences();
        showSuccessMessage('本地数据导入成功。');
        router.replace('/');
      } catch {
        showErrorMessage('导入失败，文件不是有效的备份 JSON。');
      }
    };
    input.click();
  };

  return (
    <ScreenContainer style={styles.container}>
      <Text variant="headlineSmall" style={[styles.title, { color: appColors.text }]}>设置</Text>
      <Card mode="contained" style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }]}>
        <List.Item
          title="深色模式"
          description="切换应用主题外观"
          titleStyle={{ color: appColors.text }}
          descriptionStyle={{ color: appColors.textSecondary }}
          left={(props) => <List.Icon {...props} icon="theme-light-dark" color={appColors.primary} />}
          right={() => <Switch value={isDarkMode} onValueChange={(value) => {
            void setThemeMode(value ? 'dark' : 'light');
            showSuccessMessage(value ? '已切换到深色模式。' : '已切换到浅色模式。');
          }} />}
        />
        <List.Item title="通知设置" description="预留给练习提醒与学习通知" titleStyle={{ color: appColors.text }} descriptionStyle={{ color: appColors.textSecondary }} left={(props) => <List.Icon {...props} icon="bell-outline" color={appColors.primary} />} />
        <List.Item title="关于应用" description="当前版本：前端骨架演示版" titleStyle={{ color: appColors.text }} descriptionStyle={{ color: appColors.textSecondary }} left={(props) => <List.Icon {...props} icon="information-outline" color={appColors.primary} />} />
        <List.Item
          title="导出本地数据"
          description="导出当前登录、学习、浏览和练习数据为 JSON"
          titleStyle={{ color: appColors.text }}
          descriptionStyle={{ color: appColors.textSecondary }}
          left={(props) => <List.Icon {...props} icon="download-outline" color={appColors.primary} />}
          onPress={() => void handleExportData()}
        />
        <List.Item
          title="导入本地数据"
          description="从 JSON 备份恢复本地数据（当前仅 Web 支持）"
          titleStyle={{ color: appColors.text }}
          descriptionStyle={{ color: appColors.textSecondary }}
          left={(props) => <List.Icon {...props} icon="upload-outline" color={appColors.primary} />}
          onPress={() => void handleImportData()}
        />
        <List.Item
          title="清空全部本地数据"
          description="会移除登录态、收藏、学习记录、浏览记录与练习记录"
          titleStyle={styles.dangerText}
          descriptionStyle={{ color: appColors.textSecondary }}
          left={(props) => <List.Icon {...props} icon="delete-alert-outline" color={colors.danger} />}
          onPress={() => {
            Alert.alert('确认清空', '该操作会清空所有本地数据且不可恢复，是否继续？', [
              { text: '取消', style: 'cancel' },
              { text: '清空', style: 'destructive', onPress: () => resetAppMutation.mutate() },
            ]);
          }}
        />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
  },
  dangerText: {
    color: colors.danger,
  },
});
