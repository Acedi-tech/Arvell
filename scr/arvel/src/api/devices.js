import { request } from './client';

// Push-адреса устройства. token — FCM-токен Firebase, в пути его надо
// экранировать: в нём бывают двоеточия и прочие символы.
export function registerDevice(token, platform) {
  return request(`/me/devices/${encodeURIComponent(token)}`, {
    method: 'PUT',
    body: { platform },
  });
}

export function unregisterDevice(token) {
  return request(`/me/devices/${encodeURIComponent(token)}`, { method: 'DELETE' });
}
