// Диагностика пушей: по шагам показывает, где обрывается цепочка
// разрешение → токен Apple → токен Firebase → регистрация на сервере.
// В меню её нет, открывается ссылкой arvell://dev/push (набрать в Safari).
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/AppText';
import Header from '../components/Header';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { getPushStatus, onPushStatus, retryPushRegistration } from '../utils/push';
import { colors, spacing } from '../theme';

function Row({ label, value }) {
  const v = String(value ?? '');
  const bad = value == null || (v !== 'нет ошибок' && /^нет|запрещ|ошибк|не /i.test(v));
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, bad ? styles.bad : styles.good]} selectable>
        {value == null ? '—' : String(value)}
      </Text>
    </View>
  );
}

export default function PushDebugScreen({ navigation }) {
  const { user, isLoggedIn } = useAuth();
  const [s, setS] = useState(getPushStatus());
  const [busy, setBusy] = useState(false);
  useEffect(() => onPushStatus(setS), []);

  const retry = async () => {
    setBusy(true);
    try { await retryPushRegistration(); } finally { setBusy(false); setS(getPushStatus()); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Header title="Пуши" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <Row label="Аккаунт" value={isLoggedIn ? (user?.phone || user?.id) : 'не вошли'} />
        <Row label="Платформа" value={Platform.OS} />
        <Row label="Разрешение" value={s.permission} />
        {Platform.OS === 'ios' && <Row label="Токен Apple" value={s.apns && `${s.apns} (${s.apnsSource || '?'})`} />}
        <Row label="Токен Firebase" value={s.fcm} />
        <Row label="Сервер" value={s.server} />
        <Row label="Ошибка" value={s.error || 'нет ошибок'} />
        <Row label="Попытка" value={s.startedAt} />
        <Text style={styles.hint}>
          Сделайте скриншот этого экрана и пришлите разработчику.
        </Text>
        <Button title="Повторить регистрацию" onPress={retry} loading={busy} disabled={!isLoggedIn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { padding: spacing.md, gap: 12 },
  row: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 },
  label: { color: colors.textMuted, fontSize: 12.5 },
  value: { fontSize: 15, marginTop: 3 },
  good: { color: colors.text },
  bad: { color: colors.accent },
  hint: { color: colors.textMuted, fontSize: 13, marginVertical: spacing.sm },
});
