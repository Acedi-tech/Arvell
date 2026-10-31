import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './AppText';
import { colors, type } from '../theme';
import StarRating from './StarRating';
import Avatar from './Avatar';
import { resolveMediaUrl } from '../utils/media';

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function formatReviewDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

// Один отзыв (Editorial): аватар, имя, звёзды, дата справа, текст.
// product — подпись товара моно капсом (в общем списке отзывов магазина).
export default function ReviewItem({ review, last, product }) {
  const name = review?.buyer?.display_name || 'Покупатель';
  return (
    <View style={[styles.wrap, !last && styles.border]}>
      <View style={styles.head}>
        <Avatar uri={resolveMediaUrl(review?.buyer?.profile_pic_url)} name={name} size={32} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <View style={{ marginTop: 3 }}>
            <StarRating value={review?.rating ?? 0} size={11} />
          </View>
        </View>
        <Text style={styles.date}>{formatReviewDate(review?.created_at)}</Text>
      </View>
      {!!review?.comment && <Text style={styles.comment}>{review.comment}</Text>}
      {!!product && <Text style={styles.product}>{product}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 14 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.border },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  name: { color: colors.text, fontSize: 14, fontWeight: '600' },
  date: { color: colors.textMuted, fontSize: 12 },
  comment: { color: colors.textSub, fontSize: 13.5, lineHeight: 20 },
  product: { ...type.mono, fontSize: 9.5, color: colors.textMuted, marginTop: 7 },
});
