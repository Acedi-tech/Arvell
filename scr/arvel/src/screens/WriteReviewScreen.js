// Форма отзыва о покупке. Открывается со страницы товара и из «Завершённых
// сделок», когда продавец подтвердил продажу (viewer_context.can_review).
// route.params: { productId, title?, thumbnail? }
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, font } from '../theme';
import { BackIcon, TeeIcon } from '../components/Icons';
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
      <View style={styles.header}>
        <Pressable hitSlop={10} accessibilityLabel="Назад" onPress={() => navigation.goBack()}>
          <BackIcon size={26} />
        </Pressable>
        <Text style={styles.headerTitle}>Отзыв о покупке</Text>
        <View style={{ width: 26 }} />
      </View>

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

          <Text style={styles.label}>Оцените покупку</Text>
          <View style={styles.stars}>
            <StarRating value={rating} size={40} gap={spacing.sm} onChange={setRating} />
            <Text style={styles.ratingLabel}>{rating ? RATING_LABELS[rating] : 'Нажмите на звезду'}</Text>
          </View>

          <Text style={[styles.label, { marginTop: spacing.xl }]}>Комментарий</Text>
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
          <Text style={styles.counter}>{comment.length} / {MAX_COMMENT}</Text>
          <Text style={styles.note}>Комментарий необязателен. Отзыв увидят все пользователи ARVELL.</Text>

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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  headerTitle: { color: colors.text, fontSize: font.sizeLG, fontWeight: '800' },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  product: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.xl,
  },
  thumb: {
    width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  thumbImage: { width: 56, height: 56 },
  productTitle: { flex: 1, color: colors.text, fontSize: font.sizeMD, fontWeight: '700' },
  label: { color: colors.text, fontSize: font.sizeMD, fontWeight: '800', marginBottom: spacing.md },
  stars: { alignItems: 'center', gap: spacing.sm },
  ratingLabel: { color: colors.textMuted, fontSize: font.sizeSM, fontWeight: '600' },
  input: {
    minHeight: 120, backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, color: colors.text, fontSize: font.sizeMD, lineHeight: 22,
  },
  counter: { color: colors.textFaint, fontSize: font.sizeXS, textAlign: 'right', marginTop: spacing.xs },
  note: { color: colors.textMuted, fontSize: font.sizeSM, marginTop: spacing.sm },
  error: { color: colors.danger, fontSize: font.sizeSM, marginTop: spacing.md },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
});
