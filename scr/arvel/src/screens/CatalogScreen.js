import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, font } from '../theme';
import { SearchIcon } from '../components/Icons';
import ProductCard from '../components/ProductCard';
import CatalogFiltersSheet, { EMPTY_FILTERS, SORT_OPTIONS, countActiveFilters } from '../components/CatalogFiltersSheet';
import { listCategories, listBrands } from '../api/catalog';
import { listProducts } from '../api/products';

const PAGE_LIMIT = 20;

export default function CatalogScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categoryId, setCategoryId] = useState(null);
  const [subcategoryId, setSubcategoryId] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  // Номер запроса: ответ на устаревший набор фильтров не должен затирать новый.
  const requestId = useRef(0);

  // Категории и бренды для чипсов — грузим один раз.
  useEffect(() => {
    listCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
    listBrands({ limit: 100 })
      .then((res) => setBrands(res.data || []))
      .catch(() => {});
  }, []);

  const topCategories = categories.filter((c) => !c.parent_id);
  const subcategories = categoryId ? categories.filter((c) => c.parent_id === categoryId) : [];

  // Вся фильтрация — на сервере. Раньше бренд отбирался на телефоне и только
  // среди первой страницы (20 товаров), поэтому часть товаров бренда пропадала,
  // а цену, цвет, состояние, размер и сортировку выбрать было нельзя вовсе.
  const query = useCallback((extra = {}) => {
    const q = { categoryId: subcategoryId || categoryId, limit: PAGE_LIMIT, ...extra };
    Object.entries(filters).forEach(([k, v]) => { if (v != null && v !== '') q[k] = v; });
    return q;
  }, [categoryId, subcategoryId, filters]);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    listProducts(query())
      .then((page) => {
        if (id !== requestId.current) return;
        setProducts(page.data || []);
        setCursor(page.page?.has_more ? page.page.next_cursor : null);
      })
      .catch((e) => { if (id === requestId.current) setError(e); })
      .finally(() => { if (id === requestId.current) setLoading(false); });
  }, [query]);

  const loadMore = () => {
    if (!cursor || loading || loadingMore) return;
    const id = requestId.current;
    setLoadingMore(true);
    listProducts(query({ cursor }))
      .then((page) => {
        if (id !== requestId.current) return;
        setProducts((prev) => [...prev, ...(page.data || []).filter((p) => !prev.some((x) => x.id === p.id))]);
        setCursor(page.page?.has_more ? page.page.next_cursor : null);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  const toggleCategory = (id) => {
    setSubcategoryId(null);
    setCategoryId((c) => (c === id ? null : id));
  };
  const toggleSubcategory = (id) => setSubcategoryId((c) => (c === id ? null : id));
  const toggleBrand = (id) => setFilters((f) => ({ ...f, brandId: f.brandId === id ? null : id }));

  const activeCount = countActiveFilters(filters);
  const sortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort)?.label;

  const Header = (
    <View>
      <Text style={styles.blockTitle}>Категории</Text>
      <View style={styles.catGrid}>
        {topCategories.map((cat) => {
          const active = categoryId === cat.id;
          return (
            <Pressable
              key={cat.id}
              style={[styles.catCard, active && styles.catCardActive]}
              onPress={() => toggleCategory(cat.id)}
            >
              <Text style={styles.catTitle}>{cat.name}</Text>
            </Pressable>
          );
        })}
      </View>

      {subcategories.length > 0 && (
        <View style={[styles.brandWrap, { marginTop: spacing.md }]}>
          {subcategories.map((c) => {
            const active = subcategoryId === c.id;
            return (
              <Pressable
                key={c.id}
                style={[styles.brandChip, active && styles.brandChipActive]}
                onPress={() => toggleSubcategory(c.id)}
              >
                <Text style={[styles.brandText, active && styles.brandTextActive]}>{c.name}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={styles.blockTitle}>Бренды</Text>
      <View style={styles.brandWrap}>
        {brands.map((b) => {
          const active = filters.brandId === b.id;
          return (
            <Pressable
              key={b.id}
              style={[styles.brandChip, active && styles.brandChipActive]}
              onPress={() => toggleBrand(b.id)}
            >
              <Text style={[styles.brandText, active && styles.brandTextActive]}>
                {b.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.filtersBtn} onPress={() => setFiltersOpen(true)}>
        <Text style={styles.filtersText}>
          Фильтры{activeCount ? ` · ${activeCount}` : ''}{sortLabel ? ` · ${sortLabel}` : ''}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.header}>Каталог</Text>

      <Pressable style={styles.searchRow} onPress={() => navigation.navigate('Search')}>
        <SearchIcon size={20} color={colors.textMuted} />
        <Text style={styles.searchPlaceholder}>Поиск брендов...</Text>
      </Pressable>

      <FlatList
        data={loading ? [] : products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={Header}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('Product', { id: item.id })}
          />
        )}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.lg }} /> : null}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
          ) : (
            <Text style={styles.empty}>
              {error ? 'Не удалось загрузить товары' : 'По выбранным фильтрам ничего нет'}
            </Text>
          )
        }
      />

      <CatalogFiltersSheet
        visible={filtersOpen}
        filters={filters}
        brands={brands}
        onClose={() => setFiltersOpen(false)}
        onApply={(next) => { setFilters(next); setFiltersOpen(false); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    color: colors.accent, fontSize: font.sizeLG, fontWeight: '800',
    textAlign: 'center', paddingVertical: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  searchPlaceholder: { color: colors.textMuted, fontSize: font.sizeMD },
  blockTitle: {
    color: colors.text, fontSize: font.sizeLG, fontWeight: '800',
    paddingHorizontal: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.md,
  },

  catGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: spacing.md, paddingHorizontal: spacing.sm,
  },
  catCard: {
    flexBasis: '47%', flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  catCardActive: { borderColor: colors.accent },
  catTitle: { color: colors.text, fontSize: font.sizeMD, fontWeight: '700' },

  brandWrap: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: spacing.sm, paddingHorizontal: spacing.sm, marginBottom: spacing.md,
  },
  brandChip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.chipInactive,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  brandChipActive: { backgroundColor: 'transparent', borderColor: colors.accent },
  brandText: { color: colors.text, fontSize: font.sizeMD, fontWeight: '600' },
  brandTextActive: { color: colors.accent },

  filtersBtn: {
    alignSelf: 'flex-start', marginHorizontal: spacing.sm, marginBottom: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.accent,
  },
  filtersText: { color: colors.accent, fontSize: font.sizeMD, fontWeight: '700' },

  grid: { paddingHorizontal: spacing.sm, paddingBottom: spacing.xl },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
