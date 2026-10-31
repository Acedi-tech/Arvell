// Профиль продавца (Editorial, design/v3-a.jsx → V3SellerProfile):
// аватар с жёлтой обводкой, магазин, рейтинг, плашка «Проверенный продавец»,
// лента объявлений и последние отзывы покупателей.
// route.params: { shopId, shopName?, rating?, ratingCount? } — шапка рисуется
// сразу из параметров, остальное подтягивается с сервера.
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, type } from '../theme';
import { StarIcon, TeeIcon } from '../components/Icons';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import RemoteImage from '../components/RemoteImage';
import ReviewItem from '../components/ReviewItem';
import { listProducts } from '../api/products';
import { getShop } from '../api/shops';
import { listShopReviews } from '../api/reviews';
import { useMoney } from '../context/AppConfigContext';
import { resolveMediaUrl } from '../utils/media';
import { reviewsCount, plural } from '../utils/plural';

function MiniListing({ product, onPress }) {
  const money = useMoney();
  const uri = resolveMediaUrl(product.thumbnail_url);
  return (
    <Pressable style={styles.mini} onPress={onPress}>
      <View style={styles.miniImg}>
        {uri ? <RemoteImage uri={uri} style={styles.miniPhoto} placeholder={<TeeIcon size={56} />} /> : <TeeIcon size={56} />}
      </View>
      <Text style={styles.miniBrand} numberOfLines={1}>{product.brand?.name || ''}</Text>
      <Text style={styles.miniTitle} numberOfLines={1}>{product.title}</Text>
      <Text style={styles.miniPrice}>{money.formatMinor(product.price_minor)}</Text>
    </Pressable>
  );
}

export default function ShopScreen({ navigation, route }) {
  const { shopId, shopName, rating: ratingParam, ratingCount: countParam } = route?.params || {};

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listProducts({ shopId })
      .then((page) => { if (!cancelled) setProducts(page.data || []); })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    getShop(shopId).then((s) => { if (!cancelled) setShop(s); }).catch(() => {});
    listShopReviews(shopId, { limit: 3 })
      .then((res) => { if (!cancelled) setReviews(res?.data ?? []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [shopId]);

  const name = shop?.shop_name || shopName || 'Продавец';
  const rating = shop?.rating ?? ratingParam;
  const ratingCount = shop?.rating_count ?? countParam ?? 0;
  const listingsCount = shop?.product_count ?? products.length;
  const openReviews = () => navigation.navigate('Reviews', { shopId, title: name, rating, ratingCount });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Профиль продавца" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Avatar uri={resolveMediaUrl(shop?.profile_pic_url)} name={name} size={72} ring />
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={2}>{name}</Text>
            {rating != null && ratingCount > 0 ? (
              <Pressable style={styles.ratingRow} hitSlop={8} accessibilityRole="button" onPress={openReviews}>
                <StarIcon size={14} />
                <Text style={styles.ratingText}>{rating.toFixed(1)} · {reviewsCount(ratingCount)}</Text>
              </Pressable>
            ) : (
              <Text style={[styles.ratingText, { marginTop: 5 }]}>Пока нет отзывов</Text>
            )}
            {listingsCount > 0 && (
              <Text style={styles.listingsCount}>
                {listingsCount} {plural(listingsCount, ['объявление', 'объявления', 'объявлений'])}
              </Text>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✓ Проверенный продавец</Text>
            </View>
          </View>
        </View>
        {!!shop?.description && <Text style={styles.about}>{shop.description}</Text>}

        <Text style={styles.label}>Объявления продавца</Text>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.lg }} />
        ) : products.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listings}>
            {products.map((p) => (
              <MiniListing key={p.id} product={p} onPress={() => navigation.navigate('Product', { id: p.id })} />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.empty}>{error ? 'Не удалось загрузить товары' : 'У продавца пока нет объявлений'}</Text>
        )}

        <View style={styles.reviewsHead}>
          <Text style={[styles.label, { flex: 1, marginBottom: 0, marginTop: 0 }]}>Отзывы покупателей</Text>
          {ratingCount > 0 && (
            <Pressable hitSlop={8} onPress={openReviews}>
              <Text style={styles.link}>Все отзывы</Text>
            </Pressable>
          )}
        </View>
        {reviews.length ? (
          reviews.map((r, i) => <ReviewItem key={r.id} review={r} last={i === reviews.length - 1} />)
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Пока нет отзывов</Text>
            <Text style={styles.emptySub}>Отзыв может оставить покупатель, когда продавец подтвердит продажу</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingTop: 18, paddingBottom: spacing.xl },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: 18 },
  name: { ...type.display, color: colors.text, fontSize: 19, letterSpacing: -0.3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  ratingText: { color: colors.textMuted, fontSize: 13 },
  listingsCount: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  badge: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { ...type.monoMedium, fontSize: 10, color: colors.accentText },
  about: { color: colors.textSub, fontSize: 14, lineHeight: 21, marginBottom: 18 },

  label: { ...type.mono, fontSize: 10.5, color: colors.textMuted, marginBottom: spacing.sm, marginTop: 4 },
  link: { ...type.monoMedium, fontSize: 11, color: colors.accent },
  listings: { gap: 2, paddingBottom: 24, marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  mini: { width: 140 },
  miniImg: { width: 140, height: 140, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  miniPhoto: { width: '100%', height: '100%' },
  miniBrand: { color: colors.text, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline', marginTop: 8, paddingHorizontal: 2 },
  miniTitle: { color: colors.textMuted, fontSize: 12, marginTop: 2, paddingHorizontal: 2 },
  miniPrice: { color: colors.accent, fontSize: 13, fontWeight: '800', marginTop: 4, paddingHorizontal: 2 },
  empty: { color: colors.textMuted, fontSize: 13.5, marginBottom: 24 },

  reviewsHead: { flexDirection: 'row', alignItems: 'center' },
  emptyBox: { borderWidth: 1, borderColor: colors.border, paddingVertical: 34, paddingHorizontal: 10, marginTop: 12, alignItems: 'center' },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
