// Окно «Фильтры» каталога: всё, что умеет GET /products — сортировка, цена
// от/до, бренд, цвет, состояние, система размеров и размер. Сервер принимает
// по одному значению на фильтр (два цвета через запятую он отклоняет с 422),
// поэтому везде одиночный выбор: повторный тап снимает значение.
//
// Правки копятся в черновике и уходят наружу только по «Показать», чтобы
// каталог не перезапрашивался на каждый тап.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, font } from '../theme';
import { CloseIcon } from './Icons';
import { useAppConfig, useMoney } from '../context/AppConfigContext';
import { sizeOptionsFor } from '../utils/sizes';

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'price_asc', label: 'Дешевле' },
  { value: 'price_desc', label: 'Дороже' },
  { value: 'rating', label: 'По рейтингу' },
];

export const EMPTY_FILTERS = {
  sort: null, brandId: null, color: null, condition: null,
  sizeSystem: null, sizeValue: null, priceMin: null, priceMax: null,
};

// Сколько фильтров выбрано — для бейджа на кнопке. Сортировка не фильтр.
export function countActiveFilters(f) {
  return ['brandId', 'color', 'condition', 'sizeSystem', 'priceMin', 'priceMax']
    .filter((k) => f[k] != null && f[k] !== '').length;
}

// Цена в поле — в рублях (целых единицах валюты), на сервер — в минорных.
const toMinor = (text) => {
  const n = Number(String(text).replace(',', '.').replace(/\s/g, ''));
  return text !== '' && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
};
const toMajorText = (minor) => (minor == null ? '' : String(Math.round(minor / 100)));

function Chips({ options, value, onChange }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <Pressable
            key={o.value}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(active ? null : o.value)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CatalogFiltersSheet({ visible, filters, brands, onApply, onClose }) {
  const { colors: colorOptions, conditions, sizeSystems } = useAppConfig();
  const { symbol } = useMoney();
  const [draft, setDraft] = useState(filters);
  const [priceMinText, setPriceMinText] = useState('');
  const [priceMaxText, setPriceMaxText] = useState('');

  // Каждое открытие начинаем с того, что сейчас применено.
  useEffect(() => {
    if (!visible) return;
    setDraft(filters);
    setPriceMinText(toMajorText(filters.priceMin));
    setPriceMaxText(toMajorText(filters.priceMax));
  }, [visible, filters]);

  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }));
  const rule = sizeSystems.find((s) => s.system === draft.sizeSystem);
  const sizeValues = sizeOptionsFor(rule);

  const apply = () => {
    let priceMin = toMinor(priceMinText);
    let priceMax = toMinor(priceMaxText);
    if (priceMin != null && priceMax != null && priceMin > priceMax) [priceMin, priceMax] = [priceMax, priceMin];
    onApply({ ...draft, priceMin, priceMax });
  };

  const reset = () => {
    setDraft(EMPTY_FILTERS);
    setPriceMinText('');
    setPriceMaxText('');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable hitSlop={10} accessibilityLabel="Закрыть фильтры" onPress={onClose}>
            <CloseIcon size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Фильтры</Text>
          <Pressable hitSlop={10} onPress={reset}>
            <Text style={styles.reset}>Сбросить</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.section}>Сортировка</Text>
          <Chips options={SORT_OPTIONS} value={draft.sort} onChange={set('sort')} />

          <Text style={styles.section}>Цена{symbol ? `, ${symbol}` : ''}</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={styles.priceInput}
              placeholder="от"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={priceMinText}
              onChangeText={setPriceMinText}
            />
            <Text style={styles.priceDash}>—</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="до"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={priceMaxText}
              onChangeText={setPriceMaxText}
            />
          </View>

          {brands.length > 0 && (
            <>
              <Text style={styles.section}>Бренд</Text>
              <Chips options={brands.map((b) => ({ value: b.id, label: b.name }))} value={draft.brandId} onChange={set('brandId')} />
            </>
          )}

          {colorOptions.length > 0 && (
            <>
              <Text style={styles.section}>Цвет</Text>
              <Chips options={colorOptions} value={draft.color} onChange={set('color')} />
            </>
          )}

          {conditions.length > 0 && (
            <>
              <Text style={styles.section}>Состояние</Text>
              <Chips options={conditions} value={draft.condition} onChange={set('condition')} />
            </>
          )}

          {sizeSystems.length > 0 && (
            <>
              <Text style={styles.section}>Размер</Text>
              <Chips
                options={sizeSystems.map((s) => ({ value: s.system, label: s.label }))}
                value={draft.sizeSystem}
                // Размер имеет смысл только внутри своей системы — при смене системы сбрасываем.
                onChange={(v) => setDraft((d) => ({ ...d, sizeSystem: v, sizeValue: null }))}
              />
              {sizeValues.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sizeScroll}>
                  <Chips options={sizeValues.map((v) => ({ value: v, label: v }))} value={draft.sizeValue} onChange={set('sizeValue')} />
                </ScrollView>
              )}
            </>
          )}
        </ScrollView>

        <Pressable style={styles.applyBtn} onPress={apply}>
          <Text style={styles.applyText}>Показать</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  title: { color: colors.text, fontSize: font.sizeLG, fontWeight: '800' },
  reset: { color: colors.accent, fontSize: font.sizeMD, fontWeight: '600' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  section: { color: colors.text, fontSize: font.sizeMD, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.pill, backgroundColor: colors.chipInactive,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  chipActive: { backgroundColor: 'transparent', borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: font.sizeSM, fontWeight: '600' },
  chipTextActive: { color: colors.accent },
  sizeScroll: { marginTop: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  priceInput: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    color: colors.text, fontSize: font.sizeMD,
  },
  priceDash: { color: colors.textMuted },
  applyBtn: {
    margin: spacing.lg, backgroundColor: colors.accent, borderRadius: radius.lg,
    paddingVertical: spacing.md + 2, alignItems: 'center',
  },
  applyText: { color: colors.accentText, fontSize: font.sizeMD, fontWeight: '800' },
});
