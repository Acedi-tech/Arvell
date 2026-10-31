// Страница товара (Editorial, design/v3-a.jsx → V3Product).
// Покупатель: фото-карусель, плашка «Проверено ARVELL», цена, описание,
// отзывы о товаре, продавец и кнопки «Написать» / «Купить».
// Продавец на своём товаре: меню «Снять с продажи / Вернуть / Удалить».
import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, StyleSheet, Pressable, ScrollView, ActivityIndicator, Share, Alert, useWindowDimensions,
} from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, font, type } from '../theme';
import { BackIcon, ShareIcon, StarIcon, HeartIcon, TeeIcon, MoreIcon, TrashIcon, ChevronRight } from '../components/Icons';
import ShieldIcon from '../components/ShieldIcon';
import { getProduct, setProductStatus } from '../api/products';
import { useFavorites } from '../context/FavoritesContext';
import { useAppConfig, useMoney, labelFor } from '../context/AppConfigContext';
import { useAuth } from '../context/AuthContext';
import { useMyListings } from '../context/MyListingsContext';
import { resolveMediaUrl } from '../utils/media';
import { productUrl } from '../utils/links';
import RemoteImage from '../components/RemoteImage';
import ReviewItem from '../components/ReviewItem';
import StarRating from '../components/StarRating';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import PhotoViewer from '../components/PhotoViewer';
import { listProductReviews } from '../api/reviews';
import { reviewsCount } from '../utils/plural';

const PHOTO_HEIGHT = 380;

