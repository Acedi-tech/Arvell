import { PermissionsAndroid, Platform } from 'react-native';
import * as devicesApi from '../api/devices';

// Пуши через Firebase Cloud Messaging: сервер рассылает их по FCM-токену,
// который приложение регистрирует через PUT /me/devices/{token}.

let messagingModule;
function loadMessaging() {
  if (Platform.OS === 'web') return null;
  if (messagingModule === undefined) {
    try {
      messagingModule = require('@react-native-firebase/messaging');
    } catch {
      // В сборке без нативного Firebase (старый dev-клиент) просто без пушей.
      messagingModule = null;
    }
  }
  return messagingModule;
}

async function askPermission(m) {
  if (Platform.OS === 'android') {
    // Android 13+ спрашивает разрешение на уведомления отдельно.
    if (Platform.Version >= 33) {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return res === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }
  const status = await m.requestPermission(m.getMessaging());
  return (
    status === m.AuthorizationStatus.AUTHORIZED ||
    status === m.AuthorizationStatus.PROVISIONAL
  );
}

let currentToken = null;

// Спрашивает разрешение, регистрирует токен на сервере и следит за его
// обновлением. Возвращает функцию отписки. Ошибки не пробрасывает: без пушей
// приложение работает как раньше.
export async function enablePush() {
  const m = loadMessaging();
  if (!m) return () => {};
  try {
    if (!(await askPermission(m))) return () => {};
    const messaging = m.getMessaging();
    const token = await m.getToken(messaging);
    if (token) {
      currentToken = token;
      await devicesApi.registerDevice(token, Platform.OS);
    }
    return m.onTokenRefresh(messaging, (fresh) => {
      currentToken = fresh;
      devicesApi.registerDevice(fresh, Platform.OS).catch(() => {});
    });
  } catch (e) {
    console.warn('[push] не удалось включить пуши', e?.message ?? e);
    return () => {};
  }
}

// Снимает токен с аккаунта. Вызывать ДО очистки сессии — нужен access-токен.
// Ждём не дольше timeoutMs, чтобы выход из аккаунта не зависал на сети.
export async function disablePush(timeoutMs = 3000) {
  const m = loadMessaging();
  if (!m) return;
  try {
    const token = currentToken ?? (await m.getToken(m.getMessaging()));
    if (!token) return;
    currentToken = null;
    await Promise.race([
      devicesApi.unregisterDevice(token),
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  } catch {
    // Сервер сам отключит мёртвый токен при следующей рассылке.
  }
}
