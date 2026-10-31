// Чек-лист: ЛЕНТА / КАТАЛОГ / ПОИСК, КАРТОЧКА ТОВАРА / МАГАЗИН, ИЗБРАННОЕ.
// Разделы одинаковы у покупателя и продавца (один и тот же код экранов) —
// различия по роли проверяются отдельными тестами в конце файла.
import React from 'react';
import { Share, FlatList, Image, Keyboard } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-navigation/native', () => require('../helpers/navMock').module);
jest.mock('../../src/context/AuthContext', () => require('../helpers/mockContexts').authModule);
jest.mock('../../src/context/AppConfigContext', () => require('../helpers/mockContexts').configModule);
jest.mock('../../src/context/FavoritesContext', () => require('../helpers/mockContexts').favoritesModule);
jest.mock('../../src/context/ProductsContext', () => require('../helpers/mockContexts').productsModule);
jest.mock('../../src/api/shops', () => ({ getShop: jest.fn(async () => null), getMyShop: jest.fn(), updateMyShop: jest.fn() }));
jest.mock('../../src/api/reviews', () => ({
  listProductReviews: jest.fn(async () => ({ data: [], page: { has_more: false } })),
  listShopReviews: jest.fn(async () => ({ data: [], page: { has_more: false } })),
}));
jest.mock('../../src/api/products', () => ({
  listProducts: jest.fn(async () => ({ data: [], page: { has_more: false } })),
  getProduct: jest.fn(),
  setProductStatus: jest.fn(async (id, status) => ({ id, status })),
}));
jest.mock('../../src/api/catalog', () => ({
  listCategories: jest.fn(async () => ({ data: [] })),
  listBrands: jest.fn(async () => ({ data: [] })),
}));

const { createNavigation } = require('../helpers/navMock');
const { setAuth, setFavorites, setProducts, setConfig, resetContexts } = require('../helpers/mockContexts');
const { listProducts, getProduct, setProductStatus } = require('../../src/api/products');
const { listCategories, listBrands } = require('../../src/api/catalog');
const { forEachRole } = require('../helpers/roles');

import FeedScreen from '../../src/screens/FeedScreen';
import CatalogScreen from '../../src/screens/CatalogScreen';
import SearchScreen from '../../src/screens/SearchScreen';
import ProductScreen from '../../src/screens/ProductScreen';
import ShopScreen from '../../src/screens/ShopScreen';
import FavoritesScreen from '../../src/screens/FavoritesScreen';

const nike = { id: 'p1', title: 'Air Max 90', brand: { id: 'b1', name: 'Nike' }, price_minor: 890000 };
const adidas = { id: 'p2', title: 'Samba', brand: { id: 'b2', name: 'Adidas' }, price_minor: 990050 };
const puma = { id: 'p3', title: 'Suede', brand: { id: 'b3', name: 'Puma' }, price_minor: 500000 };

let navigation;
beforeEach(async () => {
  setProductStatus.mockClear();
  resetContexts();
  navigation = createNavigation();
  await AsyncStorage.clear();
  listProducts.mockReset().mockResolvedValue({ data: [], page: { has_more: false } });
  getProduct.mockReset();
  listCategories.mockReset().mockResolvedValue({ data: [] });
  listBrands.mockReset().mockResolvedValue({ data: [] });
});

// Сердечко на карточке товара. Первая карточка — первое сердечко.
const hearts = () => screen.getAllByLabelText('В избранное');

