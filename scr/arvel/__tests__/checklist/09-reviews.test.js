// Чек-лист: ОТЗЫВЫ. Цепочка: продавец подтверждает продажу в чате ->
// покупатель оставляет отзыв (с товара или из «Завершённых сделок») ->
// отзывы видны на товаре и в магазине.
import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('@react-navigation/native', () => require('../helpers/navMock').module);
jest.mock('../../src/context/AuthContext', () => require('../helpers/mockContexts').authModule);
jest.mock('../../src/context/AppConfigContext', () => require('../helpers/mockContexts').configModule);
jest.mock('../../src/context/FavoritesContext', () => require('../helpers/mockContexts').favoritesModule);
jest.mock('../../src/api/reviews', () => ({
  listProductReviews: jest.fn(),
  listShopReviews: jest.fn(),
  listMyReviews: jest.fn(),
  createProductReview: jest.fn(),
}));
jest.mock('../../src/api/purchases', () => ({
  listMyPurchases: jest.fn(),
  listMySales: jest.fn(),
  confirmSale: jest.fn(),
}));
jest.mock('../../src/api/shops', () => ({ getShop: jest.fn(async () => null), getMyShop: jest.fn(), updateMyShop: jest.fn() }));
jest.mock('../../src/api/products', () => ({
  listProducts: jest.fn(async () => ({ data: [], page: { has_more: false } })),
  getProduct: jest.fn(),
}));
jest.mock('../../src/api/chat', () => ({
  listConversations: jest.fn(),
  openConversation: jest.fn(),
  getConversation: jest.fn(),
  listMessages: jest.fn(async () => ({ data: [] })),
  sendMessage: jest.fn(),
  markConversationRead: jest.fn(async () => null),
}));

const { createNavigation } = require('../helpers/navMock');
const { setAuth, resetContexts } = require('../helpers/mockContexts');
const reviewsApi = require('../../src/api/reviews');
const purchasesApi = require('../../src/api/purchases');
const shopsApi = require('../../src/api/shops');
const { getProduct } = require('../../src/api/products');
const chatApi = require('../../src/api/chat');

import WriteReviewScreen from '../../src/screens/WriteReviewScreen';
import ReviewsScreen from '../../src/screens/ReviewsScreen';
import ProductScreen from '../../src/screens/ProductScreen';
import ShopScreen from '../../src/screens/ShopScreen';
import OrdersScreen from '../../src/screens/OrdersScreen';
import ConversationScreen from '../../src/screens/ConversationScreen';
import { reviewsCount } from '../../src/utils/plural';

const review = {
  id: 'r1', product_id: 'p1', rating: 5, comment: 'Всё как в описании',
  buyer: { id: 'u2', display_name: 'Мария' }, status: 'published', created_at: '2026-10-20T10:00:00Z',
};
const product = {
  id: 'p1', title: 'Air Max 90', brand: { name: 'Nike' }, price_minor: 890000,
  condition: 'excellent', size_value: '42', images: [], rating: 5, rating_count: 1,
  seller: { id: 'shop1', seller_id: 's-owner', shop_name: 'Alex Shop', rating: 4.8, rating_count: 12 },
  viewer_context: { has_favorited: false, can_review: false, my_review_id: null },
};

let navigation;
beforeEach(() => {
  resetContexts();
  navigation = createNavigation();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  reviewsApi.listProductReviews.mockReset().mockResolvedValue({ data: [review], page: { has_more: false } });
  reviewsApi.listShopReviews.mockReset().mockResolvedValue({ data: [review], page: { has_more: false } });
  reviewsApi.listMyReviews.mockReset().mockResolvedValue({ data: [], page: { has_more: false } });
  reviewsApi.createProductReview.mockReset().mockResolvedValue(review);
  purchasesApi.listMyPurchases.mockReset().mockResolvedValue({ data: [], page: { has_more: false } });
  purchasesApi.listMySales.mockReset().mockResolvedValue({ data: [], page: { has_more: false } });
  purchasesApi.confirmSale.mockReset().mockResolvedValue({ id: 'pc1' });
  getProduct.mockReset().mockResolvedValue(product);
  chatApi.getConversation.mockReset();
});

