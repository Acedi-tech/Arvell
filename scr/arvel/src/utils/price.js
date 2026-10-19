// Символы для валют, которые может отдать GET /config (currency — ISO 4217).
// Неизвестный код показываем как есть, а не подменяем чужим символом.
const SYMBOLS = { EUR: '€', USD: '$', GBP: '£', RUB: '₽', UAH: '₴', PLN: 'zł', CZK: 'Kč' };

export function currencySymbol(code) {
  if (!code) return '';
  return SYMBOLS[code] ?? code;
}

// Сумма в основных денежных единицах -> строка с разделителями разрядов
// («1 200», «12,50»). Дробную часть показываем, только если она есть.
//
// Собираем строку вручную, а не через toLocaleString('ru-RU'): на Android
// Hermes каждый такой вызов уходит через JNI в Java ICU и стоит миллисекунды.
// Цена форматируется в каждой карточке ленты при каждой перерисовке, а их
// после старта много (кэш, свежая лента, /me, избранное, конфиг) — JS-поток
// был занят секундами, и нажатия на вкладки и кнопки висели в очереди.
const GROUP_SEP = '\u00A0'; // ru-RU делит разряды неразрывным пробелом

export function formatAmount(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  const n = Number(amount);
  const sign = n < 0 ? '-' : '';
  const cents = Math.round(Math.abs(n) * 100);
  const whole = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEP);
  const fraction = cents % 100;
  return Number.isInteger(n)
    ? `${sign}${whole}`
    : `${sign}${whole},${String(fraction).padStart(2, '0')}`;
}

// price_minor приходит с бэкенда в минорных единицах валюты (копейки/центы),
// 100 минорных = 1 основная. Раньше округляли до целых — 12,50 превращалось
// в 13, теперь центы сохраняются.
export function formatPrice(priceMinor) {
  if (priceMinor == null) return '—';
  return formatAmount(priceMinor / 100);
}

// Сумма + символ валюты из GET /config: «1 200 €». Пока конфиг не загрузился
// (currency == null) символа нет — лучше без него, чем с чужим.
export function withCurrency(valueLabel, currency) {
  const symbol = currencySymbol(currency);
  return symbol && valueLabel !== '—' ? `${valueLabel} ${symbol}` : valueLabel;
}
