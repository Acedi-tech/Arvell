import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, spacing, font } from '../theme';
import StarRating from './StarRating';
import { resolveMediaUrl } from '../utils/media';

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function formatReviewDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

// Один отзыв: автор, звёзды, дата и текст (если покупатель его написал).
export default function ReviewItem({ review, last }) {
  const name = review?.buyer?.display_name || 'Покупатель';
  const avatar = resolveMediaUrl(review?.buyer?.profile_pic_url);
  return (
    <View style={[styles.wrap, !last && styles.border]}>
      <View style={styles.head}>
        <View style={styles.avatar}>
          {avatar
            ? <Image source={{ uri: avatar }} style={styles.avatarImage} />
            : <Text style={styles.avatarText}>{name.trim()[0]?.toUpperCase() || '?'}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <View style={styles.meta}>
            <StarRating value={review?.rating ?? 0} size={14} />
            <Text style={styles.date}>{formatReviewDate(review?.created_at)}</Text>
          </View>
        </View>
      </View>
      {!!review?.comment && <Text style={styles.comment}>{review.comment}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.md },
  border: { borderBottomWidth: 1, borderBottomColor: colors.border },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImage: { width: 36, height: 36 },
  avatarText: { color: colors.text, fontSize: font.sizeSM, fontWeight: '800' },
  name: { color: colors.text, fontSize: font.sizeMD, fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  date: { color: colors.textMuted, fontSize: font.sizeXS },
  comment: { color: colors.text, fontSize: font.sizeMD, lineHeight: 22, marginTop: spacing.sm },
});
