import { AppState, PermissionsAndroid, Platform } from 'react-native';
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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// iOS: Firebase выдаёт FCM-токен только после того, как Apple выдаст свой
// APNs-токен. Сразу после входа его ещё нет, и getToken падал — iPhone так и
// не регистрировался на сервере (09.11: у аккаунта ноль устройств). Поэтому
// явно регистрируемся у Apple и ждём токен до APNS_WAIT_MS.
const APNS_WAIT_MS = 15000;
async function waitForApns(m, messaging) {
  if (Platform.OS !== 'ios') return;
  try { await m.registerDeviceForRemoteMessages(messaging); } catch { /* уже зарегистрированы */ }
  for (let waited = 0; waited < APNS_WAIT_MS; waited += 1000) {
    try { if (await m.getAPNSToken(messaging)) return; } catch { /* ждём дальше */ }
    await wait(1000);
  }
}

async function registerOnce(m, messaging) {
  await waitForApns(m, messaging);
  const token = await m.getToken(messaging);
  if (!token) throw new Error('Firebase не выдал токен');
  currentToken = token;
  await devicesApi.registerDevice(token, Platform.OS);
}

// Спрашивает разрешение, регистрирует токен на сервере и следит за его
// обновлением. Если регистрация не удалась (нет сети, Apple не успел выдать
// токен), повторяет при каждом возвращении в приложение. Возвращает функцию
// отписки. Ошибки не пробрасывает: без пушей приложение работает как раньше.
export async function enablePush() {
  const m = loadMessaging();
  if (!m) return () => {};
  try {
    if (!(await askPermission(m))) return () => {};
    const messaging = m.getMessaging();
    let registered = false;
    let inFlight = false;
    const attempt = async () => {
      if (registered || inFlight) return;
      inFlight = true;
      try {
        await registerOnce(m, messaging);
        registered = true;
      } catch (e) {
        console.warn('[push] не удалось зарегистрировать устройство', e?.message ?? e);
      } finally {
        inFlight = false;
      }
    };
    await attempt();
    const offRefresh = m.onTokenRefresh(messaging, (fresh) => {
      currentToken = fresh;
      devicesApi.registerDevice(fresh, Platform.OS).catch(() => {});
    });
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') attempt();
    });
    return () => {
      offRefresh();
      sub.remove();
    };
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

// Сервер кладёт в data пуша то же, что в payload уведомления:
// conversation_id, sender_name, preview и т. д.
export function conversationIdOf(message) {
  const d = message?.data || {};
  return d.conversation_id || d.conversationId || null;
}

// Пуш, пришедший при открытом приложении. Система его в этом случае не
// показывает (ни Android, ни iOS) — показываем сами. Возвращает отписку.
export function subscribeForegroundMessages(handler) {
  const m = loadMessaging();
  if (!m) return () => {};
  try {
    return m.onMessage(m.getMessaging(), handler);
  } catch {
    return () => {};
  }
}

// Нажатие на пуш: из фона (onNotificationOpenedApp) и с холодного старта
// (getInitialNotification). Возвращает отписку.
export function subscribeNotificationOpens(handler) {
  const m = loadMessaging();
  if (!m) return () => {};
  try {
    const messaging = m.getMessaging();
    m.getInitialNotification(messaging)
      .then((msg) => { if (msg) handler(msg); })
      .catch(() => {});
    return m.onNotificationOpenedApp(messaging, handler);
  } catch {
    return () => {};
  }
}
