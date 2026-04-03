import { create } from 'zustand';

import { authApiService } from '@/services/api/auth-service';
import { clearAuthSession, getAuthSession, saveAuthSession, type AuthSession } from '@/services/storage/auth-session-storage';

type AuthState = {
  isLoggedIn: boolean;
  isHydrated: boolean;
  session: AuthSession | null;
  hydrate: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  isHydrated: false,
  session: null,
  hydrate: async () => {
    const session = await getAuthSession();

    if (!session) {
      await clearAuthSession();
    }

    set({
      session,
      isLoggedIn: Boolean(session),
      isHydrated: true,
    });
  },
  login: async (identifier: string, password: string) => {
    const result = await authApiService.login(identifier, password);

    const session = {
      identifier,
      loggedInAt: new Date().toISOString(),
      token: result.token,
      userId: String(result.user.id),
    } satisfies AuthSession;

    await saveAuthSession(session);
    set({ isLoggedIn: true, session });
  },
  logout: async () => {
    await clearAuthSession();
    set({ isLoggedIn: false, session: null });
  },
}));
