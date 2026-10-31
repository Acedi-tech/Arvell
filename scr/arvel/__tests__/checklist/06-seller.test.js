// Чек-лист: ПРОДАВЕЦ — профиль, мои объявления, добавление товара, продажи.
// Лента/каталог/поиск/товар/избранное/чаты/уведомления/помощь у продавца
// работают тем же кодом, что и у покупателя — см. 02–05.
import React from 'react';
import { Alert, FlatList } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

jest.mock('@react-navigation/native', () => require('../helpers/navMock').module);
jest.mock('../../src/context/AuthContext', () => require('../helpers/mockContexts').authModule);
jest.mock('../../src/context/AppConfigContext', () => require('../helpers/mockContexts').configModule);
jest.mock('../../src/context/FavoritesContext', () => require('../helpers/mockContexts').favoritesModule);
jest.mock('../../src/context/MyListingsContext', () => require('../helpers/mockContexts').myListingsModule);
jest.mock('../../src/api/media', () => ({ uploadImage: jest.fn() }));
jest.mock('../../src/api/shops', () => ({ updateMyShop: jest.fn(), getMyShop: jest.fn() }));
jest.mock('../../src/api/catalog', () => ({ listCategories: jest.fn(), listBrands: jest.fn() }));
jest.mock('../../src/api/purchases', () => ({ listMyPurchases: jest.fn(async () => ({ data: [] })), listMySales: jest.fn(async () => ({ data: [] })) }));
jest.mock('../../src/api/products', () => ({
  createProduct: jest.fn(), listProducts: jest.fn(), getProduct: jest.fn(),
  updateProduct: jest.fn(async () => ({})), addProductImage: jest.fn(async () => ({})), deleteProductImage: jest.fn(async () => null),
}));
jest.mock('../../src/utils/imageUpload', () => ({
  ...jest.requireActual('../../src/utils/imageUpload'),
  prepareForUpload: jest.fn(async (a) => ({ ...a, contentType: 'image/jpeg' })),
}));

const { createNavigation } = require('../helpers/navMock');
const { setAuth, setMyListings, setConfig, resetContexts } = require('../helpers/mockContexts');
const { getImage, queryImage } = require('../helpers/queries');
const { uploadImage } = require('../../src/api/media');
const { updateMyShop, getMyShop } = require('../../src/api/shops');
const { listCategories, listBrands } = require('../../src/api/catalog');
const { createProduct, getProduct, updateProduct, addProductImage, deleteProductImage } = require('../../src/api/products');

import AccountScreen from '../../src/screens/AccountScreen';
import EditProfileScreen from '../../src/screens/EditProfileScreen';
import MyListingsScreen from '../../src/screens/MyListingsScreen';
import AddProductScreen from '../../src/screens/AddProductScreen';
import OrdersScreen from '../../src/screens/OrdersScreen';
const { listMySales, listMyPurchases } = require('../../src/api/purchases');

const seller = { id: 's1', name: 'Алекс', display_name: 'Алекс', phone: '+79995550000', role: 'seller', is_admin: false };

let navigation;
beforeEach(() => {
  resetContexts();
  setAuth({ user: seller });
  navigation = createNavigation();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  uploadImage.mockReset().mockImplementation(async ({ uri }) => `/media/files/${uri.split('/').pop()}`);
  updateMyShop.mockReset().mockResolvedValue({});
  createProduct.mockReset().mockResolvedValue({ id: 'new' });
  listCategories.mockReset().mockResolvedValue({ data: [] });
  listBrands.mockReset().mockResolvedValue({ data: [] });
});

