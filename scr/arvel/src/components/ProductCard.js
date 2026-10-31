// Карточка товара в сетке (Editorial): фото на всю ширину колонки, под ним
// бренд жирным с подчёркиванием и сердечко, модель, «размер · состояние»
// и цена жёлтым. Плашки «Проверено» в сетке нет — только на странице товара.
import React from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Text } from './AppText';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, font } from '../theme';
import { HeartIcon, TeeIcon, SneakerIcon } from './Icons';
import RemoteImage from './RemoteImage';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useMoney, useAppConfig, labelFor } from '../context/AppConfigContext';
import { resolveMediaUrl } from '../utils/media';

// Зазор между колонками сетки — 2 px, между рядами — 18 px.
export const GRID_GAP = 2;
export const GRID_ROW_GAP = 18;

// Товар приходит в одной из двух форм: реальный ProductSummary с бэкенда
// (brand — объект, price_minor — копейки) или локальный черновик
// (brand — строка, price — рубли). Читаем оба варианта.
function getBrandLabel(product) {
  return typeof product.brand === 'string' ? product.brand : product.brand?.name || '';
}

function getPriceLabel(product, money) {
  if (product.price_minor != null) return money.formatMinor(product.price_minor);
  if (product.price != null) return money.formatMajor(product.price);
  return '—';
}

export function sizeLabel(product) {
  if (product.size_value) return product.size_value;
  if (product.size_system === 'one_size') return 'One size';
  return product.size || '';
}

export default function ProductCard({ product, onPress, hideFav = false, topRight = null }) {
  const money = useMoney();
  const { conditions } = useAppConfig();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isLoggedIn } = useAuth();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const cellWidth = (width - GRID_GAP) / 2;
  const liked = isFavorite(product.id);
  const Placeholder = product.kind === 'sneaker' ? SneakerIcon : TeeIcon;
  // В избранное с экрана товара попадает полный Product (там images[]), а не
  // ProductSummary с thumbnail_url — иначе в списке избранного не было фото.
  const imageUrl = resolveMediaUrl(product.thumbnail_url ?? product.images?.[0]?.url);
  const meta = [sizeLabel(product), labelFor(conditions, product.condition)].filter(Boolean).join(' · ');

  const onLikePress = () => {
    if (!isLoggedIn) {
      navigation.navigate('Auth', { reason: 'Войдите, чтобы сохранять в избранное' });
      return;
    }
    toggleFavorite(product.id, product);
  };

  return (
    <Pressable style={[styles.card, { width: cellWidth }]} onPress={onPress}>
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <RemoteImage uri={imageUrl} style={styles.image} placeholder={<Placeholder size={80} />} />
        ) : (
          <Placeholder size={80} />
        )}
        {topRight}
      </View>

      <View style={styles.info}>
        <View style={styles.brandRow}>
          <Text style={styles.brand} numberOfLines={1}>{getBrandLabel(product)}</Text>
          {!hideFav && !topRight && (
            <Pressable
              hitSlop={10}
              // Читалка должна слышать, что товар уже в избранном, а не всегда «В избранное».
              accessibilityLabel={liked ? 'Убрать из избранного' : 'В избранное'}
              accessibilityState={{ selected: liked }}
              onPress={onLikePress}
            >
              <HeartIcon size={17} color={liked ? colors.accent : colors.text} filled={liked} />
            </Pressable>
          )}
        </View>
        <Text style={styles.title} numberOfLines={1}>{product.title}</Text>
        {!!meta && <Text style={styles.meta} numberOfLines={1}>{meta}</Text>}
        <Text style={styles.price}>{getPriceLabel(product, money)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: GRID_ROW_GAP },
  imageWrap: {
    height: 196,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  info: { paddingHorizontal: 10, paddingTop: 9 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand: {
    flex: 1, color: colors.text, fontSize: 13, fontWeight: '700',
    textDecorationLine: 'underline',
  },
  title: { color: colors.text, fontSize: 13, marginTop: 2 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  price: { color: colors.accent, fontSize: 14, fontWeight: '800', marginTop: 6 },
});
