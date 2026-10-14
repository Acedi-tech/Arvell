// Токены сессии лежат в системном защищённом хранилище (Keychain на iOS,
// Keystore на Android), а не в AsyncStorage: тот хранит данные открытым
// текстом, и с рутованного телефона или из резервной копии их можно вытащить.
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_KEY = 'arvell.access_token';
const REFRESH_KEY = 'arvell.refresh_token';

// Токены, сохранённые прежними версиями приложения в AsyncStorage, один раз
// переносим в защищённое хранилище, чтобы обновление не разлогинило людей.
async function migrateLegacy() {
  const [accessToken, refreshToken] = await Promise.all([
    AsyncStorage.getItem(ACCESS_KEY),
    AsyncStorage.getItem(REFRESH_KEY),
  ]);
  if (!accessToken && !refreshToken) return null;
  if (accessToken && refreshToken) await setTokens({ accessToken, refreshToken });
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
}

export async function getTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  if (accessToken || refreshToken) return { accessToken, refreshToken };
  return (await migrateLegacy()) || { accessToken: null, refreshToken: null };
}

export async function setTokens({ accessToken, refreshToken }) {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
  ]);
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
    AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]),
  ]);
}
