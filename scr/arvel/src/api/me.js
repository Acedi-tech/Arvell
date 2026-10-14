import { request } from './client';

export function getMe() {
  return request('/me');
}

export function updateMe(patch) {
  return request('/me', { method: 'PATCH', body: patch });
}

// Удаление аккаунта. Apple и Google требуют, чтобы его можно было удалить
// прямо из приложения.
export function deleteMe() {
  return request('/me', { method: 'DELETE' });
}
