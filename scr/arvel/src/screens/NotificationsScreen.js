// Настройки уведомлений (Editorial, design/v3-c.jsx → V3Notif).
// Сервер присылает уведомления только о новых сообщениях, поэтому пунктов
// два: сообщения и новости ARVELL.
import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing } from '../theme';
import Header from '../components/Header';
import Toggle from '../components/Toggle';

// В спеке нет эндпоинта настроек — сохраняем локально, иначе переключатели
// сбрасывались бы при каждом уходе с экрана.
const STORAGE_KEY = 'arvell.notification_prefs';
const DEFAULTS = { msg: true, news: false };

function Row({ title, subtitle, value, onValueChange, last }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      <Toggle value={value} onValueChange={onValueChange} accessibilityLabel={title} />
    </View>
  );
}

export default function NotificationsScreen({ navigation }) {
  const [msg, setMsg] = useState(DEFAULTS.msg);
  const [news, setNews] = useState(DEFAULTS.news);
  // Не пишем в хранилище, пока не прочитали сохранённые значения —
  // иначе первый рендер с дефолтами затёр бы то, что человек уже выбрал.
  const loaded = useRef(false);
  const saved = useRef({});

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        saved.current = JSON.parse(raw) || {};
        if (saved.current.msg != null) setMsg(saved.current.msg);
        if (saved.current.news != null) setNews(saved.current.news);
      })
      .catch(() => {})
      .finally(() => { loaded.current = true; });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved.current, msg, news })).catch(() => {});
  }, [msg, news]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Уведомления" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Row title="Новые сообщения" subtitle="Когда собеседник пишет вам в чат" value={msg} onValueChange={setMsg} />
          <Row title="Новости и акции" subtitle="Подборки и новости ARVELL" value={news} onValueChange={setNews} last />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  card: { borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTitle: { color: colors.text, fontSize: 15 },
  rowSub: { color: colors.textMuted, fontSize: 12.5, marginTop: 3, lineHeight: 17 },
});
