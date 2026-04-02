import { usePreferenceStore } from '@/store/use-preference-store';

import { colors } from './colors';

export function useAppColors() {
  const themeMode = usePreferenceStore((state) => state.themeMode);
  const isDark = themeMode === 'dark';

  if (isDark) {
    return {
      isDark,
      primary: colors.primaryLight,
      primaryDark: '#C7BFFF',
      primaryLight: '#E4DEFF',
      secondary: '#B6ABFF',
      tertiary: '#FFB1C1',
      primarySoft: '#312B4F',
      secondarySoft: '#3A345C',
      tertiarySoft: '#412C38',
      background: '#161327',
      backgroundSecondary: '#1D1930',
      surface: '#211D36',
      surfaceMuted: '#2A2542',
      surfaceStrong: '#332D52',
      text: '#F5F2FF',
      textSecondary: '#C1B8E8',
      textOnPrimary: '#120F24',
      border: '#4A426A',
      success: colors.primaryLight,
      warning: colors.warning,
      danger: colors.danger,
      shadow: 'rgba(0, 0, 0, 0.35)',
      gradientBackground: ['#161327', '#1D1930'] as const,
      gradientHero: ['#2F2850', '#433679'] as const,
      overlayOrb: 'rgba(167, 155, 255, 0.12)',
      overlayMint: 'rgba(167, 155, 255, 0.08)',
      overlayRing: 'rgba(167, 155, 255, 0.12)',
      inputBackground: '#2A2542',
      inputBorder: '#4A426A',
      inputPlaceholder: '#9F97C8',
    } as const;
  }

  return {
    isDark,
    ...colors,
    gradientBackground: [colors.background, '#FDFBFF'] as const,
    gradientHero: [colors.primaryLight, colors.primary, colors.primaryDark] as const,
    overlayOrb: 'rgba(167, 155, 255, 0.16)',
    overlayMint: 'rgba(167, 155, 255, 0.12)',
    overlayRing: 'rgba(167, 155, 255, 0.2)',
    inputBackground: colors.surface,
    inputBorder: colors.border,
    inputPlaceholder: colors.textSecondary,
  } as const;
}
