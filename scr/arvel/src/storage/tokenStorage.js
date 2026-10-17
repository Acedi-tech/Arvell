// Токены сессии лежат в системном защищённом хранилище (Keychain на iOS,
// Keystore на Android), а не в AsyncStorage: тот хранит данные открытым
// текстом, и с рутованного телефона или из резервной копии их можно вытащить.
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_KEY = 'arvell.access_token';
const REFRESH_KEY = 'arvell.refresh_token';
// Профиль последнего вошедшего — чтобы холодный старт сразу открывал
// приложение залогиненным, не дожидаясь GET /me (см. AuthContext).
const USER_KEY = 'arvell.user';

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

// Refresh-токен пишем первым и не параллельно с access. Сервер при обновлении
// сразу гасит старый refresh, и если приложение закрыли между двумя записями,
// на устройстве оставался новый access со старым refresh: следующее
// обновление шло с погашенным токеном, сервер считал это повторным
// использованием и отзывал сессию. При таком порядке в худшем случае
// остаётся старый access с новым refresh — access просто обновится.
export async function setTokens({ accessToken, refreshToken }) {
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
}

export async function getCachedUser() {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setCachedUser(user) {
  try {
    if (user) await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    else await SecureStore.deleteItemAsync(USER_KEY);
  } catch {
    // Кэш профиля — только ускорение старта, без него всё работает как раньше.
  }
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
    AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]),
  ]);
}