function IconOnPhoto({ children, label, onPress, selected }) {
  return (
    <Pressable
      style={styles.roundBtn}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected != null ? { selected } : undefined}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

export default function ProductScreen({ navigation, route }) {
  const id = route?.params?.id;
  const { isFavorite, toggleFavorite } = useFavorites();
  const { conditions } = useAppConfig();
  const money = useMoney();
  const { isLoggedIn, user } = useAuth();
  const myListings = useMyListings();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [viewer, setViewer] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProduct(id)
      .then((p) => { if (!cancelled) setProduct(p); })
      .catch((e) => { if (!cancelled) setError(e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
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
          <IconOnPhoto label="Назад" onPress={() => navigation.goBack()}><BackIcon size={20} /></IconOnPhoto>
        </SafeAreaView>
        <Text style={styles.errorTitle}>Не удалось загрузить товар</Text>
        <Text style={styles.errorSub}>
          {error?.status === 404 ? 'Товар не найден или уже снят с публикации.' : 'Проверьте соединение и попробуйте ещё раз.'}
        </Text>
      </View>
    );
  }

  // Все фото товара по порядку position.
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
  const offSale = product.status === 'out_of_stock';
  const canReview = !isOwn && !!product.viewer_context?.can_review;
  const myReviewId = product.viewer_context?.my_review_id;
  const productTitle = [brandLabel, product.title].filter(Boolean).join(' ');
  const ratingCount = product.rating_count ?? 0;
  const showReviews = ratingCount > 0 || canReview || (!isOwn && !!myReviewId);

  // Покупка и переписка с продавцом доступны только вошедшим — гостя
  // отправляем на авторизацию вместо открытия чата.
  const openConversation = (fromBuy) => {
    if (!isLoggedIn) {
      navigation.navigate('Auth', { reason: 'Войдите, чтобы связаться с продавцом' });
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
      navigation.navigate('Auth', { reason: 'Войдите, чтобы сохранять в избранное' });
      return;
    }
    toggleFavorite(product.id, product);
  };

  // Ссылка — прямо в тексте сообщения: поле url у Share учитывает только iOS,
  // а на Android получатель увидел бы одно название без ссылки.
  const onSharePress = () => {
    Share.share({
      message: [productTitle, money.formatMinor(product.price_minor), productUrl(product.id)].filter(Boolean).join('\n'),
    }).catch(() => {});
  };

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
  const openShop = () => navigation.navigate('Shop', {
    shopId: shop.id,
    shopName: shop.shop_name,
    rating: shop.rating,
    ratingCount: shop.rating_count,
  });

  // --- Действия продавца со своим товаром ---
  const changeStatus = async (status) => {
    setMenuOpen(false);
    try {
      const updated = await setProductStatus(product.id, status);
      setProduct((p) => ({ ...p, status: updated?.status ?? status }));
      myListings?.reloadAfterChange?.();
    } catch (e) {
      Alert.alert('Не удалось изменить объявление', e?.message || 'Попробуйте ещё раз.');
    }
  };
  const deleteListing = async () => {
    setConfirmDelete(false);
    try {
      await setProductStatus(product.id, 'archived');
      myListings?.reloadAfterChange?.();
      navigation.goBack();
    } catch (e) {
      Alert.alert('Не удалось удалить объявление', e?.message || 'Попробуйте ещё раз.');
    }
  };

  return (
    <View style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.lg }}>
        <View style={styles.photo}>
          {photoUrls.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={StyleSheet.absoluteFill}
              onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            >
              {photoUrls.map((url, i) => (
                <Pressable key={url} onPress={() => setViewer(url)} accessibilityLabel={`Открыть фото ${i + 1}`}>
                  <RemoteImage
                    uri={url}
                    accessibilityLabel={`Фото ${i + 1} из ${photoUrls.length}`}
                    style={{ width, height: PHOTO_HEIGHT }}
                    placeholder={<ActivityIndicator color={colors.textMuted} />}
                  />
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.photoCenter}>
              <TeeIcon size={130} />
            </View>
          )}

          <SafeAreaView edges={['top']} style={styles.photoBar} pointerEvents="box-none">
            <View style={styles.photoBarRow} pointerEvents="box-none">
              <IconOnPhoto label="Назад" onPress={() => navigation.goBack()}><BackIcon size={20} /></IconOnPhoto>
              <View style={styles.photoBarRight}>
                <IconOnPhoto label="Поделиться" onPress={onSharePress}><ShareIcon size={18} /></IconOnPhoto>
                {isOwn && (
                  <IconOnPhoto label="Действия с объявлением" onPress={() => setMenuOpen((o) => !o)}>
                    <MoreIcon size={20} />
                  </IconOnPhoto>
                )}
              </View>
            </View>
            {menuOpen && (
              <View style={styles.menu}>
                <Pressable style={styles.menuItem} onPress={() => changeStatus(offSale ? 'active' : 'out_of_stock')}>
                  <Text style={styles.menuText}>{offSale ? 'Вернуть в продажу' : 'Снять с продажи'}</Text>
                </Pressable>
                <Pressable style={[styles.menuItem, styles.menuLast]} onPress={() => { setMenuOpen(false); setConfirmDelete(true); }}>
                  <TrashIcon size={16} />
                  <Text style={[styles.menuText, { color: colors.danger }]}>Удалить объявление</Text>
                </Pressable>
              </View>
            )}
            <View style={styles.verified} pointerEvents="none">
              <ShieldIcon size={14} color={colors.accentText} />
              <Text style={styles.verifiedText}>Проверено ARVELL</Text>
            </View>
          </SafeAreaView>

          {photoUrls.length > 1 && (
            <View style={styles.photoCounter} pointerEvents="none">
              <Text style={styles.photoCounterText}>{photoIndex + 1} / {photoUrls.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>{brandLabel}</Text>
            {!isOwn && (
              <Pressable hitSlop={8} accessibilityLabel={liked ? 'Убрать из избранного' : 'В избранное'} accessibilityState={{ selected: liked }} onPress={onLikePress}>
                <HeartIcon size={22} color={liked ? colors.accent : colors.text} filled={liked} />
              </Pressable>
            )}
          </View>
          <Text style={styles.titleLine}>{productTitle}</Text>
          <Text style={styles.meta}>{sizeLabel} · {conditionLabel}</Text>
          <Text style={styles.price}>{money.formatMinor(product.price_minor)}</Text>
          <Text style={styles.payNote}>Оплата и передача товара — при встрече с продавцом</Text>

          <View style={styles.divider} />
          <Text style={styles.label}>Описание</Text>
          <Text style={styles.description}>{product.description}</Text>

          {showReviews && (
            <>
              <View style={styles.divider} />
              <View style={styles.reviewsHead}>
                <Text style={[styles.label, { flex: 1, marginBottom: 0 }]}>Отзывы о товаре</Text>
                {ratingCount > 0 && (
                  <Pressable hitSlop={8} onPress={openAllReviews}>
                    <Text style={styles.linkMono}>Все</Text>
                  </Pressable>
                )}
              </View>
              {ratingCount > 0 && product.rating != null ? (
                <View style={styles.reviewsSummary}>
                  <StarRating value={product.rating} size={14} />
                  <Text style={styles.reviewsAvg}>{product.rating.toFixed(1)}</Text>
                  <Text style={styles.reviewsCount}>· {reviewsCount(ratingCount)}</Text>
                </View>
              ) : (
                <Text style={styles.noReviews}>Отзывов пока нет</Text>
              )}
              {reviews.map((r, i) => (
                <ReviewItem key={r.id} review={r} last={i === reviews.length - 1} />
              ))}
              {canReview && (
                <Button title="Оставить отзыв" variant="outline" onPress={openWriteReview} style={{ marginTop: 10 }} />
              )}
              {!canReview && !isOwn && !!myReviewId && (
                <Text style={styles.reviewDone}>Вы уже оставили отзыв на этот товар</Text>
              )}
            </>
          )}

          {shop && (
            <>
              <View style={styles.divider} />
              <Pressable style={styles.seller} onPress={openShop}>
                <Avatar uri={resolveMediaUrl(shop.profile_pic_url)} name={shop.shop_name} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sellerName}>{shop.shop_name}</Text>
                  <View style={styles.sellerRating}>
                    {shop.rating_count ? (
                      <>
                        <StarIcon size={12} />
                        <Text style={styles.sellerDeals}>
                          {shop.rating != null ? `${shop.rating.toFixed(1)} · ` : ''}{reviewsCount(shop.rating_count)}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.sellerDeals}>Пока нет отзывов</Text>
                    )}
                  </View>
                </View>
                <ChevronRight size={20} />
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        {isOwn ? (
          <>
            {offSale && <View style={styles.offPlaque}><Text style={styles.offPlaqueText}>Снято с продажи</Text></View>}
            <View style={styles.ownNote}><Text style={styles.ownNoteText}>Это ваше объявление</Text></View>
          </>
        ) : (
          <View style={styles.buyRow}>
            <Button title="Написать" variant="ghost" style={{ flex: 1 }} accessibilityLabel="Написать продавцу" onPress={() => openConversation(false)} />
            <Button title="Купить" style={{ flex: 1 }} onPress={() => openConversation(true)} />
          </View>
        )}
      </SafeAreaView>

      <ConfirmDialog
        visible={confirmDelete}
        title="Удалить объявление?"
        message="Объявление исчезнет из ленты и каталога. Это действие нельзя отменить."
        confirmText="Удалить"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={deleteListing}
      />
      <PhotoViewer uri={viewer} onClose={() => setViewer(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorHeader: { position: 'absolute', top: 0, left: 0, padding: 14 },
  errorTitle: { color: colors.text, fontSize: font.sizeLG, fontWeight: '800', paddingHorizontal: spacing.lg, textAlign: 'center' },
  errorSub: { color: colors.textMuted, fontSize: font.sizeMD, marginTop: spacing.sm, paddingHorizontal: spacing.lg, textAlign: 'center' },

  photo: { height: PHOTO_HEIGHT, backgroundColor: colors.surface },
  photoCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  photoBar: { position: 'absolute', top: 0, left: 0, right: 0 },
  photoBarRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 10 },
  photoBarRight: { flexDirection: 'row', gap: spacing.sm },
  roundBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.overlayButton,
    alignItems: 'center', justifyContent: 'center',
  },
  menu: {
    position: 'absolute', top: 56, right: 14, zIndex: 10, minWidth: 210,
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuLast: { borderBottomWidth: 0 },
  menuText: { color: colors.text, fontSize: 14 },
  verified: {
    alignSelf: 'flex-start', marginLeft: 14, marginTop: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.accent, paddingHorizontal: 9, paddingVertical: 6,
  },
  verifiedText: { ...type.monoMedium, fontSize: 10.5, color: colors.accentText },
  photoCounter: {
    position: 'absolute', right: 14, bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4,
  },
  photoCounterText: { ...type.mono, color: colors.text, fontSize: 10.5 },

  body: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brand: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '800', textDecorationLine: 'underline' },
  titleLine: { color: colors.text, fontSize: 16, marginTop: 4 },
  meta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  price: { ...type.display, color: colors.accent, fontSize: 26, letterSpacing: -0.5, marginTop: 12 },
  payNote: { color: colors.textMuted, fontSize: 12.5, marginTop: 6 },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 18 },
  label: { ...type.mono, fontSize: 10.5, color: colors.textMuted, marginBottom: spacing.sm },
  linkMono: { ...type.monoMedium, fontSize: 11, color: colors.accent },
  description: { color: colors.textSub, fontSize: 14.5, lineHeight: 22 },

  reviewsHead: { flexDirection: 'row', alignItems: 'center' },
  reviewsSummary: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 10, marginBottom: 2 },
  reviewsAvg: { color: colors.text, fontSize: 13.5, fontWeight: '600' },
  reviewsCount: { color: colors.textMuted, fontSize: 13 },
  noReviews: { color: colors.textMuted, fontSize: 13.5, marginTop: 10, marginBottom: 4 },
  reviewDone: { color: colors.textMuted, fontSize: 13, marginTop: 10 },

  seller: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sellerName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  sellerRating: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  sellerDeals: { color: colors.textMuted, fontSize: 13 },

  bottomBar: {
    paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: 8, gap: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  buyRow: { flexDirection: 'row', gap: spacing.sm },
  offPlaque: { height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  offPlaqueText: { ...type.mono, fontSize: 11, color: colors.textMuted },
  ownNote: { height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  ownNoteText: { ...type.mono, fontSize: 12, color: colors.textMuted },
});
