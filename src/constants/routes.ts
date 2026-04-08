export const routes = {
  welcome: '/(auth)/welcome',
  login: '/(auth)/login',
  register: '/(auth)/register',
  home: '/(tabs)',
  ai: '/(tabs)/ai',
  questionBank: '/(tabs)/question-bank',
  mockInterview: '/(tabs)/mock-interview',
  favorites: '/favorites',
  profile: '/(tabs)/profile',
  settings: '/settings',
} as const;