describe('ОТЗЫВЫ', () => {
  it('Склонение: 1 отзыв, 3 отзыва, 12 отзывов, 21 отзыв', () => {
    expect(reviewsCount(1)).toBe('1 отзыв');
    expect(reviewsCount(3)).toBe('3 отзыва');
    expect(reviewsCount(12)).toBe('12 отзывов');
    expect(reviewsCount(21)).toBe('21 отзыв');
    expect(reviewsCount(undefined)).toBe('0 отзывов');
  });

  describe('Форма отзыва', () => {
    const route = { params: { productId: 'p1', title: 'Nike Air Max 90' } };

    it('Кнопка неактивна, пока не выбрана оценка', () => {
      render(<WriteReviewScreen navigation={navigation} route={route} />);
      expect(screen.getByText('Nike Air Max 90')).toBeTruthy();
      fireEvent.press(screen.getByText('Отправить отзыв'));
      expect(reviewsApi.createProductReview).not.toHaveBeenCalled();
    });

    it('Оценка + комментарий -> POST, экран «Спасибо», «Готово» -> назад', async () => {
      render(<WriteReviewScreen navigation={navigation} route={route} />);
      fireEvent.press(screen.getByLabelText('Оценка 4 из 5'));
      expect(screen.getByText('Хорошо')).toBeTruthy();
      fireEvent.changeText(screen.getByPlaceholderText(/Расскажите, как прошла сделка/), '  Хороший продавец ');
      fireEvent.press(screen.getByText('Отправить отзыв'));
      expect(await screen.findByText('Спасибо за отзыв!')).toBeTruthy();
      expect(reviewsApi.createProductReview).toHaveBeenCalledWith('p1', { rating: 4, comment: 'Хороший продавец' });
      fireEvent.press(screen.getByText('Готово'));
      expect(navigation.goBack).toHaveBeenCalled();
    });

    it('Повторный отзыв (409) -> понятная ошибка', async () => {
      reviewsApi.createProductReview.mockRejectedValue(Object.assign(new Error('Conflict'), { status: 409 }));
      render(<WriteReviewScreen navigation={navigation} route={route} />);
      fireEvent.press(screen.getByLabelText('Оценка 5 из 5'));
      fireEvent.press(screen.getByText('Отправить отзыв'));
      expect(await screen.findByText('Вы уже оставили отзыв на этот товар.')).toBeTruthy();
    });

    it('Нет подтверждённой покупки (403) -> понятная ошибка', async () => {
      reviewsApi.createProductReview.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));
      render(<WriteReviewScreen navigation={navigation} route={route} />);
      fireEvent.press(screen.getByLabelText('Оценка 2 из 5'));
      fireEvent.press(screen.getByText('Отправить отзыв'));
      expect(await screen.findByText(/после того, как продавец подтвердит продажу/)).toBeTruthy();
    });
  });

  describe('Список отзывов', () => {
    it('Отзывы магазина: сводка и отзыв', async () => {
      render(<ReviewsScreen navigation={navigation} route={{ params: { shopId: 'shop1', title: 'Alex Shop', rating: 4.8, ratingCount: 12 } }} />);
      expect(await screen.findByText('Всё как в описании')).toBeTruthy();
      expect(screen.getByText('Мария')).toBeTruthy();
      expect(screen.getByText('4.8')).toBeTruthy();
      expect(screen.getByText('12 отзывов')).toBeTruthy();
      expect(reviewsApi.listShopReviews).toHaveBeenCalledWith('shop1', { cursor: undefined, limit: 20 });
    });

    it('Отзывы товара: пустое состояние', async () => {
      reviewsApi.listProductReviews.mockResolvedValue({ data: [], page: { has_more: false } });
      render(<ReviewsScreen navigation={navigation} route={{ params: { productId: 'p1' } }} />);
      expect(await screen.findByText('Пока нет отзывов')).toBeTruthy();
    });
  });

  describe('Товар', () => {
    const route = { params: { id: 'p1' } };

    it('Отзывы о товаре видны, «Все» -> Reviews', async () => {
      render(<ProductScreen navigation={navigation} route={route} />);
      expect(await screen.findByText('Всё как в описании')).toBeTruthy();
      expect(screen.getByText('· 1 отзыв')).toBeTruthy();
      fireEvent.press(screen.getByText('Все'));
      expect(navigation.navigate).toHaveBeenCalledWith('Reviews', expect.objectContaining({ productId: 'p1' }));
      expect(screen.queryByText('Оставить отзыв')).toBeNull();
    });

    it('can_review -> «Оставить отзыв» открывает форму', async () => {
      getProduct.mockResolvedValue({ ...product, viewer_context: { can_review: true, has_favorited: false } });
      render(<ProductScreen navigation={navigation} route={route} />);
      fireEvent.press(await screen.findByText('Оставить отзыв'));
      expect(navigation.navigate).toHaveBeenCalledWith('WriteReview', expect.objectContaining({ productId: 'p1', title: 'Nike Air Max 90' }));
    });

    it('Уже оставлен отзыв -> подпись вместо кнопки', async () => {
      getProduct.mockResolvedValue({ ...product, viewer_context: { can_review: false, my_review_id: 'r1' } });
      render(<ProductScreen navigation={navigation} route={route} />);
      expect(await screen.findByText('Вы уже оставили отзыв на этот товар')).toBeTruthy();
    });
  });

  it('Магазин: данные с сервера, последние отзывы и «Все отзывы»', async () => {
    shopsApi.getShop.mockResolvedValueOnce({
      id: 'shop1', shop_name: 'Alex Shop', description: 'Кроссовки и худи, встречи у м. Тверская',
      rating: 4.5, rating_count: 2, product_count: 3,
    });
    render(<ShopScreen navigation={navigation} route={{ params: { shopId: 'shop1' } }} />);
    expect(await screen.findByText('Кроссовки и худи, встречи у м. Тверская')).toBeTruthy();
    expect(screen.getByText('4.5 · 2 отзыва')).toBeTruthy();
    expect(screen.getByText('3 объявления')).toBeTruthy();
    expect(screen.getByText('Проверенный продавец', { exact: false })).toBeTruthy();
    expect(await screen.findByText('Всё как в описании')).toBeTruthy();
    expect(reviewsApi.listShopReviews).toHaveBeenCalledWith('shop1', { limit: 3 });
    fireEvent.press(screen.getByText('Все отзывы'));
    expect(navigation.navigate).toHaveBeenCalledWith('Reviews', { shopId: 'shop1', title: 'Alex Shop', rating: 4.5, ratingCount: 2 });
  });

  it('Магазин: строка рейтинга -> Reviews', async () => {
    render(<ShopScreen navigation={navigation} route={{ params: { shopId: 'shop1', shopName: 'Alex Shop', rating: 4.8, ratingCount: 12 } }} />);
    fireEvent.press(screen.getByText('4.8 · 12 отзывов'));
    expect(navigation.navigate).toHaveBeenCalledWith('Reviews', { shopId: 'shop1', title: 'Alex Shop', rating: 4.8, ratingCount: 12 });
  });

  describe('Завершённые сделки (покупатель)', () => {
    const deal = {
      id: 'pc1', confirmed_at: '2026-10-20T10:00:00Z',
      product: { id: 'p1', title: 'Air Max 90', brand: { name: 'Nike' }, price_minor: 890000 },
    };

    it('Сделка без отзыва -> «Оставить отзыв» -> форма', async () => {
      purchasesApi.listMyPurchases.mockResolvedValue({ data: [deal], page: { has_more: false } });
      render(<OrdersScreen navigation={navigation} />);
      fireEvent.press(await screen.findByText('Nike Air Max 90'));
      fireEvent.press(screen.getByText('Оставить отзыв'));
      expect(navigation.navigate).toHaveBeenCalledWith('WriteReview', expect.objectContaining({ productId: 'p1' }));
    });

    it('Сделка с отзывом -> подпись', async () => {
      purchasesApi.listMyPurchases.mockResolvedValue({ data: [deal], page: { has_more: false } });
      reviewsApi.listMyReviews.mockResolvedValue({ data: [review], page: { has_more: false } });
      render(<OrdersScreen navigation={navigation} />);
      await waitFor(() => expect(reviewsApi.listMyReviews).toHaveBeenCalled());
      fireEvent.press(await screen.findByText('Nike Air Max 90'));
      expect(await screen.findByText('Вы уже оставили отзыв на эту покупку')).toBeTruthy();
      expect(screen.queryByText('Оставить отзыв')).toBeNull();
    });
  });

  describe('Подтверждение продажи в чате', () => {
    const conv = {
      id: 'c1', status: 'open',
      product: { id: 'p1', title: 'Air Max 90', brand: { name: 'Nike' } },
      buyer: { id: 'u2', display_name: 'Мария' },
      seller: { id: 'shop1', seller_id: 'u1', shop_name: 'Alex Shop' },
    };
    const route = { params: { conversationId: 'c1', name: 'Мария' } };

    it('Продавец: «Подтвердить продажу» -> диалог -> POST', async () => {
      setAuth({ user: { id: 'u1', name: 'Иван', role: 'seller' } });
      chatApi.getConversation.mockResolvedValue(conv);
      render(<ConversationScreen navigation={navigation} route={route} />);
      fireEvent.press(await screen.findByText('Подтвердить продажу'));
      expect(screen.getByText(/Мария купил\(а\) у вас «Nike Air Max 90»/)).toBeTruthy();
      fireEvent.press(screen.getByText('Подтвердить'));
      await waitFor(() => expect(purchasesApi.confirmSale).toHaveBeenCalledWith({ buyerId: 'u2', productId: 'p1' }));
      expect(await screen.findByText(/Продажа подтверждена/)).toBeTruthy();
    });

    it('Продавец: продажа уже подтверждена -> без кнопки', async () => {
      setAuth({ user: { id: 'u1', name: 'Иван', role: 'seller' } });
      chatApi.getConversation.mockResolvedValue(conv);
      purchasesApi.listMySales.mockResolvedValue({
        data: [{ id: 'pc1', buyer: { id: 'u2' }, product: { id: 'p1' } }], page: { has_more: false },
      });
      render(<ConversationScreen navigation={navigation} route={route} />);
      expect(await screen.findByText(/Продажа подтверждена/)).toBeTruthy();
      expect(screen.queryByText('Подтвердить продажу')).toBeNull();
    });

    it('Покупатель: кнопки подтверждения нет', async () => {
      setAuth({ user: { id: 'u2', name: 'Мария', role: 'user' } });
      chatApi.getConversation.mockResolvedValue(conv);
      render(<ConversationScreen navigation={navigation} route={route} />);
      await waitFor(() => expect(chatApi.getConversation).toHaveBeenCalled());
      expect(screen.queryByText('Подтвердить продажу')).toBeNull();
    });
  });
});
