// Экран правил площадки.
import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, font } from '../theme';
import { BackIcon } from '../components/Icons';

const RULES = [
  { title: 'Как работает ARVELL', text: 'Покупатель и продавец общаются в чате приложения и договариваются о встрече. Оплата — лично, при получении товара. ARVELL не принимает платежи и не хранит деньги пользователей.' },
  { title: 'Подлинность товаров', text: 'Каждый товар на ARVELL проходит проверку подлинности. Состояние конкретной вещи проверка не гарантирует, поэтому осмотрите её при встрече, прежде чем платить.' },
  { title: 'Продавцы', text: 'Стать продавцом можно только по приглашению команды ARVELL. Продавец обязан продавать только оригинальные вещи, публиковать реальные фотографии товара и честно указывать его состояние.' },
  { title: 'Встреча и доставка', text: 'ARVELL не организует доставку и не отвечает за встречу покупателя и продавца. Встречайтесь в людном и безопасном месте.' },
  { title: 'Безопасность', text: 'Не соглашайтесь на предоплату и не переводите деньги, пока не осмотрели товар. Никому не сообщайте код из SMS: сотрудники ARVELL никогда его не спрашивают. Ведите переписку в чате ARVELL и не переходите по ссылкам от незнакомых собеседников.' },
  { title: 'Отказ от сделки', text: 'Пока товар не передан и не оплачен, покупатель и продавец могут отказаться от сделки без каких-либо санкций.' },
  { title: 'Ответственность', text: 'ARVELL — площадка, на которой покупатели и продавцы находят друг друга. ARVELL не является стороной сделки купли-продажи.' },
  { title: 'Нарушения', text: 'Если пользователь нарушает эти правила, ARVELL вправе ограничить или заблокировать его аккаунт.' },
];

export default function RulesScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable hitSlop={10} accessibilityLabel="Назад" onPress={() => navigation.goBack()}><BackIcon size={26} /></Pressable>
        <Text style={styles.headerTitle}>Правила</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
        {RULES.map((r, i) => (
          <View key={i} style={{ marginBottom: spacing.lg }}>
            <View style={styles.rowHead}>
              <View style={styles.num}><Text style={styles.numText}>{i + 1}</Text></View>
              <Text style={styles.title}>{r.title}</Text>
            </View>
            <Text style={styles.text}>{r.text}</Text>
          </View>
        ))}
        <Text style={styles.updated}>Последнее обновление: октябрь 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { color: colors.text, fontSize: font.sizeLG, fontWeight: '800' },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  num: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  numText: { color: colors.accent, fontSize: font.sizeSM, fontWeight: '800' },
  title: { color: colors.text, fontSize: font.sizeLG, fontWeight: '800' },
  text: { color: colors.textMuted, fontSize: font.sizeMD, lineHeight: 23, paddingLeft: 32 },
  updated: { color: colors.textMuted, fontSize: font.sizeSM, textAlign: 'center', marginTop: spacing.md },
});