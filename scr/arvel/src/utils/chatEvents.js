// Сигнал «в чатах что-то новое»: пуш пришёл, пока приложение открыто.
// Экраны чатов и бейдж непрочитанных подписываются и сразу перезапрашивают
// данные, не дожидаясь своего таймера.
const listeners = new Set();

export function onChatActivity(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitChatActivity(info) {
  listeners.forEach((fn) => {
    try { fn(info); } catch { /* подписчик не должен ломать остальных */ }
  });
}
