import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getTokens, setTokens, clearTokens } from '../../src/storage/tokenStorage';
import { loadFavorites, saveFavorites, clearFavorites } from '../../src/storage/favoritesStorage';
import { loadCachedProducts, saveCachedProducts } from '../../src/storage/productsCache';
import { loadHiddenChats, hideChats, unhideChats } from '../../src/storage/chatStorage';

beforeEach(() => AsyncStorage.clear());

describe('storage/tokenStorage', () => {
  it('сохраняет, читает и стирает пару токенов', async () => {
    expect(await getTokens()).toEqual({ accessToken: null, refreshToken: null });
    await setTokens({ accessToken: 'a', refreshToken: 'r' });
    expect(await getTokens()).toEqual({ accessToken: 'a', refreshToken: 'r' });
    await clearTokens();
    expect(await getTokens()).toEqual({ accessToken: null, refreshToken: null });
  });

  it('токены лежат в защищённом хранилище, а не в AsyncStorage', async () => {
    await setTokens({ accessToken: 'a', refreshToken: 'r' });
    expect(await SecureStore.getItemAsync('arvell.access_token')).toBe('a');
    expect(await AsyncStorage.getItem('arvell.access_token')).toBeNull();
  });

  it('токены прежней версии из AsyncStorage переносятся и стираются', async () => {
    await AsyncStorage.multiSet([['arvell.access_token', 'old-a'], ['arvell.refresh_token', 'old-r']]);
    expect(await getTokens()).toEqual({ accessToken: 'old-a', refreshToken: 'old-r' });
    expect(await SecureStore.getItemAsync('arvell.refresh_token')).toBe('old-r');
    expect(await AsyncStorage.getItem('arvell.access_token')).toBeNull();
    expect(await AsyncStorage.getItem('arvell.refresh_token')).toBeNull();
  });
});

describe('storage/favoritesStorage', () => {
  it('сохраняет и читает список', async () => {
    expect(await loadFavorites()).toEqual([]);
    await saveFavorites([{ id: 'f1', product: { id: 'p1' } }]);
    expect(await loadFavorites()).toEqual([{ id: 'f1', product: { id: 'p1' } }]);
    await clearFavorites();
    expect(await loadFavorites()).toEqual([]);
  });

  it('битые данные не роняют приложение', async () => {
    await AsyncStorage.setItem('arvell.favorites', '{oops');
    expect(await loadFavorites()).toEqual([]);
  });

  it('ошибка хранилища при записи проглатывается', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    await expect(saveFavorites([])).resolves.toBeUndefined();
  });
});

describe('storage/productsCache', () => {
  it('нет кэша -> null; есть -> список', async () => {
    expect(await loadCachedProducts()).toBeNull();
    await saveCachedProducts([{ id: 'p1' }]);
    expect(await loadCachedProducts()).toEqual([{ id: 'p1' }]);
  });

  it('битый кэш -> null', async () => {
    await AsyncStorage.setItem('arvell.products_cache', 'nope');
    expect(await loadCachedProducts()).toBeNull();
  });
});

describe('storage/chatStorage', () => {
  it('скрывает чаты без дублей и возвращает обратно', async () => {
    expect(await loadHiddenChats()).toEqual([]);
    await hideChats(['c1', 'c2']);
    await hideChats(['c2', 'c3']);
    expect(await loadHiddenChats()).toEqual(['c1', 'c2', 'c3']);
    await unhideChats(['c2']);
    expect(await loadHiddenChats()).toEqual(['c1', 'c3']);
  });

  it('не-массив в хранилище считается пустым списком', async () => {
    await AsyncStorage.setItem('arvell.chats.hidden', JSON.stringify({ a: 1 }));
    expect(await loadHiddenChats()).toEqual([]);
  });
});
