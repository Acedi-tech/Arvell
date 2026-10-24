import { request, buildQuery } from './client';

// Отзывы на бэкенде привязаны к товару: покупатель оценивает конкретную
// покупку, а рейтинг магазина — среднее по отзывам на все его товары.
// Оставить отзыв можно, только если продавец подтвердил продажу этому
// покупателю (POST /purchase-confirmations), и только один на товар.

export function listProductReviews(productId, { cursor, limit } = {}) {
  return request(`/products/${productId}/reviews${buildQuery({ cursor, limit })}`, { auth: false });
}

export function listShopReviews(shopId, { cursor, limit } = {}) {
  return request(`/shops/${shopId}/reviews${buildQuery({ cursor, limit })}`, { auth: false });
}

// Отзывы, которые написал текущий пользователь.
export function listMyReviews({ cursor, limit } = {}) {
  return request(`/me/reviews${buildQuery({ cursor, limit })}`);
}

// rating — целое 1..5, comment — необязательный текст.
export function createProductReview(productId, { rating, comment }) {
  return request(`/products/${productId}/reviews`, {
    method: 'POST',
    body: { rating, comment: comment || null },
  });
}
