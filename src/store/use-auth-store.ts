import { create } from 'zustand';

import { clearAuthSession, getAuthSession, saveAuthSession, type AuthSession } from '@/services/storage/auth-session-storage';

type AuthState = {
  isLoggedIn: boolean;
  isHydrated: boolean;
  session: AuthSession | null;
  hydrate: () => Promise<void>;
  login: (identifier: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  isHydrated: false,
  session: null,
  hydrate: async () => {
    const session = await getAuthSession();

    set({
      session,
      isLoggedIn: Boolean(session),
      isHydrated: true,
    });
  },
  login: async (identifier: string) => {
    const session = {
      identifier,
      loggedInAt: new Date().toISOString(),
    } satisfies AuthSession;

    await saveAuthSession(session);
    set({ isLoggedIn: true, session });
  },
  logout: async () => {
    await clearAuthSession();
    set({ isLoggedIn: false, session: null });
  },
}));
