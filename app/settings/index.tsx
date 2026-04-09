import { useMutation, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import { Card, Chip, List, Switch, Text } from 'react-native-paper';

import { AppTopBar, ScreenContainer } from '@/components/common';
import { clearAllStorageItems, dumpAllStorageItems, restoreAllStorageItems } from '@/services/storage/app-storage';
import { useAuthStore } from '@/store/use-auth-store';
import { usePreferenceStore } from '@/store/use-preference-store';
import { colors, spacing, useAppColors } from '@/theme';
import { showErrorMessage, showInfoMessage, showSuccessMessage } from '@/utils/feedback';

export default function SettingsScreen() {
  const appColors = useAppColors();
  const queryClient = useQueryClient();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
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
  const isWeb = Platform.OS === 'web' && typeof document !== 'undefined';

  const handleExportData = async () => {
    const snapshot = await dumpAllStorageItems();
    const content = JSON.stringify(snapshot, null, 2);

    if (!isWeb) {
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
    if (!isWeb) {
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
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
      <AppTopBar title="设置" />

      <Card mode="contained" style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }]}>
        <Card.Content style={styles.sectionContent}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: appColors.text }]}>偏好设置</Text>
        </Card.Content>
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
        <List.Item
          title="练习提醒"
          description={isWeb ? '提醒能力开发中，后续会支持按学习节奏提醒。' : '移动端提醒能力开发中，后续会支持每日练习通知。'}
          titleStyle={{ color: appColors.text }}
          descriptionStyle={{ color: appColors.textSecondary }}
          left={(props) => <List.Icon {...props} icon="bell-outline" color={appColors.primary} />}
          right={() => (
            <Chip compact style={[styles.statusChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.primaryDark }}>
              开发中
            </Chip>
          )}
          onPress={() => showInfoMessage(isWeb ? '练习提醒功能正在开发中。' : '移动端练习提醒功能正在开发中。')}
        />
        <List.Item title="关于应用" description={`当前版本：${appVersion}`} titleStyle={{ color: appColors.text }} descriptionStyle={{ color: appColors.textSecondary }} left={(props) => <List.Icon {...props} icon="information-outline" color={appColors.primary} />} />
      </Card>

      <Card mode="contained" style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }]}>
        <Card.Content style={styles.sectionContent}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: appColors.text }]}>协议与说明</Text>
        </Card.Content>
        <List.Item
          title="隐私政策"
          description="查看应用如何处理账号信息与学习数据"
          titleStyle={{ color: appColors.text }}
          descriptionStyle={{ color: appColors.textSecondary }}
          left={(props) => <List.Icon {...props} icon="shield-account-outline" color={appColors.primary} />}
          onPress={() => router.push('/settings/privacy-policy')}
        />
        <List.Item
          title="用户协议"
          description="查看应用服务条款与使用规范"
          titleStyle={{ color: appColors.text }}
          descriptionStyle={{ color: appColors.textSecondary }}
          left={(props) => <List.Icon {...props} icon="file-document-outline" color={appColors.primary} />}
          onPress={() => router.push('/settings/user-agreement')}
        />
      </Card>

      <Card mode="contained" style={[styles.card, { backgroundColor: appColors.surface, borderColor: appColors.border }]}>
        <Card.Content style={styles.sectionContent}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: appColors.text }]}>数据管理</Text>
        </Card.Content>
        {isWeb ? (
          <>
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
              description="从 JSON 备份恢复本地数据"
              titleStyle={{ color: appColors.text }}
              descriptionStyle={{ color: appColors.textSecondary }}
              left={(props) => <List.Icon {...props} icon="upload-outline" color={appColors.primary} />}
              onPress={() => void handleImportData()}
            />
          </>
        ) : (
          <Card.Content style={styles.sectionContent}>
            <View style={[styles.mobileOnlyNotice, { backgroundColor: appColors.surfaceMuted, borderColor: appColors.border }]}>
              <Text style={[styles.mobileOnlyTitle, { color: appColors.text }]}>移动端数据备份即将上线</Text>
              <Text style={[styles.mobileOnlyDescription, { color: appColors.textSecondary }]}>
                当前移动端先提供稳定的本地使用体验。导入导出工具暂时只在 Web 端开放，后续会补充移动端备份与恢复能力。
              </Text>
              <Chip compact style={[styles.statusChip, { backgroundColor: appColors.primarySoft }]} textStyle={{ color: appColors.primaryDark }}>
                当前仅 Web 支持
              </Chip>
            </View>
          </Card.Content>
        )}
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
  card: {
    borderRadius: 24,
    borderWidth: 1,
  },
  sectionContent: {
    paddingBottom: 0,
  },
  sectionTitle: {
    fontWeight: '800',
  },
  statusChip: {
    alignSelf: 'center',
  },
  mobileOnlyNotice: {
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  mobileOnlyTitle: {
    fontWeight: '800',
  },
  mobileOnlyDescription: {
    lineHeight: 22,
  },
  dangerText: {
    color: colors.danger,
  },
});
