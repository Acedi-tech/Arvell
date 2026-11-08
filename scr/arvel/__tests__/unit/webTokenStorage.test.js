import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getTokens, setTokens, getCachedUser, setCachedUser, clearTokens } from '../../src/storage/tokenStorage.web';

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('browser sessions work without native SecureStore and clear on logout', async () => {
  SecureStore.getItemAsync.mockImplementationOnce(() => { throw new Error('Unavailable on web'); });
  expect(await getTokens()).toEqual({ accessToken: null, refreshToken: null });
  await setTokens({ accessToken: 'access', refreshToken: 'refresh' });
  await setCachedUser({ id: 'u1' });
  expect(await getTokens()).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
  expect(await getCachedUser()).toEqual({ id: 'u1' });
  expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  await clearTokens();
  expect(await getTokens()).toEqual({ accessToken: null, refreshToken: null });
  expect(await getCachedUser()).toBeNull();
  SecureStore.getItemAsync.mockReset();
});

it('ignores corrupt cached profiles', async () => {
  await AsyncStorage.setItem('arvell.user', '{broken');
  expect(await getCachedUser()).toBeNull();
});
