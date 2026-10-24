// Русское склонение по числу: plural(1, ['отзыв', 'отзыва', 'отзывов']) -> 'отзыв'.
export function plural(n, [one, few, many]) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

export function reviewsCount(n) {
  const count = n ?? 0;
  return `${count} ${plural(count, ['отзыв', 'отзыва', 'отзывов'])}`;
}
