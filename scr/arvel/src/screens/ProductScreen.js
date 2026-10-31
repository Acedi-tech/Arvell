import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, Pressable, ScrollView, Image, ActivityIndicator, Share, useWindowDimensions } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, font } from '../theme';
import { BackIcon, ShareIcon, StarIcon, ChatIcon, HeartIcon, TeeIcon } from '../components/Icons';
import { getProduct } from '../api/products';
import { useFavorites } from '../context/FavoritesContext';
import { useAppConfig, useMoney, labelFor } from '../context/AppConfigContext';
import { useAuth } from '../context/AuthContext';
import { resolveMediaUrl } from '../utils/media';
import { productUrl } from '../utils/links';
import RemoteImage from '../components/RemoteImage';
import ReviewItem from '../components/ReviewItem';
import StarRating from '../components/StarRating';
import { listProductReviews } from '../api/reviews';
import { reviewsCount } from '../utils/plural';

export default function ProductScreen({ navigation, route }) {
  const id = route?.params?.id;
  const { isFavorite, toggleFavorite } = useFavorites();
  const { conditions } = useAppConfig();
  const money = useMoney();
  const { isLoggedIn, user } = useAuth();

  // Покупка и переписка с продавцом доступны только вошедшим — гостя
  // отправляем на авторизацию вместо открытия чата. Свой товар купить или
  // написать по нему самому себе нельзя.
  const openConversation = (fromBuy) => {
    if (!isLoggedIn) {
      navigation.navigate('Auth');
      return;
    }
    if (isOwn) return;
    navigation.navigate('Conversation', {
      name: shop?.shop_name || 'Продавец',
      rating: shop?.rating,
      phone: shop?.phone,
      avatar: resolveMediaUrl(shop?.profile_pic_url),
      product,
      fromBuy,
    });
  };

  const onLikePress = () => {
    if (!isLoggedIn) {
      navigation.navigate('Auth');
      return;
    }
    toggleFavorite(product.id, product);
  };

  // Ссылка — прямо в тексте сообщения: поле url у Share учитывает только iOS,
  // а на Android получатель увидел бы одно название без ссылки.
  const onSharePress = () => {
    const brand = typeof product.brand === 'string' ? product.brand : product.brand?.name;
    const title = [brand, product.title].filter(Boolean).join(' ');
    Share.share({
      message: [title, money.formatMinor(product.price_minor), productUrl(product.id)].filter(Boolean).join('\n'),
    }).catch(() => {});
  };

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const { width } = useWindowDimensions();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProduct(id)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Отзывы о товаре: пара последних прямо на странице, остальные — по ссылке.
  // Перечитываем товар и отзывы при каждом возвращении на экран: после
  // отправки отзыва должны обновиться рейтинг и кнопка «Оставить отзыв».
  const [reviews, setReviews] = useState([]);
  const [focusTick, setFocusTick] = useState(0);
  useFocusEffect(React.useCallback(() => { setFocusTick((t) => t + 1); }, []));
  useEffect(() => {
    if (!id || focusTick === 0) return undefined;
    let cancelled = false;
    listProductReviews(id, { limit: 2 })
      .then((res) => { if (!cancelled) setReviews(res?.data ?? []); })
      .catch(() => {});
    if (focusTick > 1) {
      getProduct(id).then((p) => { if (!cancelled) setProduct(p); }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [id, focusTick]);

  if (loading) {
    return (
      <View style={[styles.safe, styles.center]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.safe, styles.center]}>
        <SafeAreaView edges={['top']} style={styles.errorHeader}>
          <Pressable style={styles.roundBtn} hitSlop={8} accessibilityLabel="Назад" onPress={() => navigation.goBack()}>
            <BackIcon size={22} />
          </Pressable>
        </SafeAreaView>
        <Text style={styles.errorTitle}>Не удалось загрузить товар</Text>
        <Text style={styles.errorSub}>
          {error?.status === 404 ? 'Товар не найден или уже снят с публикации.' : 'Проверьте соединение и попробуйте ещё раз.'}
        </Text>
      </View>
    );
  }

  // В реальных данных нет поля "kind" (обувь/футболка) — общий плейсхолдер, пока нет фото.
  const Placeholder = TeeIcon;
  // Все фото товара по порядку position — раньше показывалось только первое,
  // и у лота из 10 вещей остальные 9 фото было не посмотреть.
  const photoUrls = [...(product.images || [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((img) => resolveMediaUrl(img.url))
    .filter(Boolean);
  const liked = isFavorite(product.id);
  const brandLabel = product.brand?.name || '';
  const sizeLabel = product.size_value || (product.size_system === 'one_size' ? 'One size' : '—');
  const conditionLabel = labelFor(conditions, product.condition);
  const shop = product.seller;
  // seller.id — это магазин, а seller.seller_id — пользователь-владелец.
  const isOwn = !!user?.id && shop?.seller_id === user.id;
  const canReview = !!product.viewer_context?.can_review;
  const myReviewId = product.viewer_context?.my_review_id;
  const productTitle = [brandLabel, product.title].filter(Boolean).join(' ');
  const ratingCount = product.rating_count ?? 0;
  const openWriteReview = () => navigation.navigate('WriteReview', {
    productId: product.id,
    title: productTitle,
    thumbnail: photoUrls[0] || null,
  });
  const openAllReviews = () => navigation.navigate('Reviews', {
    productId: product.id,
    title: productTitle,
    rating: product.rating,
    ratingCount,
  });

  return (
    <View style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Фото */}
        <View style={styles.photo}>
          {/* Сама фотография — базовый слой. Раньше рендерилась ПОСЛЕ
              photoBar и, будучи растянутой на весь блок, визуально
              перекрывала собой кнопки Back/Heart/Share (сами кнопки при
              этом оставались кликабельными благодаря pointerEvents="none"
              на фото, но были не видны). Теперь фото снизу, кнопки — сверху. */}
          {photoUrls.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.photoImage}
              onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            >
              {photoUrls.map((url, i) => (
                <RemoteImage
                  key={url}
                  uri={url}
                  accessibilityLabel={`Фото ${i + 1} из ${photoUrls.length}`}
                  style={{ width, height: '100%' }}
                  placeholder={<ActivityIndicator color={colors.textMuted} />}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.photoCenter}>
              <Placeholder size={130} />
            </View>
          )}

          {/* box-none: панель с кнопками не должна мешать листать фото под ней */}
          <SafeAreaView edges={['top']} style={styles.photoBar} pointerEvents="box-none">
            <Pressable style={styles.roundBtn} hitSlop={8} accessibilityLabel="Назад" onPress={() => navigation.goBack()}>
              <BackIcon size={22} />
            </Pressable>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable style={styles.roundBtn} hitSlop={8} accessibilityLabel={liked ? 'Убрать из избранного' : 'В избранное'} accessibilityState={{ selected: liked }} onPress={onLikePress}>
                <HeartIcon size={20} color={liked ? colors.accent : colors.text} filled={liked} />
              </Pressable>
              <Pressable style={styles.roundBtn} hitSlop={8} accessibilityLabel="Поделиться" onPress={onSharePress}>
                <ShareIcon size={20} />
              </Pressable>
            </View>
          </SafeAreaView>
          {photoUrls.length > 1 && (
            <View style={styles.photoCounter} pointerEvents="none">
              <Text style={styles.photoCounterText}>{photoIndex + 1} / {photoUrls.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.brand}>{brandLabel}</Text>
              <Text style={styles.subtitle}>{product.title}</Text>
            </View>
            {product.rating != null && (
              <View style={styles.ratingRow}>
                <StarIcon size={18} />
                <Text style={styles.rating}>{product.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <Text style={styles.price}>{money.formatMinor(product.price_minor)}</Text>

          <View style={styles.specs}>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>РАЗМЕР</Text>
              <Text style={styles.specValue}>{sizeLabel}</Text>
            </View>
            <View style={styles.specBox}>
              <Text style={styles.specLabel}>СОСТОЯНИЕ</Text>
              <View style={styles.condRow}>
                <View style={styles.greenDot} />
                <Text style={styles.specValue}>{conditionLabel}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Описание</Text>
          <Text style={styles.description}>{product.description}</Text>

          {(ratingCount > 0 || canReview || !!myReviewId) && (
            <>
              <View style={styles.divider} />
              <View style={styles.reviewsHead}>
                <Text style={styles.reviewsTitle}>Отзывы о товаре</Text>
                {ratingCount > 0 && (
                  <Pressable hitSlop={8} onPress={openAllReviews}>
                    <Text style={styles.reviewsLink}>Все</Text>
                  </Pressable>
                )}
              </View>
              {ratingCount > 0 && product.rating != null && (
                <Pressable style={styles.reviewsSummary} onPress={openAllReviews}>
                  <StarRating value={product.rating} size={16} />
                  <Text style={styles.reviewsSummaryText}>
                    {product.rating.toFixed(1)} · {reviewsCount(ratingCount)}
                  </Text>
                </Pressable>
              )}
              {reviews.map((r, i) => (
                <ReviewItem key={r.id} review={r} last={i === reviews.length - 1} />
              ))}
              {canReview && (
                <Pressable style={styles.reviewBtn} onPress={openWriteReview}>
                  <Text style={styles.reviewBtnText}>Оставить отзыв</Text>
                </Pressable>
              )}
              {!canReview && !!myReviewId && (
                <Text style={styles.reviewDone}>Вы уже оставили отзыв на этот товар</Text>
              )}
            </>
          )}

          {shop && (
            <>
              <View style={styles.divider} />
              <Pressable
                style={styles.seller}
                onPress={() => navigation.navigate('Shop', {
                  shopId: shop.id,
                  shopName: shop.shop_name,
                  rating: shop.rating,
                  ratingCount: shop.rating_count,
                })}
              >
                <View style={styles.sellerAvatar}>
                  {shop.profile_pic_url ? (
                    <Image
                      source={{ uri: resolveMediaUrl(shop.profile_pic_url) }}
                      style={styles.sellerAvatarImage}
                    />
                  ) : (
                    <Text style={styles.sellerInitial}>{shop.shop_name?.[0] ?? '?'}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sellerName}>{shop.shop_name}</Text>
                  <Text style={styles.sellerDeals}>{reviewsCount(shop.rating_count)}</Text>
                </View>
                <BackIcon size={20} color={colors.textMuted} />
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      {/* Нижняя панель */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        {isOwn ? (
          <View style={styles.ownNote}>
            <Text style={styles.ownNoteText}>Это ваше объявление</Text>
          </View>
        ) : (
          <>
            <Pressable style={styles.buyBtn} onPress={() => openConversation(true)}>
              <Text style={styles.buyText}>Купить</Text>
            </Pressable>
            <Pressable style={styles.chatBtn} accessibilityLabel="Написать продавцу" onPress={() => openConversation(false)}>
              <ChatIcon size={24} color={colors.text} />
            </Pressable>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorHeader: { position: 'absolute', top: 0, left: 0, paddingHorizontal: spacing.md },
  errorTitle: { color: colors.text, fontSize: font.sizeLG, fontWeight: '800', paddingHorizontal: spacing.lg, textAlign: 'center' },
  errorSub: { color: colors.textMuted, fontSize: font.sizeMD, marginTop: spacing.sm, paddingHorizontal: spacing.lg, textAlign: 'center' },

  photo: { height: 420, backgroundColor: colors.surfaceAlt },
  photoBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  roundBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  photoCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  photoImage: { ...StyleSheet.absoluteFillObject },
  photoCounter: {
    position: 'absolute', right: spacing.md, bottom: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.sm,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  photoCounterText: { color: colors.text, fontSize: font.sizeXS, fontWeight: '700' },

  body: { padding: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  brand: { color: colors.text, fontSize: font.sizeXL, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: font.sizeMD, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  rating: { color: colors.text, fontSize: font.sizeMD, fontWeight: '700' },
  price: { color: colors.accent, fontSize: font.sizeXXL, fontWeight: '800', marginTop: spacing.md },

  specs: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  specBox: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md,
  },
  specLabel: { color: colors.textMuted, fontSize: 10, letterSpacing: 1, fontWeight: '600' },
  specValue: { color: colors.text, fontSize: font.sizeMD, fontWeight: '700', marginTop: 4 },
  condRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },

  sectionTitle: { color: colors.text, fontSize: font.sizeMD, fontWeight: '800', marginTop: spacing.lg },
  description: { color: colors.textMuted, fontSize: font.sizeMD, lineHeight: 24, marginTop: spacing.sm },

  reviewsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewsTitle: { color: colors.text, fontSize: font.sizeMD, fontWeight: '800' },
  reviewsLink: { color: colors.accent, fontSize: font.sizeSM, fontWeight: '700' },
  reviewsSummary: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  reviewsSummaryText: { color: colors.textMuted, fontSize: font.sizeSM },
  reviewBtn: {
    marginTop: spacing.md, borderWidth: 1.5, borderColor: colors.accent,
    borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center',
  },
  reviewBtnText: { color: colors.accent, fontSize: font.sizeMD, fontWeight: '800' },
  reviewDone: { color: colors.textMuted, fontSize: font.sizeSM, marginTop: spacing.md },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  seller: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sellerAvatar: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, borderColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  sellerAvatarImage: { width: 48, height: 48 },
  sellerInitial: { color: colors.accent, fontSize: font.sizeLG, fontWeight: '800' },
  sellerName: { color: colors.text, fontSize: font.sizeMD, fontWeight: '700' },
  sellerDeals: { color: colors.textMuted, fontSize: font.sizeSM, marginTop: 2 },

  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  buyBtn: {
    flex: 1, backgroundColor: colors.accent, borderRadius: radius.pill,
    paddingVertical: 18, alignItems: 'center',
  },
  buyText: { color: colors.accentText, fontSize: font.sizeMD, fontWeight: '800' },
  chatBtn: {
    width: 60, borderRadius: radius.pill, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  ownNote: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.pill,
    paddingVertical: 18, alignItems: 'center',
  },
  ownNoteText: { color: colors.textMuted, fontSize: font.sizeMD, fontWeight: '700' },
});
