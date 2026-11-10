// Мост между пушами и экранами.
//  • Пуш при открытом приложении: система его не показывает, поэтому рисуем
//    свою карточку сверху (кроме случая, когда человек уже в этой переписке)
//    и сразу просим чаты обновиться. Карточку можно смахнуть вверх, по нажатию
//    открывается переписка, полоска внизу показывает, сколько ей осталось.
//  • Нажатие на системный пуш (из фона или с холодного старта) открывает
//    переписку.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './AppText';
import Avatar from './Avatar';
import { ChatIcon, ChevronRight } from './Icons';
import { colors, spacing, type } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  conversationIdOf, subscribeForegroundMessages, subscribeNotificationOpens,
} from '../utils/push';
import { emitChatActivity } from '../utils/chatEvents';
import { isImageBody } from '../utils/chatFormat';
import { resolveMediaUrl } from '../utils/media';

const SHOW_MS = 5000;
const HIDDEN = -220;

function titleOf(msg) {
  return msg?.data?.sender_name || msg?.notification?.title || 'Новое сообщение';
}
function bodyOf(msg) {
  const text = msg?.data?.preview || msg?.notification?.body || '';
  // Фото в чате уходит ссылкой на файл — вместо пути пишем «Фото».
  return isImageBody(text) ? '📷 Фото' : text;
}
function productOf(msg) {
  const title = msg?.data?.product_title;
  return title && title !== titleOf(msg) ? title : '';
}
function avatarOf(msg) {
  const raw = msg?.data?.sender_avatar || msg?.data?.sender_profile_pic_url;
  return raw ? resolveMediaUrl(raw) : null;
}

export default function PushBridge({ navigationRef }) {
  const { isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [banner, setBanner] = useState(null);
  const shift = useRef(new Animated.Value(HIDDEN)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef(null);

  const openConversation = useCallback((msg) => {
    const id = conversationIdOf(msg);
    const go = () => {
      if (!navigationRef.isReady()) return false;
      if (id) {
        navigationRef.navigate('Conversation', { conversationId: id, name: titleOf(msg) });
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
    progress.stopAnimation();
    Animated.timing(shift, { toValue: HIDDEN, duration: 200, useNativeDriver: true })
      .start(() => setBanner(null));
  }, [shift, progress]);

  // Таймер скрытия; пока палец на карточке — стоит.
  const startTimer = useCallback((ms = SHOW_MS) => {
    clearTimeout(hideTimer.current);
    progress.setValue(1);
    Animated.timing(progress, { toValue: 0, duration: ms, useNativeDriver: true }).start();
    hideTimer.current = setTimeout(hide, ms);
  }, [hide, progress]);

  // Смахнуть вверх — закрыть; отпустить раньше — вернуть на место.
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
    onPanResponderGrant: () => {
      clearTimeout(hideTimer.current);
      progress.stopAnimation();
    },
    onPanResponderMove: (_, g) => shift.setValue(Math.min(g.dy * (g.dy > 0 ? 0.25 : 1), 24)),
    onPanResponderRelease: (_, g) => {
      if (g.dy < -30 || g.vy < -0.5) hideRef.current();
      else {
        Animated.spring(shift, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
        startRef.current(2500);
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(shift, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
      startRef.current(2500);
    },
  })).current;
  const hideRef = useRef(hide);
  hideRef.current = hide;
  const startRef = useRef(startTimer);
  startRef.current = startTimer;

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const offMessage = subscribeForegroundMessages((msg) => {
      emitChatActivity({ conversationId: conversationIdOf(msg) });
      const route = navigationRef.isReady() ? navigationRef.getCurrentRoute() : null;
      const id = conversationIdOf(msg);
      // Уже смотрит эту переписку — сообщение и так появится на экране.
      if (id && route?.name === 'Conversation' && route?.params?.conversationId === id) return;
      setBanner({ ...msg, receivedAt: Date.now() });
      shift.setValue(HIDDEN);
      Animated.spring(shift, { toValue: 0, useNativeDriver: true, friction: 8, tension: 70 }).start();
      startTimer();
    });
    const offOpen = subscribeNotificationOpens(openConversation);
    return () => {
      offMessage();
      offOpen();
      clearTimeout(hideTimer.current);
    };
  }, [isLoggedIn, navigationRef, openConversation, shift, startTimer]);

  if (!banner) return null;
  const title = titleOf(banner);
  const body = bodyOf(banner);
  const product = productOf(banner);
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingTop: insets.top + 6, transform: [{ translateY: shift }] }]}
    >
      <View style={styles.shadow} {...pan.panHandlers}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Новое сообщение от ${title}: ${body}`}
          onPress={() => { const msg = banner; hide(); openConversation(msg); }}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <View style={styles.topRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brand}>ARVELL · сообщение</Text>
            <Text style={styles.when}>сейчас</Text>
          </View>
          <View style={styles.mainRow}>
            <View>
              <Avatar uri={avatarOf(banner)} name={title} size={44} />
              <View style={styles.badge}><ChatIcon size={10} color={colors.accentText} /></View>
            </View>
            <View style={styles.texts}>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
              {!!product && <Text style={styles.product} numberOfLines={1}>{product}</Text>}
              {!!body && <Text style={styles.body} numberOfLines={2}>{body}</Text>}
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </View>
          <View style={styles.track}>
            <Animated.View style={[styles.bar, { transform: [{ scaleX: progress }] }]} />
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: 10, zIndex: 1000, elevation: 24,
  },
  shadow: {
    shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 8 },
    elevation: 24,
  },
  card: {
    backgroundColor: '#161616',
    borderWidth: 1, borderColor: '#333333', borderTopColor: colors.accent, borderTopWidth: 2,
    paddingTop: 10, overflow: 'hidden',
  },
  cardPressed: { backgroundColor: '#1F1F1F' },
  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 8 },
  brandDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginRight: 7 },
  brand: { ...type.mono, flex: 1, fontSize: 10, color: colors.textSub },
  when: { ...type.mono, fontSize: 10, color: colors.textMuted },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingBottom: 12 },
  badge: {
    position: 'absolute', right: -3, bottom: -3, width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#161616',
  },
  texts: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 15.5, fontWeight: '700' },
  product: { color: colors.accent, fontSize: 12, marginTop: 1 },
  body: { color: colors.textSub, fontSize: 14, marginTop: 3, lineHeight: 19 },
  track: { height: 2, backgroundColor: '#262626' },
  bar: { height: 2, backgroundColor: colors.accent, width: '100%', transformOrigin: 'left' },
});
