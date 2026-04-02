import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

import { colors } from './colors';

export const lightPaperTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.primaryLight,
    tertiary: colors.tertiary,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceMuted,
    outline: colors.border,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    onPrimary: colors.textOnPrimary,
    error: colors.danger,
  },
  roundness: 24,
};

export const darkPaperTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primaryLight,
    secondary: colors.secondary,
    tertiary: colors.tertiary,
    background: '#161327',
    surface: '#211D36',
    surfaceVariant: '#2B2645',
    outline: '#4A426A',
    onSurface: '#F5F2FF',
    onSurfaceVariant: '#C1B8E8',
    onPrimary: '#120F24',
    onSecondary: '#081714',
    onTertiary: '#2B0D19',
    secondaryContainer: '#35305A',
    onSecondaryContainer: '#F1EEFF',
    primaryContainer: '#312B4F',
    onPrimaryContainer: '#E4DEFF',
    elevation: {
      level0: 'transparent',
      level1: '#24203B',
      level2: '#2A2542',
      level3: '#312B4F',
      level4: '#363156',
      level5: '#3B355D',
    },
    error: colors.danger,
  },
  roundness: 24,
};
