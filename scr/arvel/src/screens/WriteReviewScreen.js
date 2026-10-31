// Форма отзыва о покупке. Открывается со страницы товара и из «Завершённых
// сделок», когда продавец подтвердил продажу (viewer_context.can_review).
// route.params: { productId, title?, thumbnail? }
import React, { useState } from 'react';
import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, font, type } from '../theme';
import { TeeIcon } from '../components/Icons';
import Header from '../components/Header';
import KeyboardAware from '../components/KeyboardAware';
import StarRating from '../components/StarRating';
import PrimaryButton from '../components/PrimaryButton';
import SuccessOverlay from '../components/SuccessOverlay';
import { createProductReview } from '../api/reviews';

const MAX_COMMENT = 1000;
const RATING_LABELS = ['', 'Ужасно', 'Плохо', 'Нормально', 'Хорошо', 'Отлично'];

function reviewErrorMessage(e) {
  if (e?.status === 409) return 'Вы уже оставили отзыв на этот товар.';
  if (e?.status === 403) return 'Отзыв можно оставить только после того, как продавец подтвердит продажу.';
  if (e?.status === 404) return 'Товар не найден или уже снят с публикации.';
  if (e?.status === 422) return 'Проверьте оценку и текст отзыва.';
  return e?.message || 'Не удалось отправить отзыв. Попробуйте ещё раз.';
}

export default function WriteReviewScreen({ navigation, route }) {
  const { productId, title, thumbnail } = route?.params || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!rating || sending) return;
    setError(null);
    setSending(true);
    try {
      await createProductReview(productId, { rating, comment: comment.trim() });
      setDone(true);
    } catch (e) {
      setError(reviewErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Отзыв о покупке" onBack={() => navigation.goBack()} />

      <KeyboardAware dismissOnTap={false}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!!title && (
            <View style={styles.product}>
              <View style={styles.thumb}>
                {thumbnail
                  ? <Image source={{ uri: thumbnail }} style={styles.thumbImage} />
                  : <TeeIcon size={36} />}
              </View>
              <Text style={styles.productTitle} numberOfLines={2}>{title}</Text>
            </View>
          )}

          <Text style={styles.rateTitle}>Оцените покупку</Text>
          <View style={styles.stars}>
            <StarRating value={rating} size={40} gap={spacing.sm} onChange={setRating} />
            <Text style={[styles.ratingLabel, !!rating && styles.ratingLabelOn]}>{rating ? RATING_LABELS[rating] : 'Нажмите на звезду'}</Text>
          </View>

          <Text style={styles.label}>Комментарий</Text>
          <TextInput
            style={styles.input}
            placeholder="Расскажите, как прошла сделка и соответствовал ли товар описанию"
            placeholderTextColor={colors.textFaint}
            multiline
            maxLength={MAX_COMMENT}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />
          <View style={styles.counterRow}>
            <Text style={styles.note}>Комментарий необязателен. Отзыв увидят все пользователи ARVELL</Text>
            <Text style={styles.counter}>{comment.length} / {MAX_COMMENT}</Text>
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            title={sending ? 'Отправляем…' : 'Отправить отзыв'}
            disabled={!rating || sending}
            onPress={submit}
          />
        </View>
      </KeyboardAware>

      <SuccessOverlay
        visible={done}
        title="Спасибо за отзыв!"
        message="Он поможет другим покупателям выбрать продавца."
        buttonText="Готово"
        onClose={() => { setDone(false); navigation.goBack(); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.lg },
  product: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, padding: 10,
    marginBottom: 26,
  },
  thumb: {
    width: 56, height: 56, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  thumbImage: { width: 56, height: 56 },
  productTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '700' },
  rateTitle: { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center', marginBottom: 14 },
  stars: { alignItems: 'center', gap: 10, marginBottom: 28 },
  ratingLabel: { color: colors.textMuted, fontSize: 14 },
  ratingLabelOn: { color: colors.text, fontWeight: '600' },
  label: { ...type.mono, fontSize: 10.5, color: colors.textMuted, marginBottom: spacing.sm },
  input: {
    minHeight: 120, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    padding: 14, color: colors.text, fontSize: 15, lineHeight: 21,
  },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: spacing.sm },
  counter: { color: colors.textMuted, fontSize: 12 },
  note: { flex: 1, color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  error: { color: colors.danger, fontSize: 13, marginTop: 14 },
  footer: { paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
});