forEachRole(({ t }) => {
  describe('ЛЕНТА / КАТАЛОГ / ПОИСК', () => {
    describe('Feed', () => {
      it('Feed: карточка товара -> Product', () => {
        setProducts({ products: [nike, adidas] });
        render(<FeedScreen navigation={navigation} />);
        expect(screen.getByText('Nike')).toBeTruthy();
        expect(screen.getByText('8 900 €')).toBeTruthy();
        fireEvent.press(screen.getByText('Samba'));
        expect(navigation.navigate).toHaveBeenCalledWith('Product', { id: 'p2' });
      });

      it(t('Feed: сердечко (добавить/убрать избранное)', 'Feed: сердечко (избранное)'), () => {
        const fav = setFavorites();
        setProducts({ products: [nike] });
        render(<FeedScreen navigation={navigation} />);
        fireEvent.press(hearts()[0]);
        expect(fav.toggleFavorite).toHaveBeenCalledWith('p1', nike);
        // Тап по сердечку не открывает карточку товара.
        expect(navigation.navigate).not.toHaveBeenCalledWith('Product', expect.anything());
      });

      it('Feed: сердечко у гостя -> окно входа', () => {
        setAuth({ isLoggedIn: false, user: null });
        const fav = setFavorites();
        setProducts({ products: [nike] });
        render(<FeedScreen navigation={navigation} />);
        fireEvent.press(hearts()[0]);
        expect(navigation.navigate).toHaveBeenCalledWith('Auth', { reason: 'Войдите, чтобы сохранять в избранное' });
        expect(fav.toggleFavorite).not.toHaveBeenCalled();
      });

      it('Feed: pull-to-refresh', async () => {
        const products = setProducts({ products: [nike] });
        render(<FeedScreen navigation={navigation} />);
        const list = screen.UNSAFE_getByType(FlatList);
        await act(async () => { await list.props.onRefresh(); });
        expect(products.refresh).toHaveBeenCalledTimes(1);
      });

      it(t('Feed: подгрузка страницы при скролле', 'Feed: подгрузка страницы'), () => {
        const products = setProducts({ products: [nike, adidas], hasMore: true });
        render(<FeedScreen navigation={navigation} />);
        const list = screen.UNSAFE_getByType(FlatList);
        expect(list.props.onEndReached).toBe(products.loadMore);
        act(() => { list.props.onEndReached(); });
        expect(products.loadMore).toHaveBeenCalled();
      });

      it(t('Feed: кнопка «Повторить» при ошибке', 'Feed: кнопка «Повторить»'), () => {
        const products = setProducts({ products: [], error: new Error('Сервер не отвечает') });
        render(<FeedScreen navigation={navigation} />);
        expect(screen.getByText('Не удалось загрузить товары')).toBeTruthy();
        expect(screen.getByText('Сервер не отвечает')).toBeTruthy();
        fireEvent.press(screen.getByText('Повторить'));
        expect(products.refresh).toHaveBeenCalled();
      });

      it('Feed: лупа раскрывает поиск, лента фильтруется на месте', async () => {
        setProducts({ products: [nike, adidas] });
        listProducts.mockResolvedValue({ data: [puma], page: { has_more: false } });
        render(<FeedScreen navigation={navigation} />);
        expect(screen.getByText('Популярные запросы')).toBeTruthy();
        fireEvent.press(screen.getByLabelText('Поиск'));
        fireEvent.changeText(screen.getByPlaceholderText('Поиск брендов...'), 'Puma');
        expect(await screen.findByText('Suede')).toBeTruthy();
        expect(listProducts).toHaveBeenLastCalledWith({ q: 'Puma', limit: 40 });
        // Пока идёт поиск, баннеры и чипсы скрыты.
        expect(screen.queryByText('Популярные запросы')).toBeNull();
        expect(navigation.navigate).not.toHaveBeenCalled();
      });

      it('Feed: чипс бренда ищет его, «Все» открывает каталог', async () => {
        setProducts({ products: [nike] });
        listProducts.mockResolvedValue({ data: [nike], page: { has_more: false } });
        render(<FeedScreen navigation={navigation} />);
        fireEvent.press(screen.getByText('Все ↗'));
        expect(navigation.getParent().navigate).toHaveBeenCalledWith('Catalog');
        fireEvent.press(screen.getByText('Stone Island ↗'));
        await waitFor(() => expect(listProducts).toHaveBeenLastCalledWith({ q: 'Stone Island', limit: 40 }));
        expect(screen.getByDisplayValue('Stone Island')).toBeTruthy();
      });

      it('Feed: пустая лента', () => {
        render(<FeedScreen navigation={navigation} />);
        expect(screen.getByText('Пока нет товаров')).toBeTruthy();
      });
    });

    describe('Catalog', () => {
      beforeEach(() => {
        listCategories.mockResolvedValue({
          data: [
            { id: 'c1', name: 'Обувь' },
            { id: 'c2', name: 'Одежда' },
            { id: 'c3', name: 'Кроссовки', parent_id: 'c1' },
          ],
        });
        listBrands.mockResolvedValue({ data: [nike.brand, adidas.brand, puma.brand] });
        listProducts.mockResolvedValue({ data: [nike, adidas, puma] });
      });

      it('Catalog: строка поиска -> Search', async () => {
        render(<CatalogScreen navigation={navigation} />);
        await screen.findByText('Air Max 90');
        fireEvent.press(screen.getByText('Поиск в каталоге...'));
        expect(navigation.navigate).toHaveBeenCalledWith('Search');
      });

      it(t('Catalog: чип категории (одиночный выбор)', 'Catalog: чип категории'), async () => {
        render(<CatalogScreen navigation={navigation} />);
        await screen.findByText('Air Max 90');
        // Подкатегории видны только внутри выбранной категории.
        expect(screen.queryByText('Кроссовки')).toBeNull();
        expect(listProducts).toHaveBeenLastCalledWith({ categoryId: null, limit: 20 });

        fireEvent.press(screen.getByText('Обувь'));
        await waitFor(() => expect(listProducts).toHaveBeenLastCalledWith({ categoryId: 'c1', limit: 20 }));
        fireEvent.press(screen.getByText('Одежда'));
        await waitFor(() => expect(listProducts).toHaveBeenLastCalledWith({ categoryId: 'c2', limit: 20 }));
        // Повторный тап снимает выбор.
        fireEvent.press(screen.getByText('Одежда'));
        await waitFor(() => expect(listProducts).toHaveBeenLastCalledWith({ categoryId: null, limit: 20 }));
      });

      it('Catalog: подкатегория выбранной категории', async () => {
        render(<CatalogScreen navigation={navigation} />);
        await screen.findByText('Air Max 90');
        fireEvent.press(screen.getByText('Обувь'));
        fireEvent.press(await screen.findByText('Кроссовки'));
        await waitFor(() => expect(listProducts).toHaveBeenLastCalledWith({ categoryId: 'c3', limit: 20 }));
      });

      it(t('Catalog: чип бренда (фильтр на сервере)', 'Catalog: чип бренда'), async () => {
        render(<CatalogScreen navigation={navigation} />);
        await screen.findByText('Air Max 90');
        // Чип бренда в шапке подписан со стрелкой ↗.
        fireEvent.press(screen.getByText('Nike ↗'));
        await waitFor(() => expect(listProducts).toHaveBeenLastCalledWith({ categoryId: null, limit: 20, brandId: 'b1' }));
        // Второй бренд заменяет первый: сервер принимает один brand_id.
        fireEvent.press(screen.getByText('Adidas ↗'));
        await waitFor(() => expect(listProducts).toHaveBeenLastCalledWith({ categoryId: null, limit: 20, brandId: 'b2' }));
        fireEvent.press(screen.getByText('Adidas ↗'));
        await waitFor(() => expect(listProducts).toHaveBeenLastCalledWith({ categoryId: null, limit: 20 }));
      });

      it('Catalog: окно «Фильтры» -> сортировка, цена, цвет, состояние, размер', async () => {
        setConfig({
          colors: [{ value: 'black', label: 'Чёрный' }],
          conditions: [{ value: 'like_new', label: 'Как новое' }],
          sizeSystems: [{ system: 'alpha', label: 'Буквенные размеры', input_type: 'select', values: ['S', 'M'] }],
        });
        render(<CatalogScreen navigation={navigation} />);
        await screen.findByText('Air Max 90');
        fireEvent.press(screen.getByText('Фильтры'));
        fireEvent.press(screen.getByText('Дешевле'));
        fireEvent.changeText(screen.getByPlaceholderText('от'), '1000');
        fireEvent.changeText(screen.getByPlaceholderText('до'), '5000');
        fireEvent.press(screen.getByText('Чёрный'));
        fireEvent.press(screen.getByText('Как новое'));
        fireEvent.press(screen.getByText('Буквенные размеры'));
        fireEvent.press(screen.getByText('M'));
        fireEvent.press(screen.getByText('Показать'));
        await waitFor(() => expect(listProducts).toHaveBeenLastCalledWith({
          categoryId: null, limit: 20, sort: 'price_asc', priceMin: 100000, priceMax: 500000,
          color: 'black', condition: 'like_new', sizeSystem: 'alpha', sizeValue: 'M',
        }));
        // На кнопке видно, сколько фильтров выбрано и как отсортировано.
        expect(screen.getByText('Фильтры · 5 · Дешевле')).toBeTruthy();
      });

      it('Catalog: «Сбросить» в фильтрах', async () => {
        setConfig({ colors: [{ value: 'black', label: 'Чёрный' }], conditions: [], sizeSystems: [] });
        render(<CatalogScreen navigation={navigation} />);
        await screen.findByText('Air Max 90');
        fireEvent.press(screen.getByText('Фильтры'));
        fireEvent.press(screen.getByText('Чёрный'));
        fireEvent.press(screen.getByText('Показать'));
        await waitFor(() => expect(listProducts).toHaveBeenLastCalledWith({ categoryId: null, limit: 20, color: 'black' }));
        fireEvent.press(screen.getByText('Фильтры · 1'));
        // «Сбросить» есть и на самом экране, и в окне фильтров — жмём в окне (оно отрисовано последним).
        fireEvent.press(screen.getAllByText('Сбросить').pop());
        fireEvent.press(screen.getByText('Показать'));
        await waitFor(() => expect(listProducts).toHaveBeenLastCalledWith({ categoryId: null, limit: 20 }));
      });

      it('Catalog: «Сбросить» на экране снимает категорию и бренд', async () => {
        render(<CatalogScreen navigation={navigation} />);
        await screen.findByText('Air Max 90');
        expect(screen.queryByText('Сбросить')).toBeNull();
        fireEvent.press(screen.getByText('Обувь'));
        fireEvent.press(screen.getByText('Nike ↗'));
        await waitFor(() => expect(listProducts).toHaveBeenLastCalledWith({ categoryId: 'c1', limit: 20, brandId: 'b1' }));
        fireEvent.press(screen.getByText('Сбросить'));
        await waitFor(() => expect(listProducts).toHaveBeenLastCalledWith({ categoryId: null, limit: 20 }));
      });

      it('Catalog: прокрутка до конца подгружает следующую страницу', async () => {
        listProducts
          .mockResolvedValueOnce({ data: [nike, adidas], page: { has_more: true, next_cursor: 'cur2' } })
          .mockResolvedValueOnce({ data: [puma], page: { has_more: false } });
        render(<CatalogScreen navigation={navigation} />);
        await screen.findByText('Samba');
        act(() => { screen.UNSAFE_getByType(FlatList).props.onEndReached(); });
        expect(await screen.findByText('Suede')).toBeTruthy();
        expect(listProducts).toHaveBeenLastCalledWith({ categoryId: null, limit: 20, cursor: 'cur2' });
      });

      it('Catalog: карточка товара -> Product', async () => {
        render(<CatalogScreen navigation={navigation} />);
        fireEvent.press(await screen.findByText('Suede'));
        expect(navigation.navigate).toHaveBeenCalledWith('Product', { id: 'p3' });
      });

      it('Catalog: ошибка загрузки товаров', async () => {
        listProducts.mockRejectedValue(new Error('offline'));
        render(<CatalogScreen navigation={navigation} />);
        expect(await screen.findByText('Не удалось загрузить товары')).toBeTruthy();
      });
    });

    describe('Search', () => {
      const input = () => screen.getByPlaceholderText('Поиск брендов...');

      beforeEach(() => {
        listBrands.mockImplementation(async ({ q } = {}) => ({
          data: q ? [{ id: 'b1', name: 'Nike' }, { id: 'b9', name: 'Nikon' }] : [{ id: 'b1', name: 'Nike' }, { id: 'b2', name: 'Adidas' }],
        }));
        listProducts.mockResolvedValue({ data: [nike] });
      });
      afterEach(() => jest.useRealTimers());

      it(t('Search: поле поиска (дебаунс)', 'Search: поле поиска'), async () => {
        jest.useFakeTimers();
        render(<SearchScreen navigation={navigation} />);
        await act(async () => {});
        fireEvent.changeText(input(), 'N');
        fireEvent.changeText(input(), 'Ni');
        fireEvent.changeText(input(), 'Nik');
        act(() => { jest.advanceTimersByTime(300); });
        expect(listProducts).not.toHaveBeenCalled();
        await act(async () => { jest.advanceTimersByTime(100); });
        // Только один запрос — по последнему значению.
        expect(listProducts).toHaveBeenCalledTimes(1);
        expect(listProducts).toHaveBeenCalledWith({ q: 'Nik' });
        // Открывается тапом по строке поиска — поле сразу в фокусе.
        expect(input().props.autoFocus).toBe(true);
        jest.useRealTimers();
        expect(await screen.findByText('Air Max 90')).toBeTruthy();
      });

      it('Search: поиск без результатов', async () => {
        listProducts.mockResolvedValue({ data: [] });
        render(<SearchScreen navigation={navigation} />);
        fireEvent.changeText(input(), 'zzz');
        expect(await screen.findByText('Ничего не найдено')).toBeTruthy();
      });

      it('Search: ошибка сети при поиске', async () => {
        listProducts.mockRejectedValue(new Error('offline'));
        render(<SearchScreen navigation={navigation} />);
        fireEvent.changeText(input(), 'Nike');
        expect(await screen.findByText('Не удалось выполнить поиск. Проверьте соединение.')).toBeTruthy();
      });

      it('Search: ссылка «Отмена»', async () => {
        render(<SearchScreen navigation={navigation} />);
        expect(screen.queryByText('Отмена')).toBeNull();
        fireEvent.changeText(input(), 'Nike');
        await screen.findByText('Air Max 90');
        fireEvent.press(screen.getByText('Отмена'));
        expect(input().props.value).toBe('');
        expect(screen.getByText('Популярное')).toBeTruthy();
      });

      it('Search: крестик в поле очищает запрос', async () => {
        render(<SearchScreen navigation={navigation} />);
        fireEvent.changeText(input(), 'Nike');
        fireEvent.press(screen.getByLabelText('Очистить поиск'));
        expect(input().props.value).toBe('');
      });

      it('Search: чип популярного бренда', async () => {
        render(<SearchScreen navigation={navigation} />);
        fireEvent.press(await screen.findByText('Adidas'));
        expect(input().props.value).toBe('Adidas');
        await waitFor(() => expect(listProducts).toHaveBeenCalledWith({ q: 'Adidas' }));
      });

      // История поиска — только то, что пользователь искал сам (сохраняется на
      // устройстве). Новому пользователю «Недавнее» не показывается вовсе.
      const seedRecent = (items) => AsyncStorage.setItem('arvell.recent_searches', JSON.stringify(items));

      it('Search: у нового пользователя «Недавнее» пустое', async () => {
        render(<SearchScreen navigation={navigation} />);
        await act(async () => {});
        expect(screen.queryByText('Недавнее')).toBeNull();
        expect(screen.queryByText('Air Max')).toBeNull();
      });

      it(t('Search: строка «Недавнее» (тап)', 'Search: строка «Недавнее»'), async () => {
        await seedRecent(['Air Max', 'Stone Island худи', 'Куртка зима']);
        render(<SearchScreen navigation={navigation} />);
        fireEvent.press(await screen.findByText('Stone Island худи'));
        expect(input().props.value).toBe('Stone Island худи');
        await waitFor(() => expect(listProducts).toHaveBeenCalledWith({ q: 'Stone Island худи' }));
      });

      it(t('Search: «x» у «Недавнее» (удалить)', 'Search: «x» у «Недавнее»'), async () => {
        await seedRecent(['Air Max', 'Stone Island худи', 'Куртка зима']);
        render(<SearchScreen navigation={navigation} />);
        expect(await screen.findByText('Air Max')).toBeTruthy();
        fireEvent.press(screen.getAllByLabelText('Удалить из недавних')[0]);
        expect(screen.queryByText('Air Max')).toBeNull();
        const saved = JSON.parse(await AsyncStorage.getItem('arvell.recent_searches'));
        expect(saved).toEqual(['Stone Island худи', 'Куртка зима']);
      });

      it('Search: выполненный запрос попадает в «Недавнее» и сохраняется', async () => {
        render(<SearchScreen navigation={navigation} />);
        fireEvent.changeText(input(), 'Carhartt');
        await screen.findByText('Air Max 90');
        await waitFor(async () => {
          expect(JSON.parse(await AsyncStorage.getItem('arvell.recent_searches'))[0]).toBe('Carhartt');
        });
      });

      it('Search: подсказка бренда подставляется в поле', async () => {
        render(<SearchScreen navigation={navigation} />);
        fireEvent.changeText(input(), 'Nik');
        fireEvent.press(await screen.findByText('Nikon'));
        expect(input().props.value).toBe('Nikon');
      });

      it('Search: карточка «Для вас» -> Product', async () => {
        setProducts({ products: [{ ...adidas, id: 'fy1' }] });
        render(<SearchScreen navigation={navigation} />);
        expect(screen.getByText('Для вас')).toBeTruthy();
        fireEvent.press(screen.getByText('9 900,50 €'));
        expect(navigation.navigate).toHaveBeenCalledWith('Product', { id: 'fy1' });
      });

      it('Search: карточка «Для вас» без бренда показывает название', () => {
        setProducts({ products: [{ ...adidas, id: 'fy2', brand: null, title: 'Кроссовки без бренда' }] });
        render(<SearchScreen navigation={navigation} />);
        expect(screen.getByText('Кроссовки без бренда')).toBeTruthy();
      });

      it('Search: карточка результата -> Product', async () => {
        render(<SearchScreen navigation={navigation} />);
        fireEvent.changeText(input(), 'Nike');
        fireEvent.press(await screen.findByText('Air Max 90'));
        expect(navigation.navigate).toHaveBeenCalledWith('Product', { id: 'p1' });
      });

      // Результаты держат клавиатуру при тапе (keyboardShouldPersistTaps), и на
      // Android 8 она оставалась открытой поверх карточки и закрывала «Купить».
      it('Search: переход к товару закрывает клавиатуру', async () => {
        const dismiss = jest.spyOn(Keyboard, 'dismiss');
        setProducts({ products: [{ ...adidas, id: 'fy1' }] });
        render(<SearchScreen navigation={navigation} />);
        fireEvent.press(screen.getByText('9 900,50 €'));
        expect(dismiss).toHaveBeenCalledTimes(1);
        fireEvent.changeText(input(), 'Nike');
        fireEvent.press(await screen.findByText('Air Max 90'));
        expect(dismiss).toHaveBeenCalledTimes(2);
        dismiss.mockRestore();
      });
    });
  });

  describe('КАРТОЧКА ТОВАРА / МАГАЗИН', () => {
    const product = {
      id: 'p1',
      title: 'Air Max 90',
      brand: { id: 'b1', name: 'Nike' },
      price_minor: 890000,
      size_value: '42',
      condition: 'excellent',
      description: 'Оригинал',
      images: [{ url: '/media/files/p1.jpg' }],
      seller: { id: 's1', seller_id: 'owner-1', shop_name: 'Alex Shop', rating: 4.8, rating_count: 12 },
    };
    const route = { params: { id: 'p1' } };

    beforeEach(() => {
      getProduct.mockResolvedValue(product);
      setConfig({ conditions: [{ value: 'excellent', label: 'Отличное' }] });
    });

    it('Product: данные товара', async () => {
      render(<ProductScreen navigation={navigation} route={route} />);
      expect(await screen.findByText('Nike Air Max 90')).toBeTruthy();
      expect(screen.getByText('Nike')).toBeTruthy();
      expect(screen.getByText('8 900 €')).toBeTruthy();
      expect(screen.getByText('42 · Отличное')).toBeTruthy();
      expect(getProduct).toHaveBeenCalledWith('p1');
    });

    it('Product: все фото товара в галерее по порядку, со счётчиком', async () => {
      getProduct.mockResolvedValue({
        ...product,
        images: [
          { url: '/media/files/c.jpg', position: 2 },
          { url: '/media/files/a.jpg', position: 0 },
          { url: '/media/files/b.jpg', position: 1 },
        ],
      });
      render(<ProductScreen navigation={navigation} route={route} />);
      await screen.findByText('Nike Air Max 90');
      const BASE = 'http://176.123.162.135:8081';
      const shown = screen.UNSAFE_queryAllByType(Image).map((i) => i.props.source?.uri).filter((u) => u?.includes('/media/files/'));
      expect(shown).toEqual([`${BASE}/media/files/a.jpg`, `${BASE}/media/files/b.jpg`, `${BASE}/media/files/c.jpg`]);
      expect(screen.getByText('1 / 3')).toBeTruthy();
    });

    it('Product: одно фото — без счётчика', async () => {
      render(<ProductScreen navigation={navigation} route={route} />);
      await screen.findByText('Nike Air Max 90');
      expect(screen.queryByText('1 / 1')).toBeNull();
    });

    it('Product: кнопка «Назад»', async () => {
      render(<ProductScreen navigation={navigation} route={route} />);
      await screen.findByText('Nike Air Max 90');
      fireEvent.press(screen.getByLabelText('Назад'));
      expect(navigation.goBack).toHaveBeenCalled();
    });

    it('Product: товар не найден -> сообщение и «Назад»', async () => {
      getProduct.mockRejectedValue(Object.assign(new Error('nf'), { status: 404 }));
      render(<ProductScreen navigation={navigation} route={route} />);
      expect(await screen.findByText('Товар не найден или уже снят с публикации.')).toBeTruthy();
      fireEvent.press(screen.getByLabelText('Назад'));
      expect(navigation.goBack).toHaveBeenCalled();
    });

    it(t('Product: сердечко (лайк/избранное)', 'Product: сердечко'), async () => {
      const fav = setFavorites();
      render(<ProductScreen navigation={navigation} route={route} />);
      await screen.findByText('Nike Air Max 90');
      fireEvent.press(screen.getByLabelText('В избранное'));
      expect(fav.toggleFavorite).toHaveBeenCalledWith('p1', product);
    });

    it('Product: сердечко у гостя -> окно входа', async () => {
      setAuth({ isLoggedIn: false, user: null });
      const fav = setFavorites();
      render(<ProductScreen navigation={navigation} route={route} />);
      await screen.findByText('Nike Air Max 90');
      fireEvent.press(screen.getByLabelText('В избранное'));
      expect(navigation.navigate).toHaveBeenCalledWith('Auth', { reason: 'Войдите, чтобы сохранять в избранное' });
      expect(fav.toggleFavorite).not.toHaveBeenCalled();
    });

    it('Product: кнопка «Поделиться»', async () => {
      const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
      render(<ProductScreen navigation={navigation} route={route} />);
      await screen.findByText('Nike Air Max 90');
      fireEvent.press(screen.getByLabelText('Поделиться'));
      // ru-RU разделяет разряды узким неразрывным пробелом — сравниваем через \s.
      expect(share).toHaveBeenCalledWith({
        message: expect.stringMatching(/^Nike Air Max 90\n8\s900 €\narvell:\/\/product\/p1$/),
      });
    });

    it('Product: строка продавца -> Shop', async () => {
      render(<ProductScreen navigation={navigation} route={route} />);
      fireEvent.press(await screen.findByText('Alex Shop'));
      expect(navigation.navigate).toHaveBeenCalledWith('Shop', {
        shopId: 's1', shopName: 'Alex Shop', rating: 4.8, ratingCount: 12,
      });
    });

    it(t('Product: кнопка «Купить» -> Conversation', 'Product: кнопка «Купить»'), async () => {
      render(<ProductScreen navigation={navigation} route={route} />);
      await screen.findByText('Nike Air Max 90');
      fireEvent.press(screen.getByText('Купить'));
      expect(navigation.navigate).toHaveBeenCalledWith('Conversation', expect.objectContaining({
        name: 'Alex Shop', rating: 4.8, product, fromBuy: true,
      }));
    });

    it(t('Product: иконка чата -> Conversation', 'Product: иконка чата'), async () => {
      render(<ProductScreen navigation={navigation} route={route} />);
      await screen.findByText('Nike Air Max 90');
      fireEvent.press(screen.getByLabelText('Написать продавцу'));
      expect(navigation.navigate).toHaveBeenCalledWith('Conversation', expect.objectContaining({
        name: 'Alex Shop', product, fromBuy: false,
      }));
    });

    it('Product: «Купить» у гостя -> окно входа', async () => {
      setAuth({ isLoggedIn: false, user: null });
      render(<ProductScreen navigation={navigation} route={route} />);
      await screen.findByText('Nike Air Max 90');
      fireEvent.press(screen.getByText('Купить'));
      expect(navigation.navigate).toHaveBeenCalledWith('Auth', { reason: 'Войдите, чтобы связаться с продавцом' });
    });

    it('Product (продавец): на своём товаре нет «Купить» и чата', async () => {
      setAuth({ user: { id: 'owner-1', name: 'Алекс', role: 'seller' } });
      render(<ProductScreen navigation={navigation} route={route} />);
      expect(await screen.findByText('Это ваше объявление')).toBeTruthy();
      expect(screen.queryByText('Купить')).toBeNull();
      expect(screen.queryByLabelText('Написать продавцу')).toBeNull();
    });

    it('Product (продавец): «Снять с продажи» и обратно', async () => {
      setAuth({ user: { id: 'owner-1', name: 'Алекс', role: 'seller' } });
      render(<ProductScreen navigation={navigation} route={route} />);
      await screen.findByText('Это ваше объявление');
      expect(screen.queryByLabelText('В избранное')).toBeNull();
      fireEvent.press(screen.getByLabelText('Действия с объявлением'));
      fireEvent.press(screen.getByText('Снять с продажи'));
      await waitFor(() => expect(setProductStatus).toHaveBeenCalledWith('p1', 'out_of_stock'));
      expect(await screen.findByText('Снято с продажи')).toBeTruthy();
      fireEvent.press(screen.getByLabelText('Действия с объявлением'));
      fireEvent.press(screen.getByText('Вернуть в продажу'));
      await waitFor(() => expect(setProductStatus).toHaveBeenLastCalledWith('p1', 'active'));
    });

    it('Product (продавец): «Удалить объявление» -> подтверждение -> назад', async () => {
      setAuth({ user: { id: 'owner-1', name: 'Алекс', role: 'seller' } });
      render(<ProductScreen navigation={navigation} route={route} />);
      await screen.findByText('Это ваше объявление');
      fireEvent.press(screen.getByLabelText('Действия с объявлением'));
      fireEvent.press(screen.getByText('Удалить объявление'));
      fireEvent.press(screen.getByText('Удалить'));
      await waitFor(() => expect(setProductStatus).toHaveBeenCalledWith('p1', 'archived'));
      expect(navigation.goBack).toHaveBeenCalled();
    });

    it('Shop: кнопка «Назад»', async () => {
      render(<ShopScreen navigation={navigation} route={{ params: { shopId: 's1', shopName: 'Alex Shop', rating: 4.8, ratingCount: 12 } }} />);
      expect(screen.getByText('Alex Shop')).toBeTruthy();
      expect(screen.getByText('4.8 · 12 отзывов')).toBeTruthy();
      await act(async () => {});
      fireEvent.press(screen.getByLabelText('Назад'));
      expect(navigation.goBack).toHaveBeenCalled();
    });

    it('Shop: карточка товара -> Product', async () => {
      listProducts.mockResolvedValue({ data: [nike, adidas] });
      render(<ShopScreen navigation={navigation} route={{ params: { shopId: 's1' } }} />);
      fireEvent.press(await screen.findByText('Samba'));
      expect(listProducts).toHaveBeenCalledWith({ shopId: 's1' });
      expect(navigation.navigate).toHaveBeenCalledWith('Product', { id: 'p2' });
    });

    it('Shop: пустой магазин', async () => {
      render(<ShopScreen navigation={navigation} route={{ params: { shopId: 's1' } }} />);
      expect(await screen.findByText('У продавца пока нет объявлений')).toBeTruthy();
    });
  });

  describe('ИЗБРАННОЕ', () => {
    it('Карточка товара -> Product', () => {
      setFavorites({ items: [{ id: 'f1', product: nike }], favorites: ['p1'], isFavorite: () => true, count: 1 });
      render(<FavoritesScreen navigation={navigation} />);
      fireEvent.press(screen.getByText('Air Max 90'));
      expect(navigation.navigate).toHaveBeenCalledWith('Product', { id: 'p1' });
    });

    it('Сердечко на карточке (убрать)', () => {
      const fav = setFavorites({ items: [{ id: 'f1', product: nike }], favorites: ['p1'], isFavorite: () => true, count: 1 });
      render(<FavoritesScreen navigation={navigation} />);
      // Товар уже в избранном — читалка озвучивает это, а не «В избранное».
      const heart = screen.getAllByLabelText('Убрать из избранного')[0];
      expect(heart.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
      fireEvent.press(heart);
      expect(fav.toggleFavorite).toHaveBeenCalledWith('p1', nike);
    });

    it('Пустой список -> «Перейти к товарам»', () => {
      render(<FavoritesScreen navigation={navigation} />);
      expect(screen.getByText('Здесь пока пусто')).toBeTruthy();
      fireEvent.press(screen.getByText('Перейти к товарам'));
      expect(navigation.navigate).toHaveBeenCalledWith('Catalog');
    });
  });
});
