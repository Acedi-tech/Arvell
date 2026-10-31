// Главная (Editorial): шапка «ARVELL» с поиском и колокольчиком, баннеры-
// подборки, «Популярные запросы», блок «В тренде» и сетка товаров. Лупа
// раскрывает поле поиска прямо здесь — лента фильтруется на месте.
import React, { useEffect, useRef, useState } from 'react';
import {
  View, FlatList, ScrollView, StyleSheet, ActivityIndicator, Pressable, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TextInput } from '../components/AppText';
import { colors, spacing, font, type } from '../theme';
import ProductCard, { GRID_GAP } from '../components/ProductCard';
import Chip from '../components/Chip';
import Hatch from '../components/Hatch';
import EmptyState from '../components/EmptyState';
import { SearchIcon, BellIcon, CloseIcon } from '../components/Icons';
import { useProducts } from '../context/ProductsContext';
import { useChatUnread } from '../context/ChatUnreadContext';
import { listProducts } from '../api/products';

// Подборки и популярные запросы сервер не отдаёт — задаём здесь, как в прототипе.
const STORIES = [
  { tag: 'Подборка', title: 'Архив Stone Island' },
  { tag: 'Гид', title: 'Как отличить оригинал Air Max' },
  { tag: 'Тренд', title: 'Workwear этой осени' },
];
const TRENDING = ['Nike', 'Stone Island', 'Carhartt WIP', 'The North Face', 'Adidas', 'Supreme'];
const SEARCH_DEBOUNCE_MS = 300;

function Stories() {
  const { width } = useWindowDimensions();
  const [slide, setSlide] = useState(0);
  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setSlide(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {STORIES.map((s) => (
          <View key={s.title} style={[styles.story, { width }]}>
            <Hatch />
            <Text style={styles.storyPhoto}>editorial photo</Text>
            <View style={styles.storyShade} />
            <View style={styles.storyText}>
              <Text style={styles.storyTag}>{s.tag}</Text>
              <Text style={styles.storyTitle}>{s.title}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots} pointerEvents="none">
        {STORIES.map((s, i) => <View key={s.title} style={[styles.dot, i === slide && styles.dotOn]} />)}
      </View>
    </View>
  );
}

export default function FeedScreen({ navigation }) {
  const { products, loading, error, refresh, loadMore } = useProducts();
  const { unread } = useChatUnread();

  // Спиннер «потяни вниз» — только для ручного обновления: loading в контексте
  // включается и при догрузке следующей страницы, и тогда сверху крутился бы он же.
  const [pulling, setPulling] = useState(false);
  const pullToRefresh = async () => {
    setPulling(true);
    try {
      await refresh();
    } finally {
      setPulling(false);
    }
  };

  // Поиск на месте: пока введён запрос, вместо ленты — результаты сервера.
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchId = useRef(0);
  const q = query.trim();

  useEffect(() => {
    if (!q) { setResults([]); setSearching(false); return undefined; }
    const id = ++searchId.current;
    setSearching(true);
    const t = setTimeout(() => {
      listProducts({ q, limit: 40 })
        .then((page) => { if (id === searchId.current) setResults(page.data || []); })
        .catch(() => { if (id === searchId.current) setResults([]); })
        .finally(() => { if (id === searchId.current) setSearching(false); });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q]);

  const toggleSearch = () => {
    if (searchOpen) setQuery('');
    setSearchOpen((o) => !o);
  };
  const searchBrand = (brand) => { setQuery(brand); setSearchOpen(true); };

  const openProduct = (id) => navigation.navigate('Product', { id });

  const header = q ? null : (
    <View>
      <Stories />
      <Text style={styles.blockTitle}>Популярные запросы</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Все" active onPress={() => navigation.getParent()?.navigate('Catalog')} />
        {TRENDING.map((b) => <Chip key={b} label={b} onPress={() => searchBrand(b)} />)}
      </ScrollView>
      <View style={styles.trend}>
        <Text style={styles.trendSub}>Nike, Stone Island, Carhartt + ещё</Text>
        <Text style={styles.trendTitle}>В тренде: одежда</Text>
      </View>
    </View>
  );

  const data = q ? results : products;
  let empty;
  if (q) {
    empty = searching
      ? <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      : <Text style={styles.empty}>Ничего не найдено</Text>;
  } else if (loading) {
    empty = <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />;
  } else if (error) {
    empty = (
      <EmptyState
        title="Не удалось загрузить товары"
        message={error.message}
        actionTitle="Повторить"
        onAction={refresh}
      />
    );
  } else {
    empty = <Text style={styles.empty}>Пока нет товаров</Text>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topbar}>
        <Text style={styles.logo}>ARVELL</Text>
        <View style={styles.actions}>
          <Pressable style={styles.iconBtn} hitSlop={6} accessibilityLabel="Поиск" onPress={toggleSearch}>
            <SearchIcon size={21} color={colors.text} />
          </Pressable>
          <Pressable style={styles.iconBtn} hitSlop={6} accessibilityLabel="Уведомления" onPress={() => navigation.navigate('Notifications')}>
            <BellIcon size={21} />
            {unread > 0 && <View style={styles.bellDot} />}
          </Pressable>
        </View>
      </View>

      {searchOpen && (
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <SearchIcon size={18} color={colors.textMuted} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Поиск брендов..."
              placeholderTextColor={colors.textFaint}
              selectionColor={colors.accent}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {!!query && (
              <Pressable hitSlop={8} accessibilityLabel="Очистить" onPress={() => setQuery('')}>
                <CloseIcon size={17} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: GRID_GAP }}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // Раньше показывалась только первая страница (20 товаров): loadMore
        // существовал, но нигде не вызывался.
        onEndReached={q ? undefined : loadMore}
        onEndReachedThreshold={0.5}
        refreshing={pulling}
        onRefresh={pullToRefresh}
        renderItem={({ item }) => <ProductCard product={item} onPress={() => openProduct(item.id)} />}
        ListEmptyComponent={empty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topbar: {
    height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingLeft: spacing.md, paddingRight: 12,
  },
  logo: { ...type.display, color: colors.accent, fontSize: 21, letterSpacing: -0.3 },
  actions: { flexDirection: 'row', gap: 2 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  bellDot: {
    position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.danger,
  },

  searchWrap: { paddingHorizontal: spacing.md, paddingBottom: 10 },
  searchBox: {
    height: 42, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: colors.accent, backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 0 },

  story: { height: 270, backgroundColor: '#161616', overflow: 'hidden' },
  storyPhoto: { ...type.mono, position: 'absolute', top: 14, right: 14, fontSize: 9.5, color: '#6a6a6a' },
  storyShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 150, backgroundColor: 'rgba(0,0,0,0.35)' },
  storyText: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: 30 },
  storyTag: { color: colors.accent, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  storyTitle: { ...type.display, color: colors.text, fontSize: 25, lineHeight: 28 },
  dots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotOn: { backgroundColor: '#fff' },

  blockTitle: { color: colors.text, fontSize: 15, fontWeight: '800', paddingHorizontal: spacing.md, paddingTop: 20, paddingBottom: 10 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: 22 },
  trend: { paddingHorizontal: spacing.md, paddingBottom: 12 },
  trendSub: { ...type.mono, fontSize: 10.5, color: colors.textMuted },
  trendTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 3 },

  list: { paddingBottom: spacing.xl, flexGrow: 1 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, fontSize: font.sizeSM },
});
