// Тело сообщения на бэкенде — одна строка. Отдельного поля под вложение у
// /conversations/{id}/messages нет, поэтому фото отправляется ссылкой на
// загруженный файл, а получатель узнаёт картинку по расширению.
const IMAGE_RE = /^(https?:\/\/|\/)\S+\.(jpg|jpeg|png|gif|webp|heic)(\?\S*)?$/i;

export function isImageBody(body) {
  return typeof body === 'string' && IMAGE_RE.test(body.trim());
}

// Без toLocaleTimeString/toLocaleDateString: на Android Hermes это вызов
// Java ICU через JNI на каждую строку списка (см. utils/price.js).
const pad2 = (n) => String(n).padStart(2, '0');

// «сейчас» в первую минуту, затем время, для прошлых дней — «Вчера» и дата.
export function formatTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  if (now - d < 60 * 1000) return 'сейчас';
  if (d.toDateString() === now.toDateString()) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}`;
}
