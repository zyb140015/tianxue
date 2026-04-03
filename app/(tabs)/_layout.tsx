import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, Tabs } from 'expo-router';

import { LoadingState } from '@/components/common';
import { useAuthStore } from '@/store/use-auth-store';
import { useAppColors } from '@/theme';

type TabBarIconProps = {
  color: string;
};

function TabBarIcon({ color, name }: TabBarIconProps & { name: React.ComponentProps<typeof FontAwesome>['name'] }) {
  return <FontAwesome size={20} name={name} color={color} />;
}

export default function TabsLayout() {
  const appColors = useAppColors();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  if (!isHydrated) {
    return <LoadingState />;
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarActiveTintColor: appColors.primary,
        tabBarInactiveTintColor: appColors.textSecondary,
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
          backgroundColor: appColors.surface,
          borderTopColor: 'transparent',
          borderRadius: 28,
          shadowColor: appColors.shadow,
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
        name="favorites"
        options={{
          title: '收藏',
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="star" />,
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
