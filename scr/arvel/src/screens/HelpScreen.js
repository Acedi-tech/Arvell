// Экран помощи: FAQ (раскрывающиеся) + служба поддержки.
import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, font } from '../theme';
import { BackIcon, ChevronRight } from '../components/Icons';

const FAQ = [
  { q: 'Товары на ARVELL проверены на подлинность?', a: 'Да. Каждый товар на ARVELL проходит проверку подлинности, отдельно ничего делать не нужно. Состояние вещи всё равно осмотрите при встрече.' },
  { q: 'Когда и как оплачивать товар?', a: 'Лично, при получении, после того как вы осмотрели вещь. ARVELL не принимает платежи и не хранит деньги пользователей. Не соглашайтесь на предоплату.' },
  { q: 'Кто организует доставку?', a: 'Покупатель и продавец договариваются о встрече в чате сами. ARVELL не организует доставку и не отвечает за встречу, поэтому выбирайте людное и безопасное место.' },
  { q: 'Как стать продавцом на ARVELL?', a: 'Только по приглашению команды ARVELL. Если вы получили приглашение, при регистрации выберите «Я продавец» и введите код приглашения.' },
  { q: 'Что делать, если товар не соответствует описанию?', a: 'Не оплачивайте его. Пока товар не передан и не оплачен, любая сторона может отказаться от сделки без каких-либо санкций.' },
  { q: 'У меня просят код из SMS или предоплату. Что делать?', a: 'Ничего не отправляйте и прекратите общение. Сотрудники ARVELL никогда не спрашивают код из SMS, а оплата на ARVELL проходит только лично, при получении товара.' },
];

function FaqItem({ item, open, onToggle, last }) {
  return (
    <View style={[!last && styles.faqBorder]}>
      <Pressable style={styles.faqHead} onPress={onToggle}>
        <Text style={styles.faqQ}>{item.q}</Text>
        <View style={open && styles.chevronOpen}>
          <ChevronRight size={20} />
        </View>
      </Pressable>
      {open && <Text style={styles.faqA}>{item.a}</Text>}
    </View>
  );
}

export default function HelpScreen({ navigation }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable hitSlop={10} accessibilityLabel="Назад" onPress={() => navigation.goBack()}><BackIcon size={26} /></Pressable>
        <Text style={styles.headerTitle}>Помощь</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Text style={styles.section}>Частые вопросы</Text>
        <View style={styles.card}>
          {FAQ.map((item, i) => (
            <FaqItem
              key={i}
              item={item}
              open={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              last={i === FAQ.length - 1}
            />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { color: colors.text, fontSize: font.sizeLG, fontWeight: '800' },
  section: { color: colors.text, fontSize: font.sizeLG, fontWeight: '800', paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.md },
  card: { marginHorizontal: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  faqBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  faqHead: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  faqQ: { flex: 1, color: colors.text, fontSize: font.sizeMD, fontWeight: '700', lineHeight: 22 },
  faqA: { color: colors.textMuted, fontSize: font.sizeMD, lineHeight: 22, paddingHorizontal: spacing.md, paddingBottom: spacing.md, marginTop: -4 },
  supportRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  supportIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  supportTitle: { color: colors.text, fontSize: font.sizeMD, fontWeight: '700' },
  supportSub: { color: colors.textMuted, fontSize: font.sizeSM, marginTop: 2 },
});