import Constants from 'expo-constants';

const DEFAULT_DEV_API_URL = 'https://xnyb.online/tianxue/api/v1';
const DEFAULT_PROD_API_URL = 'https://xnyb.online/tianxue/api/v1';
const PUBLIC_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type ExtraConfig = {
  apiBaseUrl?: string;
};

function readExpoExtra(): ExtraConfig {
  const expoConfig = Constants.expoConfig;
  if (expoConfig?.extra) {
    return expoConfig.extra as ExtraConfig;
  }

  const manifest = Constants.manifest2;
  const extra = manifest?.extra?.expoClient ?? manifest?.extra;
  return (extra as ExtraConfig | undefined) ?? {};
}

export function getApiBaseUrl() {
  if (PUBLIC_API_BASE_URL) {
    return PUBLIC_API_BASE_URL;
  }

  const extra = readExpoExtra();
  if (extra.apiBaseUrl) {
    return extra.apiBaseUrl;
  }

  return __DEV__ ? DEFAULT_DEV_API_URL : DEFAULT_PROD_API_URL;
}
