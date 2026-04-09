import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';

import { FeedbackSnackbar } from '@/components/common/feedback-snackbar';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/store/use-auth-store';
import { usePreferenceStore } from '@/store/use-preference-store';
import { darkPaperTheme, lightPaperTheme, useAppColors } from '@/theme';

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydratePreferences = usePreferenceStore((state) => state.hydrate);
  const themeMode = usePreferenceStore((state) => state.themeMode);
  const appColors = useAppColors();

  useEffect(() => {
    void hydrate();
    void hydratePreferences();
  }, [hydrate, hydratePreferences]);

  return (
    <PaperProvider theme={themeMode === 'dark' ? darkPaperTheme : lightPaperTheme}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: appColors.surface },
            headerTintColor: appColors.text,
            headerTitleStyle: { color: appColors.text, fontWeight: '700' },
            contentStyle: { backgroundColor: appColors.background },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="favorites" options={{ headerShown: false }} />
          <Stack.Screen name="question/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="stats/index" options={{ headerShown: false }} />
          <Stack.Screen name="settings/index" options={{ headerShown: false }} />
          <Stack.Screen name="settings/privacy-policy" options={{ headerShown: false }} />
          <Stack.Screen name="settings/user-agreement" options={{ headerShown: false }} />
        </Stack>
        <FeedbackSnackbar />
      </QueryClientProvider>
    </PaperProvider>
  );
}
