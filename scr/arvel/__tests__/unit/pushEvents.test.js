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
