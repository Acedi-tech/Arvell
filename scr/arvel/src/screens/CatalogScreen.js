import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, font, type } from '../theme';
import { SearchIcon } from '../components/Icons';
import ProductCard, { GRID_GAP } from '../components/ProductCard';
import Header from '../components/Header';
import Chip from '../components/Chip';
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
  const anySelected = !!categoryId || activeCount > 0;
  const resetAll = () => { setCategoryId(null); setSubcategoryId(null); setFilters(EMPTY_FILTERS); };
  const sortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort)?.label;

  const ListHeader = (
    <View>
      <Pressable style={styles.searchRow} onPress={() => navigation.navigate('Search')}>
        <SearchIcon size={19} color={colors.textMuted} />
        <Text style={styles.searchPlaceholder}>Поиск в каталоге...</Text>
      </Pressable>

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
              <Text style={[styles.catTitle, active && styles.catTitleActive]}>{cat.name}</Text>
            </Pressable>
          );
        })}
      </View>

      {subcategories.length > 0 && (
        <View style={[styles.brandWrap, { marginTop: spacing.md }]}>
          {subcategories.map((c) => (
            <Chip key={c.id} label={c.name} arrow={false} active={subcategoryId === c.id} onPress={() => toggleSubcategory(c.id)} />
          ))}
        </View>
      )}

      <Text style={styles.blockTitle}>Бренды</Text>
      <View style={styles.brandWrap}>
        {brands.map((b) => (
          <Chip key={b.id} label={b.name} active={filters.brandId === b.id} onPress={() => toggleBrand(b.id)} />
        ))}
      </View>

      <View style={styles.toolsRow}>
        <Pressable style={styles.filtersBtn} onPress={() => setFiltersOpen(true)}>
          <Text style={styles.filtersText}>
            Фильтры{activeCount ? ` · ${activeCount}` : ''}{sortLabel ? ` · ${sortLabel}` : ''}
          </Text>
        </Pressable>
        {anySelected && (
          <Pressable hitSlop={8} onPress={resetAll}>
            <Text style={styles.reset}>Сбросить</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Каталог" />

      <FlatList
        data={loading ? [] : products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={ListHeader}
        columnWrapperStyle={{ gap: GRID_GAP }}
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
  searchRow: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: 20,
    paddingHorizontal: 14,
  },
  searchPlaceholder: { color: colors.textFaint, fontSize: 15 },
  blockTitle: { ...type.mono, fontSize: 10.5, color: colors.textMuted, paddingHorizontal: spacing.md, marginBottom: 10 },

  catGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 2, marginBottom: 22,
  },
  catCard: {
    flexBasis: '49.5%', flexGrow: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md, paddingVertical: 18,
  },
  catCardActive: { backgroundColor: colors.accent },
  catTitle: { color: colors.text, fontSize: font.sizeMD, fontWeight: '700' },
  catTitleActive: { color: colors.accentText },

  brandWrap: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: 18,
  },

  toolsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, marginBottom: spacing.md,
  },
  filtersBtn: {
    height: 30, justifyContent: 'center', paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.accent,
  },
  filtersText: { ...type.mono, fontSize: 11.5, color: colors.accent },
  reset: { color: colors.accent, fontSize: 13, fontWeight: '600' },

  grid: { paddingBottom: spacing.xl },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
