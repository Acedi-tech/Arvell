jest.mock('../../src/api/devices', () => ({
  registerDevice: jest.fn(async () => null),
  unregisterDevice: jest.fn(async () => null),
}));
import { onChatActivity, emitChatActivity } from '../../src/utils/chatEvents';
import { conversationIdOf } from '../../src/utils/push';

describe('пуши: сигнал «новое в чатах»', () => {
  it('подписчики получают событие, после отписки — нет', () => {
    const fn = jest.fn();
    const off = onChatActivity(fn);
    emitChatActivity({ conversationId: 'c1' });
    expect(fn).toHaveBeenCalledWith({ conversationId: 'c1' });
    off();
    emitChatActivity({ conversationId: 'c2' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('упавший подписчик не мешает остальным', () => {
    const bad = onChatActivity(() => { throw new Error('x'); });
    const good = jest.fn();
    const off = onChatActivity(good);
    emitChatActivity({});
    expect(good).toHaveBeenCalled();
    bad(); off();
  });

  it('номер переписки берётся из data пуша (как payload уведомления на сервере)', () => {
    expect(conversationIdOf({ data: { conversation_id: 'f345' } })).toBe('f345');
    expect(conversationIdOf({ data: {} })).toBeNull();
    expect(conversationIdOf(null)).toBeNull();
  });
});

describe('пуши: регистрация iPhone', () => {
  const m = require('@react-native-firebase/messaging');
  const devices = require('../../src/api/devices');
  const { AppState } = require('react-native');

  beforeEach(() => {
    devices.registerDevice.mockClear();
    m.getToken.mockReset().mockResolvedValue('test-fcm-token');
    m.getAPNSToken.mockReset().mockResolvedValue('test-apns-token');
  });

  it('ждёт токен Apple и только потом берёт FCM-токен', async () => {
    m.getAPNSToken.mockResolvedValueOnce(null).mockResolvedValue('apns');
    const { enablePush } = require('../../src/utils/push');
    const off = await enablePush();
    expect(m.registerDeviceForRemoteMessages).toHaveBeenCalled();
    expect(devices.registerDevice).toHaveBeenCalledWith('test-fcm-token', 'ios');
    off();
  });

  it('если регистрация упала, повторяет при возвращении в приложение', async () => {
    const listeners = [];
    const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((ev, fn) => {
      listeners.push(fn);
      return { remove: () => {} };
    });
    m.getToken.mockRejectedValueOnce(new Error('No APNS token'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { enablePush } = require('../../src/utils/push');
    const off = await enablePush();
    expect(devices.registerDevice).not.toHaveBeenCalled();
    await listeners[0]('active');
    await new Promise((r) => setTimeout(r, 0));
    expect(devices.registerDevice).toHaveBeenCalledWith('test-fcm-token', 'ios');
    off();
    spy.mockRestore();
  });
});

describe('пуши: запасной путь к токену Apple и диагностика', () => {
  const m = require('@react-native-firebase/messaging');
  const N = require('expo-notifications');
  const devices = require('../../src/api/devices');

  it('если Firebase не увидел токен Apple — берём его через Expo и отдаём Firebase', async () => {
    jest.useFakeTimers();
    devices.registerDevice.mockClear();
    m.getToken.mockReset().mockResolvedValue('test-fcm-token');
    m.getAPNSToken.mockReset().mockResolvedValue(null);
    const { enablePush, getPushStatus } = require('../../src/utils/push');
    const p = enablePush();
    for (let i = 0; i < 15; i += 1) { await Promise.resolve(); jest.advanceTimersByTime(1000); await Promise.resolve(); }
    jest.useRealTimers();
    const off = await p;
    expect(N.getDevicePushTokenAsync).toHaveBeenCalled();
    expect(m.setAPNSToken).toHaveBeenCalledWith(expect.anything(), 'expo-apns-token', 'unknown');
    expect(devices.registerDevice).toHaveBeenCalledWith('test-fcm-token', 'ios');
    const st = getPushStatus();
    expect(st.apnsSource).toBe('expo');
    expect(st.server).toBe('ok');
    off();
  });

  it('один и тот же пуш от Firebase и от Expo показывается один раз', () => {
    const { subscribeForegroundMessages } = require('../../src/utils/push');
    let fromFirebase; let fromExpoCb;
    m.onMessage.mockImplementationOnce((_, cb) => { fromFirebase = cb; return () => {}; });
    N.addNotificationReceivedListener.mockImplementationOnce((cb) => { fromExpoCb = cb; return { remove: () => {} }; });
    const handler = jest.fn();
    const off = subscribeForegroundMessages(handler);
    fromFirebase({ data: { message_id: 'm1', conversation_id: 'c1' } });
    fromExpoCb({ request: { content: { title: 'T', body: 'B', data: {} }, trigger: { payload: { message_id: 'm1', conversation_id: 'c1' } } } });
    expect(handler).toHaveBeenCalledTimes(1);
    off();
  });
});
