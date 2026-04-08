import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, Tabs } from 'expo-router';
import { useEffect } from 'react';

import { LoadingState } from '@/components/common';
import { useAuthStore } from '@/store/use-auth-store';
import { usePreferenceStore } from '@/store/use-preference-store';
import { colors } from '@/theme';

type TabBarIconProps = {
  color: string;
};

function TabBarIcon({ color, name }: TabBarIconProps & { name: React.ComponentProps<typeof FontAwesome>['name'] }) {
  return <FontAwesome size={20} name={name} color={color} />;
}

export default function TabsLayout() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const themeMode = usePreferenceStore((state) => state.themeMode);

  const tabColors = themeMode === 'dark'
    ? {
        primary: colors.primaryLight,
        textSecondary: '#C1B8E8',
        surface: '#211D36',
        shadow: 'rgba(0, 0, 0, 0.35)',
      }
    : {
        primary: colors.primary,
        textSecondary: colors.textSecondary,
        surface: colors.surface,
        shadow: colors.shadow,
      };

  useEffect(() => {
    if (!isHydrated || isLoggedIn) {
      return;
    }

    router.replace('/(auth)/welcome');
  }, [isHydrated, isLoggedIn]);

  if (!isHydrated || !isLoggedIn) {
    return <LoadingState />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarActiveTintColor: tabColors.primary,
        tabBarInactiveTintColor: tabColors.textSecondary,
        sceneStyle: {
          backgroundColor: 'transparent',
        },
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 18,
          height: 74,
          paddingTop: 10,
          paddingBottom: 10,
          paddingHorizontal: 8,
          backgroundColor: tabColors.surface,
          borderTopColor: 'transparent',
          borderRadius: 28,
          shadowColor: tabColors.shadow,
          shadowOpacity: 1,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarItemStyle: {
          borderRadius: 20,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="home" />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="magic" />,
        }}
      />
      <Tabs.Screen
        name="question-bank"
        options={{
          title: '题库',
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="book" />,
        }}
      />
      <Tabs.Screen
        name="mock-interview"
        options={{
          title: '模拟',
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="microphone" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="user" />,
        }}
      />
    </Tabs>
  );
}
