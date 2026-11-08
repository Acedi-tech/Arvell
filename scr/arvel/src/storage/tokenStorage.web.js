// Browser storage; native builds use SecureStore in tokenStorage.js.
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_KEY = 'arvell.access_token';
const REFRESH_KEY = 'arvell.refresh_token';
const USER_KEY = 'arvell.user';

export async function getTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    AsyncStorage.getItem(ACCESS_KEY),
    AsyncStorage.getItem(REFRESH_KEY),
  ]);
  return { accessToken, refreshToken };
}

export async function setTokens({ accessToken, refreshToken }) {
  await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
  await AsyncStorage.setItem(ACCESS_KEY, accessToken);
}

export async function getCachedUser() {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setCachedUser(user) {
  try {
    if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    else await AsyncStorage.removeItem(USER_KEY);
  } catch {
    // Profile cache is optional.
  }
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY, USER_KEY]);
}
