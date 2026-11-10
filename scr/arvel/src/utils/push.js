import { AppState, PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Переключатель «Новые сообщения» на экране «Уведомления». Выключен —
// токен снимаем с сервера и не регистрируем, пока не включат обратно.
export const NOTIFICATION_PREFS_KEY = 'arvell.notification_prefs';
async function chatPushMuted() {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    return raw ? JSON.parse(raw)?.msg === false : false;
  } catch {
    return false;
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Что происходило при последней попытке регистрации — для экрана
// диагностики (arvell://dev/push): видно, на каком шаге обрывается цепочка.
const status = {
  startedAt: null, permission: null, apns: null, apnsSource: null,
  fcm: null, server: null, error: null, finishedAt: null,
};
const statusListeners = new Set();
function setStatus(patch) {
  Object.assign(status, patch);
  statusListeners.forEach((fn) => { try { fn({ ...status }); } catch { /* ignore */ } });
}
export function getPushStatus() { return { ...status }; }
export function onPushStatus(fn) { statusListeners.add(fn); return () => statusListeners.delete(fn); }
const short = (t) => (t ? `${String(t).slice(0, 10)}…` : null);

// Запасной путь к APNs-токену: модуль Expo спрашивает его у iOS напрямую,
// не полагаясь на перехват AppDelegate, через который его получает Firebase.
async function apnsFromExpo() {
  try {
    const Notifications = require('expo-notifications');
    const res = await Notifications.getDevicePushTokenAsync();
    return res?.data || null;
  } catch (e) {
    setStatus({ error: `expo: ${e?.message ?? e}` });
    return null;
  }
}

// iOS: Firebase выдаёт FCM-токен только после того, как Apple выдаст свой
// APNs-токен. Сразу после входа его ещё нет, и getToken падал — iPhone так и
// не регистрировался на сервере (09.11: у аккаунта ноль устройств). Ждём
// токен до APNS_WAIT_MS, а если Firebase его так и не увидел — берём через
// Expo и передаём Firebase сами (setAPNSToken).
const APNS_WAIT_MS = 10000;
async function waitForApns(m, messaging) {
  if (Platform.OS !== 'ios') return;
  try { await m.registerDeviceForRemoteMessages(messaging); } catch { /* уже зарегистрированы */ }
  for (let waited = 0; waited < APNS_WAIT_MS; waited += 1000) {
    let t = null;
    try { t = await m.getAPNSToken(messaging); } catch { /* ждём дальше */ }
    if (t) { setStatus({ apns: short(t), apnsSource: 'firebase' }); return; }
    await wait(1000);
  }
  const fromExpo = await apnsFromExpo();
  if (fromExpo) {
    await m.setAPNSToken(messaging, fromExpo, 'unknown');
    setStatus({ apns: short(fromExpo), apnsSource: 'expo' });
    return;
  }
  setStatus({ apns: 'нет' });
  throw new Error('iOS не выдал APNs-токен');
}

async function registerOnce(m, messaging) {
  setStatus({ startedAt: new Date().toISOString(), error: null, finishedAt: null });
  await waitForApns(m, messaging);
  const token = await m.getToken(messaging);
  if (!token) throw new Error('Firebase не выдал токен');
  setStatus({ fcm: short(token) });
  currentToken = token;
  try {
    await devicesApi.registerDevice(token, Platform.OS);
    setStatus({ server: 'ok', finishedAt: new Date().toISOString() });
  } catch (e) {
    setStatus({ server: `ошибка: ${e?.status ?? ''} ${e?.message ?? e}` });
    throw e;
  }
}

let retryRegistration = null;
// Для кнопки «Повторить» на экране диагностики.
export async function retryPushRegistration() {
  if (retryRegistration) await retryRegistration(true);
}

// Спрашивает разрешение, регистрирует токен на сервере и следит за его
// обновлением. Если регистрация не удалась (нет сети, Apple не успел выдать
// токен), повторяет при каждом возвращении в приложение. Возвращает функцию
// отписки. Ошибки не пробрасывает: без пушей приложение работает как раньше.
export async function enablePush() {
  const m = loadMessaging();
  if (!m) { setStatus({ error: 'нет модуля Firebase в сборке' }); return () => {}; }
  try {
    const allowed = await askPermission(m);
    setStatus({ permission: allowed ? 'разрешено' : 'запрещено' });
    if (!allowed) return () => {};
    const messaging = m.getMessaging();
    let registered = false;
    let inFlight = false;
    const attempt = async (force = false) => {
      if ((registered && !force) || inFlight) return;
      inFlight = true;
      try {
        if (await chatPushMuted()) {
          setStatus({ server: 'выключено в настройках приложения' });
          return;
        }
        await registerOnce(m, messaging);
        registered = true;
      } catch (e) {
        setStatus({ error: String(e?.message ?? e) });
        console.warn('[push] не удалось зарегистрировать устройство', e?.message ?? e);
      } finally {
        inFlight = false;
      }
    };
    retryRegistration = attempt;
    await attempt();
    const offRefresh = m.onTokenRefresh(messaging, async (fresh) => {
      currentToken = fresh;
      if (await chatPushMuted()) return;
      devicesApi.registerDevice(fresh, Platform.OS).catch(() => {});
    });
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') attempt();
    });
    return () => {
      offRefresh();
      sub?.remove?.();
      if (retryRegistration === attempt) retryRegistration = null;
    };
  } catch (e) {
    setStatus({ error: String(e?.message ?? e) });
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

// Вызывает экран «Уведомления» после того, как сохранил выбор.
export async function setChatPushEnabled(on) {
  if (on) await retryPushRegistration();
  else {
    await disablePush();
    setStatus({ server: 'выключено в настройках приложения' });
  }
}

// Сервер кладёт в data пуша то же, что в payload уведомления:
// conversation_id, sender_name, preview и т. д.
export function conversationIdOf(message) {
  const d = message?.data || {};
  return d.conversation_id || d.conversationId || null;
}

// iOS: модуль Expo (запасной путь к APNs-токену) встаёт делегатом
// уведомлений системы и может забрать у Firebase и «пуш при открытом
// приложении», и нажатие на пуш. Поэтому на iOS слушаем оба источника и
// приводим к одному виду { notification: { title, body }, data }.
function loadExpoNotifications() {
  if (Platform.OS !== 'ios') return null;
  try { return require('expo-notifications'); } catch { return null; }
}
function fromExpo(n) {
  const content = n?.request?.content || {};
  const payload = n?.request?.trigger?.payload || {};
  return {
    notification: { title: content.title, body: content.body },
    data: { ...payload, ...(content.data || {}) },
  };
}
// Один и тот же пуш может прийти и от Firebase, и от Expo — показываем раз.
function deduped(handler) {
  const seen = [];
  return (msg) => {
    const key = msg?.data?.message_id || msg?.messageId;
    if (key) {
      if (seen.includes(key)) return;
      seen.push(key);
      if (seen.length > 50) seen.shift();
    }
    handler(msg);
  };
}

// Пуш, пришедший при открытом приложении. Система его в этом случае не
// показывает (ни Android, ни iOS) — показываем сами. Возвращает отписку.
export function subscribeForegroundMessages(handler) {
  const once = deduped(handler);
  const offs = [];
  const m = loadMessaging();
  if (m) {
    try { offs.push(m.onMessage(m.getMessaging(), once)); } catch { /* без Firebase */ }
  }
  const N = loadExpoNotifications();
  if (N) {
    try {
      // Системный баннер не нужен — показываем свою плашку.
      N.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
        }),
      });
      const sub = N.addNotificationReceivedListener((n) => once(fromExpo(n)));
      offs.push(() => sub.remove());
    } catch { /* без Expo */ }
  }
  return () => offs.forEach((off) => { try { off(); } catch { /* ignore */ } });
}

// Нажатие на пуш: из фона и с холодного старта. Возвращает отписку.
export function subscribeNotificationOpens(handler) {
  const once = deduped(handler);
  const offs = [];
  const m = loadMessaging();
  if (m) {
    try {
      const messaging = m.getMessaging();
      m.getInitialNotification(messaging)
        .then((msg) => { if (msg) once(msg); })
        .catch(() => {});
      offs.push(m.onNotificationOpenedApp(messaging, once));
    } catch { /* без Firebase */ }
  }
  const N = loadExpoNotifications();
  if (N) {
    try {
      N.getLastNotificationResponseAsync()
        .then((r) => { if (r?.notification) once(fromExpo(r.notification)); })
        .catch(() => {});
      const sub = N.addNotificationResponseReceivedListener((r) => once(fromExpo(r?.notification)));
      offs.push(() => sub.remove());
    } catch { /* без Expo */ }
  }
  return () => offs.forEach((off) => { try { off(); } catch { /* ignore */ } });
}
