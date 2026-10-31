// Экран «Заказы» (покупатель) / «Продажи» (продавец).
// Открывается из плиток статистики в «Профиле».
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, type } from '../theme';
import { TeeIcon } from '../components/Icons';
import Header from '../components/Header';
import Button from '../components/Button';
import BottomSheet from '../components/BottomSheet';
import { useAuth } from '../context/AuthContext';
import { useMoney } from '../context/AppConfigContext';
import { listMyPurchases, listMySales } from '../api/purchases';
import { listMyReviews } from '../api/reviews';
import { resolveMediaUrl } from '../utils/media';
import { formatTime } from '../utils/chatFormat';

export default function OrdersScreen({ navigation }) {
  const { user } = useAuth();
  const money = useMoney();
  const isSeller = user?.role === 'seller';
  // «Заказы»/«Продажи» подразумевали текущие, незавершённые заказы — а тут
  // только история уже прошедших сделок (mock, нет эндпоинта активных
  // заказов). Заголовок и пустое состояние теперь говорят прямо об этом.
  const title = isSeller ? 'Подтверждённые продажи' : 'Завершённые сделки';
  const rowLabel = isSeller ? 'Продажа' : 'Покупка';
  const [selected, setSelected] = useState(null);

  // Раньше экран показывал одну и ту же выдуманную историю всем подряд.
  // Подтверждения покупок бэкенд отдаёт: покупателю — /me/purchases,
  // продавцу — /purchase-confirmations, схема ответа одинаковая.
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await (isSeller ? listMySales({ limit: 50 }) : listMyPurchases({ limit: 50 }));
      setDeals((res?.data ?? []).map((c) => ({
        id: c.id,
        productId: c.product?.id,
        title: [c.product?.brand?.name, c.product?.title].filter(Boolean).join(' '),
        priceMinor: c.product?.price_minor,
        date: formatTime(c.confirmed_at),
        thumbnail: resolveMediaUrl(c.product?.thumbnail_url),
        shopName: c.product?.seller?.shop_name,
      })));
    } catch (e) {
      setError(e?.message || 'Не удалось загрузить историю сделок.');
    } finally {
      setLoading(false);
    }
  }, [isSeller]);

  useEffect(() => { load(); }, [load]);

  // Покупателю — какие покупки он уже оценил, чтобы не предлагать отзыв
  // повторно (бэкенд принимает один отзыв на товар). Перечитываем при
  // возвращении на экран: человек мог только что отправить отзыв.
  const [reviewedIds, setReviewedIds] = useState(() => new Set());
  useFocusEffect(useCallback(() => {
    if (isSeller) return undefined;
    let cancelled = false;
    listMyReviews({ limit: 100 })
      .then((res) => {
        if (!cancelled) setReviewedIds(new Set((res?.data ?? []).map((r) => r.product_id)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isSeller]));

  const openWriteReview = (deal) => {
    setSelected(null);
    navigation.navigate('WriteReview', { productId: deal.productId, title: deal.title, thumbnail: deal.thumbnail });
  };

  const sellerName = (d) => d.shopName;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title={title} onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl, flexGrow: 1 }}>
        {loading ? (
          <View style={styles.empty}><ActivityIndicator color={colors.accent} /></View>
        ) : deals.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {error || (isSeller ? 'Пока нет продаж' : 'Пока нет завершённых сделок')}
            </Text>
            {!error && (
              <Text style={styles.emptySub}>
                {isSeller
                  ? 'Подтвердите продажу в чате с покупателем, и она появится здесь'
                  : 'Ваши покупки появятся здесь, когда продавец подтвердит продажу'}
              </Text>
            )}
          </View>
        ) : (
          deals.map((d) => (
            <Pressable
              key={d.id}
              style={styles.dealRow}
              disabled={isSeller}
              onPress={() => setSelected(d)}
            >
              <View style={styles.dealImg}>
                {d.thumbnail
                  ? <Image source={{ uri: d.thumbnail }} style={styles.dealThumb} />
                  : <TeeIcon size={36} />}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.dealTitle} numberOfLines={1}>{d.title}</Text>
                <Text style={styles.dealSub}>{rowLabel} · {d.date}</Text>
              </View>
              <Text style={styles.dealPrice}>{money.formatMinor(d.priceMinor)}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      <BottomSheet visible={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <>
            <View style={styles.sheetImg}>
              {selected.thumbnail
                ? <Image source={{ uri: selected.thumbnail }} style={styles.dealThumb} />
                : <TeeIcon size={72} />}
            </View>
            <Text style={styles.sheetTitle}>{selected.title}</Text>
            <Text style={styles.sheetSub}>
              {[rowLabel, selected.date, sellerName(selected)].filter(Boolean).join(' · ')}
            </Text>
            <Text style={styles.sheetPrice}>{money.formatMinor(selected.priceMinor)}</Text>
            {!!selected.productId && (
              reviewedIds.has(selected.productId) ? (
                <Text style={styles.reviewDone}>✓ Вы уже оставили отзыв на эту покупку</Text>
              ) : (
                <Button title="Оставить отзыв" onPress={() => openWriteReview(selected)} />
              )
            )}
          </>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 90 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: spacing.sm },
  emptySub: { color: colors.textMuted, fontSize: 13.5, lineHeight: 20, textAlign: 'center' },

  dealRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  dealImg: { width: 56, height: 56, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  dealThumb: { width: '100%', height: '100%' },
  dealTitle: { color: colors.text, fontSize: 14.5, fontWeight: '600' },
  dealSub: { color: colors.textMuted, fontSize: 12.5, marginTop: 3 },
  dealPrice: { color: colors.accent, fontSize: 14.5, fontWeight: '800' },

  sheetImg: { height: 170, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sheetTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 14 },
  sheetSub: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  sheetPrice: { ...type.display, color: colors.accent, fontSize: 22, marginTop: 10, marginBottom: spacing.md },
  reviewDone: { color: colors.success, fontSize: 14, fontWeight: '600', marginBottom: spacing.sm },
});