describe('ПРОДАВЕЦ', () => {
  describe('ПРОФИЛЬ (ПРОДАВЕЦ)', () => {
    const renderAccount = () => render(<AccountScreen navigation={navigation} />);

    // Рейтинг был захардкожен («4.8 · 34 отзыва» у всех) и убран до появления
    // реальных цифр в /me/shop (задача бэкенда). Пункт устарел на это время.
    it.skip('Рейтинг «★ N.N · N отзывов» + бейдж «Продавец»', () => {});

    it('Бейдж «Продавец» есть, фейкового рейтинга и числа продаж нет', () => {
      renderAccount();
      expect(screen.getByText('Алекс')).toBeTruthy();
      expect(screen.getByText('Продавец')).toBeTruthy();
      expect(screen.queryByText('Покупатель')).toBeNull();
      expect(screen.queryByText(/отзыв/)).toBeNull();
      expect(screen.queryByText('47')).toBeNull();
    });

    it('Кнопка «Редактировать профиль»', () => {
      renderAccount();
      fireEvent.press(screen.getByText('Редактировать профиль'));
      expect(navigation.navigate).toHaveBeenCalledWith('EditProfile');
    });

    it('Плитка «Продажи» -> Orders', () => {
      renderAccount();
      expect(screen.queryByText('Заказы')).toBeNull();
      fireEvent.press(screen.getByText('Продажи'));
      expect(navigation.navigate).toHaveBeenCalledWith('Orders');
    });

    it('Плитка «Мои объявления» -> MyListings', () => {
      setMyListings({ items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });
      renderAccount();
      expect(screen.getByText('3')).toBeTruthy();
      fireEvent.press(screen.getByText('Объявления'));
      expect(navigation.navigate).toHaveBeenCalledWith('MyListings');
    });

    it.each([
      ['Помощь', 'Help'],
      ['Правила', 'Rules'],
    ])('Строка «%s» -> %s', (label, route) => {
      renderAccount();
      fireEvent.press(screen.getByText(label));
      expect(navigation.navigate).toHaveBeenCalledWith(route);
    });

    // Убраны до появления пушей и чата поддержки на бэкенде — пункты устарели.
    it.skip('Строка «Уведомления» -> Notifications', () => {});
    it.skip('Строка «Чат с поддержкой» -> Conversation', () => {});

    it('Строк «Уведомления» и «Чат с поддержкой» нет, пока нет пушей и чата поддержки', () => {
      renderAccount();
      expect(screen.queryByText('Уведомления')).toBeNull();
      expect(screen.queryByText('Чат с поддержкой')).toBeNull();
    });

    it('Строка «Выйти» -> подтверждение -> выход', async () => {
      const auth = setAuth({ user: seller });
      renderAccount();
      fireEvent.press(screen.getByText('Выйти'));
      expect(screen.getByText('Выйти из аккаунта?')).toBeTruthy();
      const buttons = screen.getAllByText('Выйти');
      fireEvent.press(buttons[buttons.length - 1]);
      await waitFor(() => expect(auth.signOut).toHaveBeenCalled());
    });

    describe('EditProfile', () => {
      const pickFromGallery = async (uri) => {
        ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri }] });
        fireEvent.press(screen.getByLabelText('Изменить фото профиля'));
        jest.useFakeTimers();
        fireEvent.press(screen.getByText('Выбрать из галереи'));
        await act(async () => { jest.advanceTimersByTime(300); });
        jest.useRealTimers();
        await waitFor(() => expect(getImage(uri)).toBeTruthy());
      };

      it('EditProfile: новый аватар -> обновляет и логотип магазина', async () => {
        const auth = setAuth({ user: seller });
        render(<EditProfileScreen navigation={navigation} />);
        await pickFromGallery('file:///logo.jpg');
        fireEvent.press(screen.getByText('Сохранить'));
        await waitFor(() => expect(updateMyShop).toHaveBeenCalledWith({ profile_pic_url: '/media/files/logo.jpg' }));
        expect(auth.updateProfile).toHaveBeenCalledWith({ display_name: 'Алекс', profile_pic_url: '/media/files/logo.jpg' });
      });

      it('EditProfile: «Название магазина» и «О магазине» сохраняются в магазин', async () => {
        const auth = setAuth({ user: seller });
        getMyShop.mockResolvedValueOnce({ shop_name: 'Alex Shop', description: '' });
        render(<EditProfileScreen navigation={navigation} />);
        await waitFor(() => expect(screen.getByDisplayValue('Alex Shop')).toBeTruthy());
        fireEvent.changeText(screen.getByDisplayValue('Alex Shop'), 'Archive Room');
        fireEvent.changeText(screen.getByPlaceholderText('Расскажите, что вы продаёте и где удобно встретиться'), 'Встречи у м. Тверская');
        fireEvent.press(screen.getByText('Сохранить'));
        await waitFor(() => expect(updateMyShop).toHaveBeenCalledWith({ shop_name: 'Archive Room', description: 'Встречи у м. Тверская' }));
        expect(auth.updateProfile).toHaveBeenCalledWith({ display_name: 'Алекс' });
      });

      it('EditProfile: поле «Имя», кнопка «Сохранить»', async () => {
        const auth = setAuth({ user: seller });
        render(<EditProfileScreen navigation={navigation} />);
        fireEvent.changeText(screen.getByPlaceholderText('Придумайте никнейм'), 'Алекс Шоп');
        fireEvent.press(screen.getByText('Сохранить'));
        await waitFor(() => expect(auth.updateProfile).toHaveBeenCalledWith({ display_name: 'Алекс Шоп' }));
        // Без нового фото логотип магазина не трогаем.
        expect(updateMyShop).not.toHaveBeenCalled();
        expect(navigation.goBack).toHaveBeenCalled();
      });
    });
  });

  describe('МОИ ОБЪЯВЛЕНИЯ (MYLISTINGS)', () => {
    const active = { id: 'l1', title: 'Air Max 90', brand: { name: 'Nike' }, price_minor: 890000, status: 'active' };
    const sold = { id: 'l2', title: 'Samba', brand: { name: 'Adidas' }, price_minor: 990000, status: 'out_of_stock' };
    const renderList = (ctx = {}) => {
      const listings = setMyListings({ items: [active, sold], ...ctx });
      render(<MyListingsScreen navigation={navigation} />);
      return listings;
    };
    const openMenu = (index = 0) => fireEvent.press(screen.getAllByLabelText('Меню объявления')[index]);

    it('При заходе на экран список обновляется с сервера', () => {
      const listings = renderList();
      expect(listings.refresh).toHaveBeenCalled();
    });

    it('Кнопка «Назад»', () => {
      renderList();
      fireEvent.press(screen.getByLabelText('Назад'));
      expect(navigation.goBack).toHaveBeenCalled();
    });

    it('Кнопка «+» в шапке -> AddProduct', () => {
      renderList();
      fireEvent.press(screen.getByLabelText('Добавить товар'));
      expect(navigation.navigate).toHaveBeenCalledWith('AddProduct');
    });

    it('Pull-to-refresh', () => {
      const listings = renderList();
      listings.refresh.mockClear();
      act(() => { screen.UNSAFE_getByType(FlatList).props.onRefresh(); });
      expect(listings.refresh).toHaveBeenCalledTimes(1);
    });

    it('Карточка объявления -> Product', () => {
      renderList();
      fireEvent.press(screen.getByText('Air Max 90'));
      expect(navigation.navigate).toHaveBeenCalledWith('Product', { id: 'l1' });
    });

    it('Иконка меню «…» на карточке', () => {
      renderList();
      expect(screen.queryByText('Удалить')).toBeNull();
      openMenu(0);
      expect(screen.getByText('Снять с продажи')).toBeTruthy();
      expect(screen.getByText('Удалить')).toBeTruthy();
      // Повторный тап закрывает меню.
      openMenu(0);
      expect(screen.queryByText('Удалить')).toBeNull();
    });

    it('Меню снятого товара: «Вернуть в продажу»', () => {
      const listings = renderList();
      openMenu(1);
      expect(screen.queryByText('Снять с продажи')).toBeNull();
      fireEvent.press(screen.getByText('Вернуть в продажу'));
      expect(listings.markActive).toHaveBeenCalledWith('l2');
    });

    it('Меню -> «Снять с продажи»', () => {
      const listings = renderList();
      openMenu(0);
      fireEvent.press(screen.getByText('Снять с продажи'));
      expect(listings.markSold).toHaveBeenCalledWith('l1');
      expect(screen.queryByText('Снять с продажи')).toBeNull();
    });

    it('Меню -> «Удалить» -> подтверждение', () => {
      renderList();
      openMenu(0);
      fireEvent.press(screen.getByText('Удалить'));
      expect(screen.getByText('Удалить объявление?')).toBeTruthy();
      expect(screen.getByText('Это действие нельзя отменить.')).toBeTruthy();
    });

    it('Диалог удаления -> «Отмена»', () => {
      const listings = renderList();
      openMenu(0);
      fireEvent.press(screen.getByText('Удалить'));
      fireEvent.press(screen.getByText('Отмена'));
      expect(screen.queryByText('Удалить объявление?')).toBeNull();
      expect(listings.archive).not.toHaveBeenCalled();
    });

    it('Диалог удаления -> «Удалить»', () => {
      const listings = renderList();
      openMenu(0);
      fireEvent.press(screen.getByText('Удалить'));
      // В диалоге своя кнопка «Удалить» — она отрисована последней.
      fireEvent.press(screen.getAllByText('Удалить').pop());
      expect(listings.archive).toHaveBeenCalledWith('l1');
    });

    it('Ошибка действия с объявлением -> алерт', async () => {
      renderList({ markSold: jest.fn(async () => { throw new Error('Нет прав'); }) });
      openMenu(0);
      fireEvent.press(screen.getByText('Снять с продажи'));
      await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Не удалось выполнить действие', 'Нет прав'));
    });

    it('Плашка «Снято» только у снятого с продажи', () => {
      renderList();
      expect(screen.getAllByText('Снято')).toHaveLength(1);
    });

    it('Пустой список -> «Объявлений пока нет»', () => {
      renderList({ items: [] });
      expect(screen.getByText('Объявлений пока нет')).toBeTruthy();
    });

    it('Ошибка загрузки -> «Повторить»', () => {
      const listings = renderList({ items: [], error: new Error('Сервер недоступен') });
      expect(screen.getByText('Не удалось загрузить объявления')).toBeTruthy();
      expect(screen.getByText('Сервер недоступен')).toBeTruthy();
      listings.refresh.mockClear();
      fireEvent.press(screen.getByText('Повторить'));
      expect(listings.refresh).toHaveBeenCalled();
    });
  });

  describe('ДОБАВЛЕНИЕ ТОВАРА (ADDPRODUCT)', () => {
    const config = {
      currency: 'EUR',
      colors: [{ value: 'black', label: 'Чёрный' }, { value: 'white', label: 'Белый' }],
      conditions: [{ value: 'new', label: 'Новое' }, { value: 'good', label: 'Хорошее' }],
      sizeSystems: [
        { system: 'eu_shoes', label: 'EU (обувь)', input_type: 'numeric', min: 40, max: 41, step: 0.5 },
        { system: 'letters', label: 'Буквенный', input_type: 'select', values: ['S', 'M', 'L'] },
        { system: 'jeans', label: 'Джинсы', input_type: 'waist_inseam', min_waist: 24, max_waist: 40, min_inseam: 28, max_inseam: 36 },
        { system: 'one_size', label: 'Без размера', input_type: 'none' },
      ],
      maxImages: 3,
    };
    const categories = [
      { id: 'root', name: 'Обувь', is_leaf: false },
      { id: 'sneakers', name: 'Кроссовки', parent_id: 'root', is_leaf: true },
      { id: 'boots', name: 'Ботинки', parent_id: 'root', is_leaf: true },
      { id: 'clothes', name: 'Одежда', is_leaf: false },
      { id: 'jeans', name: 'Джинсы', parent_id: 'clothes', is_leaf: true },
      { id: 'acc', name: 'Аксессуары', is_leaf: false },
      { id: 'bags', name: 'Сумки', parent_id: 'acc', is_leaf: true },
    ];
    const brands = [{ id: 'b1', name: 'Nike' }, { id: 'b2', name: 'Adidas' }];

    beforeEach(() => {
      setConfig(config);
      listCategories.mockResolvedValue({ data: categories });
      listBrands.mockResolvedValue({ data: brands });
    });

    const renderForm = async () => {
      const listings = setMyListings();
      render(<AddProductScreen navigation={navigation} />);
      await waitFor(() => expect(listBrands).toHaveBeenCalled());
      await act(async () => {});
      return listings;
    };
    const choose = (placeholder, option) => {
      fireEvent.press(screen.getByText(placeholder));
      fireEvent.press(screen.getByText(option));
    };
    const addPhotos = async (...uris) => {
      ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: false, assets: uris.map((uri) => ({ uri })) });
      fireEvent.press(screen.getByLabelText('Добавить фото'));
      fireEvent.press(screen.getByText('Галерея'));
      await waitFor(() => expect(getImage(uris[uris.length - 1])).toBeTruthy());
    };
    const fillValidForm = async () => {
      choose('Выберите категорию', 'Обувь › Кроссовки');
      await addPhotos('file:///1.jpg', 'file:///2.jpg');
      choose('Без бренда', 'Nike');
      fireEvent.changeText(screen.getByPlaceholderText('Например, Air Max 90'), '  Air Max 90 ');
      fireEvent.press(screen.getByLabelText('Чёрный'));
      fireEvent.press(screen.getByText('EU (обувь)'));
      fireEvent.press(screen.getByText('40.5'));
      fireEvent.changeText(screen.getByPlaceholderText('8900'), '89,90');
      fireEvent.press(screen.getByText('Хорошее'));
      fireEvent.changeText(screen.getByPlaceholderText(/Расскажите о состоянии/), 'Носил аккуратно');
    };
    const publishBtn = () => screen.getByText('Опубликовать');

    it('Стрелка назад', async () => {
      await renderForm();
      fireEvent.press(screen.getByLabelText('Назад'));
      expect(navigation.goBack).toHaveBeenCalled();
    });

    // Заполненная форма не должна закрываться молча: «Назад» сначала спрашивает.
    const leaveEvent = () => ({ preventDefault: jest.fn(), data: { action: { type: 'GO_BACK' } } });

    it('«Назад» с пустой формой уходит без вопроса', async () => {
      await renderForm();
      const event = leaveEvent();
      act(() => navigation.emit('beforeRemove', event));
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(screen.queryByText('Выйти без сохранения?')).toBeNull();
    });

    it('«Назад» с заполненной формой -> «Выйти без сохранения?» -> Остаться', async () => {
      await renderForm();
      fireEvent.changeText(screen.getByPlaceholderText('Например, Air Max 90'), 'Samba');
      const event = leaveEvent();
      act(() => navigation.emit('beforeRemove', event));
      expect(event.preventDefault).toHaveBeenCalled();
      expect(screen.getByText('Выйти без сохранения?')).toBeTruthy();
      fireEvent.press(screen.getByText('Остаться'));
      expect(navigation.dispatch).not.toHaveBeenCalled();
      expect(screen.getByPlaceholderText('Например, Air Max 90').props.value).toBe('Samba');
    });

    it('«Выйти без сохранения?» -> Выйти', async () => {
      await renderForm();
      fireEvent.changeText(screen.getByPlaceholderText('8900'), '100');
      act(() => navigation.emit('beforeRemove', leaveEvent()));
      fireEvent.press(screen.getByText('Выйти'));
      expect(navigation.dispatch).toHaveBeenCalledWith({ type: 'GO_BACK' });
    });

    it('Баннер ошибки справочников -> повтор', async () => {
      listCategories.mockRejectedValueOnce(new Error('offline'));
      const cfg = setConfig(config);
      render(<AddProductScreen navigation={navigation} />);
      const banner = await screen.findByText(/Не удалось загрузить справочники/);
      fireEvent.press(banner);
      expect(cfg.reload).toHaveBeenCalled();
      await waitFor(() => expect(listCategories).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(screen.queryByText(/Не удалось загрузить справочники/)).toBeNull());
    });

    it('Дропдаун «Категория»', async () => {
      await renderForm();
      fireEvent.press(screen.getByText('Выберите категорию'));
      // Только листовые категории, с полным путём, по алфавиту.
      expect(screen.getByText('Обувь › Ботинки')).toBeTruthy();
      expect(screen.getByText('Обувь › Кроссовки')).toBeTruthy();
      expect(screen.queryByText(/^Обувь$/)).toBeNull();
      fireEvent.press(screen.getByText('Обувь › Кроссовки'));
      expect(screen.getByText('Обувь › Кроссовки')).toBeTruthy();
      expect(screen.queryByText('Обувь › Ботинки')).toBeNull(); // список закрылся
    });

    it('Дропдаун «Бренд»', async () => {
      await renderForm();
      // По умолчанию выбрано «Без бренда» — бренд необязателен.
      fireEvent.press(screen.getByText('Без бренда'));
      expect(screen.getAllByText('Без бренда')).toHaveLength(2); // поле + пункт списка
      fireEvent.press(screen.getByText('Adidas'));
      expect(screen.getByText('Adidas')).toBeTruthy();
      expect(screen.queryByText('Nike')).toBeNull();
    });

    it('Кружки «Цвет»', async () => {
      await renderForm();
      fireEvent.press(screen.getByLabelText('Белый'));
      expect(screen.getByLabelText('Белый').props.accessibilityState.selected).toBe(true);
      expect(screen.getByText(/· Белый/)).toBeTruthy();
    });

    it('Размер: сначала категория, потом система и значение чипсами', async () => {
      await renderForm();
      expect(screen.getByText('Сначала выберите категорию')).toBeTruthy();
      choose('Выберите категорию', 'Одежда › Джинсы');
      // Одежде подходят буквенные размеры и джинсы — выбираем систему.
      fireEvent.press(screen.getByText('Буквенный'));
      fireEvent.press(screen.getByText('M'));
      expect(screen.getByText('M').parent.parent.props.accessibilityState?.selected ?? true).toBeTruthy();
      // Смена системы сбрасывает выбранный размер.
      fireEvent.press(screen.getByText('Джинсы'));
      expect(screen.queryByText('M')).toBeNull();
    });

    it('Размер обуви: значения min..max с шагом', async () => {
      await renderForm();
      choose('Выберите категорию', 'Обувь › Кроссовки');
      fireEvent.press(screen.getByText('EU (обувь)'));
      // numeric: min..max с шагом, без хвоста «.0».
      ['40', '40.5', '41'].forEach((v) => expect(screen.getByText(v)).toBeTruthy());
      fireEvent.press(screen.getByText('40.5'));
      expect(screen.getByText('40.5')).toBeTruthy();
    });

    it('Поля «Обхват талии» / «Длина по шву»', async () => {
      await renderForm();
      choose('Выберите категорию', 'Одежда › Джинсы');
      fireEvent.press(screen.getByText('Джинсы'));
      const waist = screen.getByPlaceholderText('24–40');
      const inseam = screen.getByPlaceholderText('28–36');
      fireEvent.changeText(waist, '3a2');
      expect(screen.getByPlaceholderText('24–40').props.value).toBe('32');
      fireEvent.changeText(inseam, '34');
      expect(screen.getByPlaceholderText('28–36').props.value).toBe('34');
    });

    it('Кнопка «+» добавить фото', async () => {
      await renderForm();
      expect(screen.getByText(/^Фотографии · 0\/3/)).toBeTruthy();
      await addPhotos('file:///1.jpg', 'file:///2.jpg');
      expect(screen.getByText(/^Фотографии · 2\/3/)).toBeTruthy();
      expect(screen.getByText('ГЛАВНОЕ')).toBeTruthy();
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({ selectionLimit: 3 }));
      await addPhotos('file:///3.jpg');
      // Лимит достигнут — кнопка «+» пропадает.
      expect(screen.queryByLabelText('Добавить фото')).toBeNull();
    });

    it('Добавить фото без доступа к галерее -> алерт', async () => {
      ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ granted: false });
      await renderForm();
      fireEvent.press(screen.getByLabelText('Добавить фото'));
      fireEvent.press(screen.getByText('Галерея'));
      await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Нет доступа к фото', expect.any(String)));
    });

    it('Удаление фото («x» на миниатюре)', async () => {
      await renderForm();
      await addPhotos('file:///1.jpg', 'file:///2.jpg');
      fireEvent.press(screen.getAllByLabelText('Удалить фото')[0]);
      expect(queryImage('file:///1.jpg')).toBeNull();
      expect(getImage('file:///2.jpg')).toBeTruthy();
      expect(screen.getByText(/^Фотографии · 1\/3/)).toBeTruthy();
    });

    it('Чипы «Состояние»', async () => {
      await renderForm();
      fireEvent.press(screen.getByText('Новое'));
      fireEvent.press(screen.getByText('Хорошее'));
      // Одиночный выбор: в публикацию уйдёт последнее выбранное (проверено ниже).
      expect(screen.getByText('Хорошее')).toBeTruthy();
    });

    it('Поле «Название»', async () => {
      await renderForm();
      fireEvent.changeText(screen.getByPlaceholderText('Например, Air Max 90'), 'Samba');
      expect(screen.getByPlaceholderText('Например, Air Max 90').props.value).toBe('Samba');
    });

    it('Поле «Цена»', async () => {
      await renderForm();
      expect(screen.getByText(/^Цена, €/)).toBeTruthy();
      fireEvent.changeText(screen.getByPlaceholderText('8900'), '1 2a00');
      expect(screen.getByPlaceholderText('8900').props.value).toBe('1200');
    });

    it('Поле «Описание»', async () => {
      await renderForm();
      const field = screen.getByPlaceholderText(/Расскажите о состоянии/);
      fireEvent.changeText(field, 'Без дефектов');
      expect(screen.getByPlaceholderText(/Расскажите о состоянии/).props.value).toBe('Без дефектов');
    });

    it('Кнопка «Опубликовать» (неактивна)', async () => {
      await renderForm();
      fireEvent.press(publishBtn());
      expect(createProduct).not.toHaveBeenCalled();
      // Всё заполнено, кроме описания — всё равно неактивна.
      await fillValidForm();
      fireEvent.changeText(screen.getByPlaceholderText(/Расскажите о состоянии/), '   ');
      fireEvent.press(publishBtn());
      expect(createProduct).not.toHaveBeenCalled();
    });

    it('Кнопка «Опубликовать» (валидно)', async () => {
      const listings = await renderForm();
      await fillValidForm();
      fireEvent.press(publishBtn());
      await waitFor(() => expect(createProduct).toHaveBeenCalledTimes(1));
      expect(createProduct).toHaveBeenCalledWith({
        category_id: 'sneakers',
        brand_id: 'b1',
        title: 'Air Max 90',
        description: 'Носил аккуратно',
        price_minor: 899000,
        condition: 'good',
        color: 'black',
        size_system: 'eu_shoes',
        size_value: '40.5',
        images: [{ url: '/media/files/1.jpg', position: 0 }, { url: '/media/files/2.jpg', position: 1 }],
      });
      expect(listings.reloadAfterChange).toHaveBeenCalled();
    });

    it('Опубликовать: джинсы уходят размером «талия x шов»', async () => {
      await renderForm();
      await fillValidForm();
      choose('Обувь › Кроссовки', 'Одежда › Джинсы');
      fireEvent.press(screen.getByText('Джинсы'));
      fireEvent.changeText(screen.getByPlaceholderText('24–40'), '32');
      fireEvent.changeText(screen.getByPlaceholderText('28–36'), '99'); // вне диапазона
      fireEvent.press(publishBtn());
      expect(createProduct).not.toHaveBeenCalled();
      fireEvent.changeText(screen.getByPlaceholderText('28–36'), '34');
      fireEvent.press(publishBtn());
      await waitFor(() => expect(createProduct).toHaveBeenCalledWith(expect.objectContaining({
        size_system: 'jeans', size_value: '32x34',
      })));
    });

    // QA 15.10: для сумок предлагались размеры одежды и обуви.
    it('Сумки: только «Без размера», выбирается само; у обуви нет размеров одежды', async () => {
      await renderForm();
      choose('Выберите категорию', 'Обувь › Кроссовки');
      expect(screen.getByText('EU (обувь)')).toBeTruthy();
      expect(screen.queryByText('Буквенный')).toBeNull();
      expect(screen.queryByText('Джинсы')).toBeNull();
      choose('Обувь › Кроссовки', 'Аксессуары › Сумки');
      expect(screen.getByText('Без размера')).toBeTruthy();
      expect(screen.queryByText('EU (обувь)')).toBeNull();
      expect(screen.queryByText('Буквенный')).toBeNull();
      expect(screen.queryByText('40.5')).toBeNull();
    });

    it('Экран успеха -> «Отлично»', async () => {
      await renderForm();
      await fillValidForm();
      fireEvent.press(publishBtn());
      expect(await screen.findByText('Товар опубликован')).toBeTruthy();
      fireEvent.press(screen.getByText('Отлично'));
      expect(navigation.goBack).toHaveBeenCalled();
    });

    it('Ошибка публикации -> текст ошибки', async () => {
      createProduct.mockRejectedValueOnce(Object.assign(new Error('Проверьте поля'), {
        fields: [{ field: 'title', message: 'слишком длинное' }],
      }));
      await renderForm();
      await fillValidForm();
      fireEvent.press(publishBtn());
      expect(await screen.findByText('Проверьте поля\ntitle: слишком длинное')).toBeTruthy();
      // Повторная попытка не загружает уже залитые фото заново.
      const uploads = uploadImage.mock.calls.length;
      fireEvent.press(publishBtn());
      await waitFor(() => expect(createProduct).toHaveBeenCalledTimes(2));
      expect(uploadImage.mock.calls.length).toBe(uploads);
    });
  });

  describe('РЕДАКТИРОВАНИЕ ТОВАРА', () => {
    beforeEach(() => {
      setConfig({
        currency: 'EUR',
        colors: [{ value: 'black', label: 'Чёрный' }, { value: 'white', label: 'Белый' }],
        conditions: [{ value: 'new', label: 'Новое' }, { value: 'good', label: 'Хорошее' }],
        sizeSystems: [
          { system: 'eu_shoes', label: 'EU (обувь)', input_type: 'numeric', min: 40, max: 41, step: 0.5 },
          { system: 'one_size', label: 'Без размера', input_type: 'none' },
        ],
        maxImages: 3,
      });
      listCategories.mockResolvedValue({ data: [
        { id: 'root', name: 'Обувь', is_leaf: false },
        { id: 'sneakers', name: 'Кроссовки', parent_id: 'root', is_leaf: true },
      ] });
      listBrands.mockResolvedValue({ data: [{ id: 'b1', name: 'Nike' }] });
      getProduct.mockReset().mockResolvedValue({
        id: 'p1', title: 'Air Max 90', description: 'Носил аккуратно', price_minor: 899000,
        condition: 'good', color: 'black', size_system: 'eu_shoes', size_value: '40.5',
        category: { id: 'sneakers' }, brand: { id: 'b1', name: 'Nike' },
        images: [{ id: 'i1', url: '/media/files/a.jpg', position: 0 }, { id: 'i2', url: '/media/files/b.jpg', position: 1 }],
      });
      updateProduct.mockClear(); addProductImage.mockClear(); deleteProductImage.mockClear();
    });

    it('Форма заполнена данными товара; «Сохранить» — после правки', async () => {
      setMyListings();
      render(<AddProductScreen navigation={navigation} route={{ params: { editId: 'p1' } }} />);
      expect(screen.getByText('Редактирование')).toBeTruthy();
      await waitFor(() => expect(screen.getByDisplayValue('Air Max 90')).toBeTruthy());
      await act(async () => {});
      expect(screen.getByDisplayValue('8990')).toBeTruthy();
      // Без правок сохранять нечего.
      fireEvent.press(screen.getByText('Сохранить'));
      expect(updateProduct).not.toHaveBeenCalled();
      fireEvent.changeText(screen.getByDisplayValue('8990'), '7500');
      fireEvent.press(screen.getAllByLabelText('Удалить фото')[1]);
      fireEvent.press(screen.getByText('Сохранить'));
      await waitFor(() => expect(updateProduct).toHaveBeenCalledWith('p1', expect.objectContaining({
        title: 'Air Max 90', price_minor: 750000, size_system: 'eu_shoes', size_value: '40.5', color: 'black',
      })));
      await waitFor(() => expect(deleteProductImage).toHaveBeenCalledWith('p1', 'i2'));
      expect(addProductImage).not.toHaveBeenCalled();
      expect(createProduct).not.toHaveBeenCalled();
      expect(await screen.findByText('Изменения сохранены')).toBeTruthy();
    });
  });

  describe('ПРОДАЖИ (ORDERS)', () => {
    const sale = (id, title, brand) => ({
      id, confirmed_at: '2026-09-01T12:00:00Z',
      product: { id: `p-${id}`, title, brand: { name: brand }, price_minor: 320000 },
    });
    beforeEach(() => {
      listMyPurchases.mockReset().mockResolvedValue({ data: [] });
      listMySales.mockReset().mockResolvedValue({
        data: [sale('s1', 'Air Max 90', 'Nike'), sale('s2', 'Футболка', 'Carhartt WIP')],
      });
    });

    it('Стрелка назад', async () => {
      render(<OrdersScreen navigation={navigation} />);
      await screen.findByText('Nike Air Max 90');
      fireEvent.press(screen.getByLabelText('Назад'));
      expect(navigation.goBack).toHaveBeenCalled();
    });

    it('Строки сделок (проверить кликабельность)', async () => {
      render(<OrdersScreen navigation={navigation} />);
      expect(screen.getByText('Подтверждённые продажи')).toBeTruthy();
      expect(await screen.findByText('Carhartt WIP Футболка')).toBeTruthy();
      expect(screen.getAllByText(/^Продажа · /).length).toBeGreaterThanOrEqual(2);
      // Продавцу оставлять отзыв не на что — строки продаж не открываются.
      fireEvent.press(screen.getByText('Carhartt WIP Футболка'));
      expect(screen.queryByText('Оставить отзыв')).toBeNull();
      // Продавцу — его подтверждения продаж, а не покупки.
      expect(listMySales).toHaveBeenCalledWith({ limit: 50 });
      expect(listMyPurchases).not.toHaveBeenCalled();
    });

    it('Пустой список -> «Пока нет продаж»', async () => {
      listMySales.mockResolvedValue({ data: [] });
      render(<OrdersScreen navigation={navigation} />);
      expect(await screen.findByText('Пока нет продаж')).toBeTruthy();
    });
  });
});
