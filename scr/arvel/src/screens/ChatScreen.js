import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, Alert } from 'react-native';
import { Text, TextInput } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, font, type } from '../theme';
import { SearchIcon, ChatIcon } from '../components/Icons';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import CheckIcon from '../components/CheckIcon';
import { listConversations, markConversationRead } from '../api/chat';
import { useAuth } from '../context/AuthContext';
import { useChatUnread } from '../context/ChatUnreadContext';
import { formatTime } from '../utils/chatFormat';
import { resolveMediaUrl } from '../utils/media';
import { loadHiddenChats, hideChats } from '../storage/chatStorage';

export default function ChatScreen({ navigation }) {
  const [query, setQuery] = useState('');
  // Диалоги приходят с бэкенда. Раньше тут лежали выдуманные собеседники,
  // из-за чего раздел выглядел работающим, хотя ни одного настоящего
  // сообщения в нём не было.
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { refresh: refreshUnread } = useChatUnread();

  const mapConversation = useCallback((c) => {
    // Собеседник зависит от роли: покупатель видит магазин, продавец —
    // покупателя.
    const iAmSeller = !!user?.id && c.seller?.seller_id === user.id;
    return {
      id: c.id,
      name: (iAmSeller ? c.buyer?.display_name : c.seller?.shop_name) || 'Диалог',
      avatar: resolveMediaUrl(iAmSeller ? c.buyer?.profile_pic_url : c.seller?.profile_pic_url),
      // Рейтинг — у магазина; продавцу рядом с именем покупателя он ни к чему.
      rating: iAmSeller ? null : c.seller?.rating,
      status: c.status,
      phone: c.seller?.phone,
      last: c.last_message_preview || 'Нет сообщений',
      at: c.last_message_at || c.created_at,
      unread: c.unread_count || 0,
      dot: (c.unread_count || 0) > 0,
    };
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        setError(null);
        try {
          const [res, hidden] = await Promise.all([
            listConversations({ limit: 50 }),
            loadHiddenChats(),
          ]);
          if (!alive) return;
          setThreads((res?.data ?? [])
            .filter((c) => !hidden.includes(c.id))
            .map(mapConversation));
        } catch (e) {
          if (alive) setError(e?.message || 'Не удалось загрузить чаты.');
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => { alive = false; };
    }, [mapConversation]),
  );
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const data = threads.filter((t) => (t.name || '').toLowerCase().includes(query.trim().toLowerCase()));

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds([]);
  };

  const toggleSelectMode = () => {
    if (selectMode) exitSelectMode();
    else setSelectMode(true);
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleRowPress = (item) => {
    if (selectMode) toggleSelected(item.id);
    else navigation.navigate('Conversation', {
      conversationId: item.id, name: item.name, rating: item.rating, phone: item.phone, avatar: item.avatar, status: item.status,
    });
  };

  const markSelectedRead = () => {
    if (selectedIds.length === 0) return;
    const ids = selectedIds;
    setThreads(threads.map((t) => (ids.includes(t.id) ? { ...t, unread: 0, dot: false } : t)));
    Promise.all(ids.map((id) => markConversationRead(id).catch(() => {})))
      .then(refreshUnread);
    exitSelectMode();
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;
    Alert.alert(
      'Скрыть чаты?',
      `Будет скрыто чатов: ${selectedIds.length}. Они исчезнут только у вас — собеседник продолжит видеть переписку.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Скрыть',
          style: 'destructive',
          onPress: () => {
            const ids = selectedIds;
            setThreads(threads.filter((t) => !ids.includes(t.id)));
            hideChats(ids);
            exitSelectMode();
          },
        },
      ],
    );
  };

  const n = selectedIds.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <View style={styles.headerSide}>
          {selectMode && (
            <Pressable hitSlop={8} onPress={exitSelectMode}>
              <Text style={styles.action}>Отмена</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.title}>{selectMode ? `Выбрано: ${n}` : 'Чаты'}</Text>
        <View style={[styles.headerSide, styles.headerRight]}>
          {!selectMode && threads.length > 0 && (
            <Pressable hitSlop={8} onPress={toggleSelectMode}>
              <Text style={styles.action} numberOfLines={1}>Выбрать</Text>
            </Pressable>
          )}
        </View>
      </View>

      {threads.length > 0 && (
        <View style={styles.searchWrap}>
          <SearchIcon size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Поиск по чатам"
            placeholderTextColor={colors.textFaint}
            selectionColor={colors.accent}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={(t) => t.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={data.length === 0 && styles.emptyWrap}
        ListEmptyComponent={
          loading ? (
            <Text style={styles.empty}>Загружаем чаты...</Text>
          ) : error ? (
            <Text style={styles.empty}>{error}</Text>
          ) : query.trim() ? (
            <Text style={styles.empty}>Ничего не найдено</Text>
          ) : (
            <EmptyState
              icon={<ChatIcon size={28} color={colors.textMuted} />}
              title="Пока нет сообщений"
              message="Напишите продавцу со страницы товара — диалог появится здесь"
            />
          )
        }
        renderItem={({ item }) => {
          const checked = selectedIds.includes(item.id);
          const closed = item.status === 'closed';
          return (
            <Pressable style={styles.row} onPress={() => handleRowPress(item)}>
              {selectMode && (
                <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                  {checked && <CheckIcon size={14} />}
                </View>
              )}
              <Avatar uri={item.avatar} name={item.name} size={50} />
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.time}>{formatTime(item.at)}</Text>
                </View>
                <View style={styles.rowBottom}>
                  <Text style={[styles.last, closed && styles.lastClosed]} numberOfLines={1}>
                    {closed ? 'Переписка закрыта' : item.last}
                  </Text>
                  {item.unread > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
      />

      {selectMode && (
        <View style={styles.panel}>
          <Button title="✓ Отметить прочитанным" disabled={n === 0} onPress={markSelectedRead} style={{ flex: 1 }} />
          <Button title="Скрыть" variant="danger" disabled={n === 0} onPress={deleteSelected} style={styles.hideBtn} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRow: {
    minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { ...type.display, color: colors.accent, fontSize: 16, textAlign: 'center' },
  headerSide: { width: 90 },
  headerRight: { alignItems: 'flex-end' },
  action: { color: colors.accent, fontSize: 14.5, fontWeight: '600' },

  searchWrap: {
    minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    marginHorizontal: spacing.md, marginTop: 12, marginBottom: 6, paddingHorizontal: 14,
  },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 10 },

  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  empty: {
    color: colors.textMuted, fontSize: font.sizeSM,
    textAlign: 'center', lineHeight: 21, paddingHorizontal: spacing.lg,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  checkbox: {
    width: 22, height: 22, borderWidth: 1.5, borderColor: '#555',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '700' },
  time: { color: colors.textMuted, fontSize: 12 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 3 },
  last: { flex: 1, color: colors.textMuted, fontSize: 13.5 },
  lastClosed: { color: '#666', fontStyle: 'italic' },
  badge: {
    minWidth: 20, height: 20, paddingHorizontal: 6, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: colors.accentText, fontSize: 11.5, fontWeight: '700' },

  panel: {
    flexDirection: 'row', gap: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg,
    paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: 14,
  },
  hideBtn: { width: 110 },
});
