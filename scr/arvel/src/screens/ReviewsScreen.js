// Список отзывов: о магазине (по всем его товарам) или об одном товаре.
// route.params: { shopId } или { productId }, плюс title, rating, ratingCount
// для шапки — чтобы она не ждала сети.
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, font } from '../theme';
import { BackIcon } from '../components/Icons';
import ReviewItem from '../components/ReviewItem';
import StarRating from '../components/StarRating';
import { listProductReviews, listShopReviews } from '../api/reviews';
import { reviewsCount } from '../utils/plural';

const PAGE = 20;

export default function ReviewsScreen({ navigation, route }) {
  const { shopId, productId, title, rating, ratingCount } = route?.params || {};
  const fetchPage = useCallback(
    (cursor) => (productId
      ? listProductReviews(productId, { cursor, limit: PAGE })
      : listShopReviews(shopId, { cursor, limit: PAGE })),
    [shopId, productId],
  );

  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPage()
      .then((res) => {
        if (cancelled) return;
        setItems(res?.data ?? []);
        setCursor(res?.page?.next_cursor ?? null);
        setHasMore(!!res?.page?.has_more);
      })
      .catch((e) => { if (!cancelled) setError(e?.message || 'Не удалось загрузить отзывы.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [fetchPage]);

  const loadMore = async () => {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    try {
      const res = await fetchPage(cursor);
      setItems((prev) => [...prev, ...(res?.data ?? [])]);
      setCursor(res?.page?.next_cursor ?? null);
      setHasMore(!!res?.page?.has_more);
    } catch {
      // Следующая страница не пришла — оставляем то, что уже показано.
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable hitSlop={10} accessibilityLabel="Назад" onPress={() => navigation.goBack()}>
          <BackIcon size={26} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Отзывы</Text>
          {!!title && <Text style={styles.headerSub} numberOfLines={1}>{title}</Text>}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={rating != null ? (
          <View style={styles.summary}>
            <Text style={styles.summaryValue}>{rating.toFixed(1)}</Text>
            <View>
              <StarRating value={rating} size={20} />
              <Text style={styles.summaryCount}>{reviewsCount(ratingCount)}</Text>
            </View>
          </View>
        ) : null}
        renderItem={({ item, index }) => <ReviewItem review={item} last={index === items.length - 1} />}
        ListEmptyComponent={loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{error || 'Пока нет отзывов'}</Text>
            {!error && (
              <Text style={styles.emptySub}>
                Отзыв может оставить покупатель, когда продавец подтвердит продажу.
              </Text>
            )}
          </View>
        )}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.md }} /> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: font.sizeLG, fontWeight: '800' },
  headerSub: { color: colors.textMuted, fontSize: font.sizeSM, marginTop: 2 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  summary: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  summaryValue: { color: colors.text, fontSize: font.sizeXXL, fontWeight: '800' },
  summaryCount: { color: colors.textMuted, fontSize: font.sizeSM, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: font.sizeMD, fontWeight: '700', textAlign: 'center' },
  emptySub: { color: colors.textMuted, fontSize: font.sizeSM, marginTop: spacing.sm, textAlign: 'center' },
});
