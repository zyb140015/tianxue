import { Redirect } from 'expo-router';

import { LoadingState } from '@/components/common';
import { useAuthStore } from '@/store/use-auth-store';

export default function IndexPage() {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  if (!isHydrated) {
    return <LoadingState />;
  }

  return <Redirect href={isLoggedIn ? '/(tabs)' : '/(auth)/welcome'} />;
}
