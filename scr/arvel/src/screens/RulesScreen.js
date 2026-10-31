// Экран правил площадки.
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, type } from '../theme';
import Header from '../components/Header';

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
      <Header title="Правила" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {RULES.map((r, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.title}>{i + 1}. {r.title}</Text>
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
  content: { padding: spacing.md, paddingTop: 18, paddingBottom: spacing.xl },
  section: { marginBottom: 20 },
  title: { ...type.monoMedium, fontSize: 11.5, color: colors.accent, marginBottom: 6 },
  text: { color: colors.textSub, fontSize: 14, lineHeight: 22 },
  updated: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
});
