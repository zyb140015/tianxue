import { create } from 'zustand';

import { getThemeMode, saveThemeMode, type ThemeMode } from '@/services/storage/preference-storage';

type PreferenceState = {
  hasSeenWelcome: boolean;
  themeMode: ThemeMode;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  markWelcomeSeen: () => void;
  setThemeMode: (themeMode: ThemeMode) => Promise<void>;
};

export const usePreferenceStore = create<PreferenceState>((set) => ({
  hasSeenWelcome: false,
  themeMode: 'light',
  isHydrated: false,
  hydrate: async () => {
    const themeMode = await getThemeMode();

    set({ themeMode, isHydrated: true });
  },
  markWelcomeSeen: () => set({ hasSeenWelcome: true }),
  setThemeMode: async (themeMode) => {
    await saveThemeMode(themeMode);
    set({ themeMode });
  },
}));
