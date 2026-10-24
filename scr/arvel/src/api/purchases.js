import { request, buildQuery } from './client';

// Подтверждения покупок: для покупателя — его история покупок, для продавца —
// подтверждения, которые он выдал. Схема ответа у обоих одинаковая.

export function listMyPurchases({ cursor, limit } = {}) {
  return request(`/me/purchases${buildQuery({ cursor, limit })}`);
}

export function listMySales({ cursor, limit } = {}) {
  return request(`/purchase-confirmations${buildQuery({ cursor, limit })}`);
}

// Только для продавца и только по своему товару: фиксирует, что buyerId купил
// productId. После этого покупатель может оставить отзыв на товар.
export function confirmSale({ buyerId, productId }) {
  return request('/purchase-confirmations', {
    method: 'POST',
    body: { buyer_id: buyerId, product_id: productId },
  });
}
