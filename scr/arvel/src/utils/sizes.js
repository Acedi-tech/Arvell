// Значения размера по правилу из GET /config → size_systems.
// select — готовый список, numeric — min..max с шагом (без хвоста ".0").
// Для waist_inseam и none готового списка нет — вернётся [].
export function sizeOptionsFor(rule) {
  if (!rule) return [];
  if (rule.input_type === 'select') return (rule.values || []).map(String);
  if (rule.input_type === 'numeric') {
    const out = [];
    const count = Math.round((rule.max - rule.min) / rule.step);
    for (let i = 0; i <= count; i += 1) {
      out.push(String(Math.round((rule.min + i * rule.step) * 100) / 100));
    }
    return out;
  }
  return [];
}

// Какие системы размеров предлагать в форме товара для выбранной категории.
// В справочнике категорий бэкенда привязки к размерам нет, а GET /config
// отдаёт все системы разом — без фильтра для «Аксессуары › Сумки» в списке
// были буквенные размеры одежды и размеры обуви. Категорию узнаём по
// названиям и slug всего её пути. Незнакомая категория — показываем всё,
// чтобы не запереть продавца без подходящего варианта.
const BAG_RE = /сумк|рюкзак|клатч|кошел|портмоне|портфел|bag|backpack|wallet|clutch/i;
const SHOE_RE = /обув|кроссов|кед|ботин|сапог|туфл|сандал|босонож|лофер|мокасин|слипон|shoe|sneaker|boot|footwear/i;
const CLOTHING_RE = /одежд|clothing|apparel/i;

const isShoeSystem = (s) => /shoe/i.test(s.system);
const isNoSize = (s) => s.input_type === 'none';

export function sizeSystemsForCategory(systems, categoryPath) {
  const text = (categoryPath || []).join(' ');
  if (!text) return systems;
  if (BAG_RE.test(text)) {
    const noSize = systems.filter(isNoSize);
    return noSize.length ? noSize : systems;
  }
  if (SHOE_RE.test(text)) return systems.filter((s) => isShoeSystem(s) || isNoSize(s));
  if (CLOTHING_RE.test(text)) return systems.filter((s) => !isShoeSystem(s));
  return systems;
}
