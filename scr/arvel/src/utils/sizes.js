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
