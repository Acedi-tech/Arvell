// Мост между пушами и экранами.
//  • Пуш при открытом приложении: система его не показывает, поэтому рисуем
//    свою плашку сверху (кроме случая, когда человек уже в этой переписке)
//    и сразу просим чаты обновиться.
//  • Нажатие на пуш (из фона или с холодного старта) открывает переписку.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './AppText';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  conversationIdOf, subscribeForegroundMessages, subscribeNotificationOpens,
} from '../utils/push';
import { emitChatActivity } from '../utils/chatEvents';

const SHOW_MS = 4000;

function titleOf(msg) {
  return msg?.notification?.title || msg?.data?.sender_name || 'Новое сообщение';
}
function bodyOf(msg) {
  return msg?.notification?.body || msg?.data?.preview || '';
}

export default function PushBridge({ navigationRef }) {
  const { isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [banner, setBanner] = useState(null);
  const shift = useRef(new Animated.Value(-160)).current;
  const hideTimer = useRef(null);

  const openConversation = useCallback((msg) => {
    const id = conversationIdOf(msg);
    const go = () => {
      if (!navigationRef.isReady()) return false;
      if (id) {
        navigationRef.navigate('Conversation', { conversationId: id, name: msg?.data?.sender_name || titleOf(msg) });
      } else {
        navigationRef.navigate('Main', { screen: 'Chat' });
      }
      return true;
    };
    // С холодного старта навигация может быть ещё не готова.
    if (!go()) {
      let tries = 0;
      const t = setInterval(() => {
        tries += 1;
        if (go() || tries > 20) clearInterval(t);
      }, 250);
    }
  }, [navigationRef]);

  const hide = useCallback(() => {
    clearTimeout(hideTimer.current);
    Animated.timing(shift, { toValue: -160, duration: 180, useNativeDriver: true })
      .start(() => setBanner(null));
  }, [shift]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const offMessage = subscribeForegroundMessages((msg) => {
      emitChatActivity({ conversationId: conversationIdOf(msg) });
      const route = navigationRef.isReady() ? navigationRef.getCurrentRoute() : null;
      const id = conversationIdOf(msg);
      // Уже смотрит эту переписку — сообщение и так появится на экране.
      if (id && route?.name === 'Conversation' && route?.params?.conversationId === id) return;
      setBanner(msg);
      shift.setValue(-160);
      Animated.spring(shift, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(hide, SHOW_MS);
    });
    const offOpen = subscribeNotificationOpens(openConversation);
    return () => {
      offMessage();
      offOpen();
      clearTimeout(hideTimer.current);
    };
  }, [isLoggedIn, navigationRef, openConversation, hide, shift]);

  if (!banner) return null;
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingTop: insets.top + spacing.sm, transform: [{ translateY: shift }] }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Уведомление: ${titleOf(banner)}`}
        onPress={() => { const msg = banner; hide(); openConversation(msg); }}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.bar} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title} numberOfLines={1}>{titleOf(banner)}</Text>
          {!!bodyOf(banner) && <Text style={styles.body} numberOfLines={2}>{bodyOf(banner)}</Text>}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.md, zIndex: 1000, elevation: 20 },
  card: {
    flexDirection: 'row', gap: 12, alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    paddingVertical: 12, paddingRight: 14,
  },
  bar: { width: 4, alignSelf: 'stretch', backgroundColor: colors.accent },
  title: { color: colors.text, fontSize: 15, fontWeight: '700' },
  body: { color: colors.textSub, fontSize: 13.5, marginTop: 2, lineHeight: 18 },
});
