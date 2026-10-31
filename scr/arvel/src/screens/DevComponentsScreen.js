// Витрина базовых компонентов Editorial во всех состояниях — чтобы сверить
// их с прототипом. В меню её нет, открывается только ссылкой
// arvell://dev/components.
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/AppText';
import Header from '../components/Header';
import Button from '../components/Button';
import Chip from '../components/Chip';
import TextField from '../components/TextField';
import Avatar from '../components/Avatar';
import StarRating from '../components/StarRating';
import Toggle from '../components/Toggle';
import ConfirmDialog from '../components/ConfirmDialog';
import BottomSheet from '../components/BottomSheet';
import SuccessOverlay from '../components/SuccessOverlay';
import EmptyState from '../components/EmptyState';
import { HeartIcon } from '../components/Icons';
import { colors, spacing, type, fonts } from '../theme';

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function DevComponentsScreen({ navigation }) {
  const [chip, setChip] = useState('ВСЕ');
  const [toggle, setToggle] = useState(true);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('Оригинал, носил один сезон.');
  const [rating, setRating] = useState(4);
  const [dialog, setDialog] = useState(null);
  const [sheet, setSheet] = useState(false);
  const [success, setSuccess] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Компоненты" subtitle="Editorial · dev" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Типографика">
          <Text style={[type.display, styles.logo]}>ARVELL</Text>
          <Text style={[type.display, styles.h1]}>Архив Stone Island</Text>
          <Text style={[type.display, styles.price]}>8 900 €</Text>
          <Text style={styles.body}>Оплата и передача товара — при встрече с продавцом.</Text>
          <Text style={[styles.body, { fontWeight: '700' }]}>Nike Air Max 90 · EUR 42 · Отличное</Text>
          <Text style={[type.mono, styles.mono]}>Проверено ARVELL · ещё ↗</Text>
        </Section>

        <Section title="Кнопки">
          <Button title="Купить" onPress={() => {}} />
          <Button title="Написать" variant="ghost" onPress={() => {}} />
          <Button title="Оставить отзыв" variant="outline" onPress={() => {}} />
          <Button title="Удалить объявление" variant="danger" onPress={() => {}} />
          <Button title="Опубликовать" disabled />
          <Button title="Загрузка" loading />
        </Section>

        <Section title="Чипсы">
          <View style={styles.row}>
            {['ВСЕ', 'NIKE', 'STONE ISLAND', 'CARHARTT WIP'].map((c) => (
              <Chip key={c} label={c} active={chip === c} onPress={() => setChip(c)} />
            ))}
          </View>
        </Section>

        <Section title="Поля">
          <TextField label="Имя" placeholder="Введите имя" value={name} onChangeText={setName} />
          <TextField label="Код приглашения" value="ARV-XXXX" error="Код приглашения недействителен. Уточните его у команды ARVELL" onChangeText={() => {}} />
          <TextField label="Описание" multiline counter maxLength={1000} value={about} onChangeText={setAbout} />
        </Section>

        <Section title="Аватары и звёзды">
          <View style={[styles.row, { alignItems: 'center' }]}>
            <Avatar name="Мария" size={50} />
            <Avatar name="Alex Shop" size={72} ring />
            <StarRating value={4.6} size={16} />
          </View>
          <StarRating value={rating} size={40} gap={spacing.sm} onChange={setRating} />
        </Section>

        <Section title="Переключатель">
          <View style={[styles.row, { alignItems: 'center' }]}>
            <Toggle value={toggle} onValueChange={setToggle} accessibilityLabel="Новые сообщения" />
            <Toggle value={false} onValueChange={() => {}} disabled />
          </View>
        </Section>

        <Section title="Диалог, шторка, успех">
          <Button title="Диалог: удалить" variant="ghost" onPress={() => setDialog('danger')} />
          <Button title="Диалог: подтвердить" variant="ghost" onPress={() => setDialog('accent')} />
          <Button title="Шторка" variant="ghost" onPress={() => setSheet(true)} />
          <Button title="Экран успеха" variant="ghost" onPress={() => setSuccess(true)} />
        </Section>

        <Section title="Пустое состояние">
          <EmptyState
            icon={<HeartIcon size={28} color={colors.textMuted} />}
            title="Пока пусто"
            message="Добавляйте товары в избранное, нажимая на сердечко"
          />
          <EmptyState title="Нет связи с сервером" message="Проверьте интернет" actionTitle="Повторить" onAction={() => {}} />
        </Section>

        <Text style={styles.footnote}>Шрифты: {fonts.display}, {fonts.regular}, {fonts.mono}</Text>
      </ScrollView>

      <ConfirmDialog
        visible={!!dialog}
        title={dialog === 'danger' ? 'Удалить объявление?' : 'Подтвердить продажу?'}
        message={dialog === 'danger' ? 'Объявление исчезнет из ленты.' : 'После подтверждения покупатель сможет оставить отзыв.'}
        confirmText={dialog === 'danger' ? 'Удалить' : 'Подтвердить'}
        confirmTone={dialog === 'danger' ? 'danger' : 'accent'}
        onCancel={() => setDialog(null)}
        onConfirm={() => setDialog(null)}
      />
      <BottomSheet visible={sheet} onClose={() => setSheet(false)} title="Фото">
        <Button title="Камера" variant="ghost" onPress={() => setSheet(false)} style={{ marginBottom: spacing.sm }} />
        <Button title="Галерея" variant="ghost" onPress={() => setSheet(false)} />
      </BottomSheet>
      <SuccessOverlay
        visible={success}
        title="Товар опубликован"
        message="Покупатели увидят его в ленте."
        onClose={() => setSuccess(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  section: { marginBottom: spacing.xl, gap: spacing.sm },
  sectionTitle: { ...type.mono, fontSize: 11, color: colors.textMuted, marginBottom: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  logo: { fontSize: 21, color: colors.accent },
  h1: { fontSize: 25, color: colors.text },
  price: { fontSize: 26, color: colors.accent },
  body: { fontSize: 15, color: colors.textSub },
  mono: { fontSize: 12, color: colors.accent },
  footnote: { ...type.mono, fontSize: 10, color: colors.textFaint, textAlign: 'center' },
});
