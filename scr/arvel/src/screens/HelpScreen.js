// Экран помощи: FAQ (раскрывающиеся) + служба поддержки.
import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, type } from '../theme';
import ChevronDown from '../components/ChevronDown';
import Header from '../components/Header';

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
      <Pressable style={styles.faqHead} onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <Text style={styles.faqQ}>{item.q}</Text>
        <View style={open && styles.chevronOpen}>
          <ChevronDown size={18} color={open ? colors.accent : colors.textMuted} />
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
      <Header title="Помощь" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  section: { ...type.mono, fontSize: 10.5, color: colors.textMuted, marginBottom: spacing.sm },
  card: { borderWidth: 1, borderColor: colors.border },
  faqBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  faqHead: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  faqQ: { flex: 1, color: colors.text, fontSize: 14.5, fontWeight: '600', lineHeight: 20 },
  faqA: { color: colors.textSub, fontSize: 13.5, lineHeight: 21, paddingHorizontal: 14, paddingBottom: 14 },
});
