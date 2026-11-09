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
