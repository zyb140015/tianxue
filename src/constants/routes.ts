export const routes = {
  welcome: '/(auth)/welcome',
  login: '/(auth)/login',
  home: '/(tabs)',
  questionBank: '/(tabs)/question-bank',
  mockInterview: '/(tabs)/mock-interview',
  favorites: '/(tabs)/favorites',
  profile: '/(tabs)/profile',
  settings: '/settings',
} as const;
