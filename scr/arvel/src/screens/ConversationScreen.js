import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Image, Alert, Linking } from 'react-native';
import { Text, TextInput } from '../components/AppText';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, font, type } from '../theme';
import {
  BackIcon, StarIcon, PhoneCallIcon, SendIcon, ImageIcon, CameraIcon,
  TeeIcon, SneakerIcon, CloseIcon, ChevronRight,
} from '../components/Icons';
import Avatar from '../components/Avatar';
import BottomSheet from '../components/BottomSheet';
import PhotoViewer from '../components/PhotoViewer';
import ClipIcon from '../components/ClipIcon';
import KeyboardAware from '../components/KeyboardAware';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAppConfig, useMoney } from '../context/AppConfigContext';
import { useAuth } from '../context/AuthContext';
import { useChatUnread } from '../context/ChatUnreadContext';
import {
  openConversation, getConversation, listMessages, sendMessage, markConversationRead,
} from '../api/chat';
import { uploadImage } from '../api/media';
import { listMySales, confirmSale } from '../api/purchases';
import { prepareForUpload } from '../utils/imageUpload';
import { resolveMediaUrl } from '../utils/media';
import { formatTime, isImageBody } from '../utils/chatFormat';

export default function ConversationScreen({ navigation, route }) {
  const { maxImageBytes, maxImageWidth, maxImageHeight } = useAppConfig();
  const money = useMoney();
  const name = route?.params?.name || 'Продавец';
  // Фото собеседника: из списка чатов/карточки товара, а при открытии чата
  // со страницы товара — из ответа openConversation.
  const [avatar, setAvatar] = useState(route?.params?.avatar || null);
  // Рейтинг показываем только настоящий: раньше при его отсутствии рисовалась
  // выдуманная 4.9 (а в ответе /conversations рейтинга нет вовсе).
  const rating = typeof route?.params?.rating === 'number' ? route.params.rating : null;
  // Закрытый чат (собеседник удалил аккаунт и т.п.): сервер отвечает 409 на
  // отправку, поэтому поле ввода прячем и объясняем почему.
  const [closed, setClosed] = useState(route?.params?.status === 'closed');
  const phone = route?.params?.phone || null;
  const product = route?.params?.product || null;   // если пришли из «Купить»
  const fromBuy = route?.params?.fromBuy || false;

  const Ph = product?.kind === 'sneaker' ? SneakerIcon : TeeIcon;

  // product может прийти в двух формах: реальный товар с бэкенда
  // (price_minor — копейки) или локальный черновик (price — рубли).
  const priceLabel = product
    ? (product.price_minor != null ? money.formatMinor(product.price_minor) : (product.price != null ? money.formatMajor(product.price) : '—'))
    : '';

  // Поле ввода начинается пустым — без заготовленной фразы
  const [text, setText] = useState('');
  // Переписка приходит с бэкенда: раньше она лежала в состоянии экрана и
  // исчезала при выходе из диалога, хотя сервер её хранит.
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [sending, setSending] = useState(false);
  // Диалог либо открыт из списка (id уже известен), либо заводится по товару
  // со страницы «Купить» — POST /conversations идемпотентен и вернёт
  // существующую ветку, если она уже есть.
  const [conversationId, setConversationId] = useState(route?.params?.conversationId || null);
  const { user } = useAuth();
  const { refresh: refreshUnread } = useChatUnread();
  const feedRef = useRef(null);
  // Сама переписка (покупатель, продавец, товар) — нужна продавцу, чтобы
  // подтвердить продажу именно этому покупателю именно этого товара.
  const [conv, setConv] = useState(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      let id = route?.params?.conversationId || null;
      if (id) {
        getConversation(id).then((c) => {
          setConv(c);
          setClosed(c?.status === 'closed');
        }).catch(() => {});
      } else if (product?.id) {
        const opened = await openConversation(product.id);
        id = opened.id;
        setConv(opened);
        setClosed(opened?.status === 'closed');
        if (opened.seller?.profile_pic_url) setAvatar(resolveMediaUrl(opened.seller.profile_pic_url));
      }
      if (!id) {
        // Переписка без товара (например поддержка) бэкендом не поддержана:
        // диалоги заводятся только по конкретному товару.
        setLoadError('Этот диалог пока недоступен — переписка открывается со страницы товара.');
        return;
      }
      setConversationId(id);
      const res = await listMessages(id, { limit: 100 });
      setMessages(res?.data ?? []);
      markConversationRead(id).then(refreshUnread).catch(() => {});
    } catch (e) {
      setLoadError(e?.message || 'Не удалось загрузить переписку.');
    } finally {
      setLoading(false);
    }
  }, [route?.params?.conversationId, product?.id, refreshUnread]);

  useEffect(() => { load(); }, [load]);

  // --- Подтверждение продажи (только продавец) ---
  // Без него покупатель не может оставить отзыв: бэкенд открывает отзыв
  // только по подтверждённой продавцом покупке.
  const buyerId = conv?.buyer?.id;
  const convProductId = conv?.product?.id;
  const isSellerSide = user?.role === 'seller' && !!buyerId && buyerId !== user?.id;
  const [saleConfirmed, setSaleConfirmed] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!isSellerSide || !convProductId) return undefined;
    let cancelled = false;
    listMySales({ limit: 100 })
      .then((res) => {
        if (cancelled) return;
        const found = (res?.data ?? []).some((c) => c.buyer?.id === buyerId && c.product?.id === convProductId);
        setSaleConfirmed(found);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isSellerSide, buyerId, convProductId]);

  const doConfirmSale = async () => {
    setConfirmVisible(false);
    setConfirming(true);
    try {
      await confirmSale({ buyerId, productId: convProductId });
      setSaleConfirmed(true);
    } catch (e) {
      const msg = e?.status === 403
        ? 'Подтвердить продажу может только владелец товара.'
        : e?.status === 409
          ? 'Эта продажа уже подтверждена.'
          : (e?.message || 'Не удалось подтвердить продажу. Попробуйте ещё раз.');
      if (e?.status === 409) setSaleConfirmed(true);
      Alert.alert('Продажа не подтверждена', msg);
    } finally {
      setConfirming(false);
    }
  };
  const convProductTitle = [conv?.product?.brand?.name, conv?.product?.title].filter(Boolean).join(' ');
  const buyerName = conv?.buyer?.display_name || 'Покупатель';
  const [viewerImage, setViewerImage] = useState(null);
  // Фото, выбранное, но ещё не отправленное — показываем превью над полем
  // ввода, чтобы можно было добавить подпись перед отправкой (как в
  // WhatsApp/Telegram), а не отправлять картинку сразу без текста.
  const [pendingImage, setPendingImage] = useState(null);

  const send = async () => {
    const t = text.trim();
    if ((!t && !pendingImage) || !conversationId || sending) return;
    const image = pendingImage;
    setText('');
    setPendingImage(null);
    setSending(true);
    try {
      // Фото уезжает в хранилище тем же путём, что и картинки товаров, а в
      // сообщение попадает ссылка: отдельного поля под вложение у /messages
      // нет, тело сообщения — единственное, что принимает бэкенд.
      const sent = [];
      if (image) {
        // Фото с камеры — 3000–4000 px и несколько мегабайт, хранилище такое
        // отклоняет с 422. Ужимаем под лимиты /config, как фото товара и аватар.
        const url = await uploadImage(await prepareForUpload({ uri: image }, {
          maxWidth: maxImageWidth, maxHeight: maxImageHeight, maxBytes: maxImageBytes,
        }));
        sent.push(await sendMessage(conversationId, url));
      }
      if (t) sent.push(await sendMessage(conversationId, t));
      setMessages((m) => [...m, ...sent]);
      setTimeout(() => feedRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      // Возвращаем написанное в поле, чтобы ничего не пропало
      setText((cur) => cur || t);
      setPendingImage(image);
      if (e?.status === 409) {
        setClosed(true);
        Alert.alert('Переписка закрыта', 'Отправлять сообщения в этот чат больше нельзя.');
      } else {
        Alert.alert('Не отправлено', e?.message || 'Попробуйте ещё раз.');
      }
    } finally {
      setSending(false);
    }
  };

  // Скрепка открывает шторку «Фото / Камера».
  const [attachOpen, setAttachOpen] = useState(false);
  const pickImage = async (source) => {
    setAttachOpen(false);
    const camera = source === 'camera';
    const perm = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        camera ? 'Нет доступа к камере' : 'Нет доступа к фото',
        camera
          ? 'Разрешите доступ к камере в настройках, чтобы сделать фото.'
          : 'Разрешите доступ к галерее в настройках, чтобы отправить фото.',
      );
      return;
    }
    const res = camera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (res.canceled) return;
    setPendingImage(res.assets[0].uri);
  };

  // Мини-карточка товара над перепиской: если пришли со страницы товара —
  // «назад» туда же, иначе открываем товар на «Главной».
  const pinned = conv?.product || product;
  const pinnedTitle = pinned
    ? [typeof pinned.brand === 'string' ? pinned.brand : pinned.brand?.name, pinned.title].filter(Boolean).join(' ')
    : '';
  const pinnedThumb = resolveMediaUrl(pinned?.thumbnail_url || pinned?.images?.[0]?.url);
  const pinnedPrice = pinned?.price_minor != null ? money.formatMinor(pinned.price_minor) : priceLabel;
  const openPinned = () => {
    if (!pinned?.id) return;
    if (product?.id === pinned.id && navigation.canGoBack?.()) navigation.goBack();
    else navigation.navigate('Main', { screen: 'Feed', params: { screen: 'Product', params: { id: pinned.id }, initial: false } });
  };

  // Продавец пока не отдаёт номер телефона через API (только имя магазина и
  // рейтинг) — как только бэкенд добавит поле, кнопка сразу заработает.
  // До тех пор явно сообщаем, что номера нет, вместо того чтобы молчать.
  const onCallPress = () => {
    if (!phone) {
      Alert.alert('Номер недоступен', 'Продавец пока не указал номер телефона для звонков.');
      return;
    }
    Alert.alert(name, phone, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Позвонить', onPress: () => Linking.openURL(`tel:${phone}`) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable hitSlop={10} style={styles.backBtn} accessibilityLabel="Назад" onPress={() => navigation.goBack()}>
          <BackIcon size={22} />
        </Pressable>
        <Avatar uri={avatar} name={name} size={38} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {rating != null && (
            <View style={styles.ratingRow}>
              <StarIcon size={11} />
              <Text style={styles.rating}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        {/* Номер продавца есть не всегда — без него кнопку не показываем. */}
        {!!phone && !closed && (
          <Pressable hitSlop={8} style={styles.backBtn} accessibilityLabel="Позвонить" onPress={onCallPress}>
            <PhoneCallIcon size={20} color={colors.text} />
          </Pressable>
        )}
      </View>

      {!!pinned && (
        <Pressable style={styles.pinned} onPress={openPinned} accessibilityLabel="Открыть товар">
          <View style={styles.pinnedImg}>
            {pinnedThumb ? <Image source={{ uri: pinnedThumb }} style={styles.pinnedPhoto} /> : <Ph size={30} />}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.pinnedTitle} numberOfLines={1}>{pinnedTitle}</Text>
            {!!pinnedPrice && <Text style={styles.pinnedPrice}>{pinnedPrice}</Text>}
          </View>
          <ChevronRight size={18} />
        </Pressable>
      )}

      {isSellerSide && !!convProductId && !closed && (
        saleConfirmed ? (
          <View style={styles.saleDoneBar}>
            <Text style={styles.saleDone}>✓ Продажа подтверждена. Покупатель может оставить отзыв</Text>
          </View>
        ) : (
          <View style={styles.saleBar}>
            <Text style={styles.saleText} numberOfLines={3}>
              Товар продан этому покупателю? Подтвердите продажу — тогда он сможет оставить отзыв
            </Text>
            <Pressable
              style={[styles.saleBtn, confirming && { opacity: 0.6 }]}
              disabled={confirming}
              onPress={() => setConfirmVisible(true)}
            >
              <Text style={styles.saleBtnText}>{confirming ? '…' : 'Подтвердить продажу'}</Text>
            </Pressable>
          </View>
        )
      )}

      {/* KeyboardAware поднимает контент над клавиатурой на обеих платформах
          (на Android — через слушатели клавиатуры, т.к. включён edge-to-edge) */}
      <KeyboardAware dismissOnTap={false}>
        <ScrollView
          ref={feedRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.feed}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => feedRef.current?.scrollToEnd({ animated: false })}
        >
          {fromBuy && (
            <View style={styles.system}>
              <Text style={styles.systemText}>
                <Text style={styles.systemBrand}>ARVELL  </Text>
                Вы нажали «Купить». Напишите продавцу, чтобы договориться о деталях.
                Оплата — при встрече с продавцом.
              </Text>
            </View>
          )}

          {loading && <Text style={styles.hint}>Загружаем переписку...</Text>}
          {!!loadError && <Text style={styles.hint}>{loadError}</Text>}

          {messages.map((m) => {
            const mine = !!user?.id && m.sender_id === user.id;
            const imageUri = isImageBody(m.body) ? resolveMediaUrl(m.body) : null;
            return (
              <View key={m.id} style={[styles.msg, mine ? styles.msgMine : styles.msgTheirs]}>
                {imageUri ? (
                  <Pressable accessibilityLabel="Открыть фото" onPress={() => setViewerImage(imageUri)} style={styles.imageMsg}>
                    <Image source={{ uri: imageUri }} style={styles.bubbleImage} />
                  </Pressable>
                ) : (
                  <View style={[styles.bubble, mine ? styles.bubbleOut : styles.bubbleIn]}>
                    <Text style={[styles.bubbleText, mine && { color: colors.accentText }]}>
                      {m.body}
                    </Text>
                  </View>
                )}
                <Text style={[styles.time, mine && { textAlign: 'right' }]}>{formatTime(m.created_at)}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Поле ввода */}
        <SafeAreaView edges={['bottom']} style={styles.inputBarSafe}>
          {closed ? (
            <Text style={styles.closedNote}>Переписка закрыта — отправлять сообщения больше нельзя</Text>
          ) : (
            <>
            {pendingImage && (
              <View style={styles.previewRow}>
                <Image source={{ uri: pendingImage }} style={styles.previewImage} />
                <Pressable hitSlop={8} style={styles.previewRemove} accessibilityLabel="Убрать фото" onPress={() => setPendingImage(null)}>
                  <CloseIcon size={13} color={colors.accentText} />
                </Pressable>
              </View>
            )}
            <View style={styles.inputBar}>
              <Pressable hitSlop={8} style={({ pressed }) => [styles.attachBtn, pressed && styles.btnPressed]} accessibilityLabel="Прикрепить фото" onPress={() => setAttachOpen(true)}>
                <ClipIcon size={22} color={colors.textMuted} />
              </Pressable>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder={pendingImage ? 'Подпись к фото...' : 'Сообщение...'}
                  placeholderTextColor={colors.textFaint}
                  selectionColor={colors.accent}
                  value={text}
                  onChangeText={setText}
                  multiline
                />
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.sendBtn,
                  !text.trim() && !pendingImage && styles.sendBtnDisabled,
                  pressed && styles.btnPressed,
                ]}
                accessibilityLabel="Отправить"
                onPress={send}
                disabled={(!text.trim() && !pendingImage) || !conversationId || sending}
              >
                <SendIcon size={19} color={(text.trim() || pendingImage) ? colors.accentText : '#555'} />
              </Pressable>
            </View>
            </>
          )}
        </SafeAreaView>
      </KeyboardAware>

      <BottomSheet visible={attachOpen} onClose={() => setAttachOpen(false)}>
        <Pressable style={styles.sheetRow} onPress={() => pickImage('library')}>
          <ImageIcon size={20} color={colors.accent} />
          <Text style={styles.sheetText}>Фото</Text>
        </Pressable>
        <Pressable style={[styles.sheetRow, { borderBottomWidth: 0 }]} onPress={() => pickImage('camera')}>
          <CameraIcon size={20} color={colors.accent} />
          <Text style={styles.sheetText}>Камера</Text>
        </Pressable>
      </BottomSheet>

      <ConfirmDialog
        visible={confirmVisible}
        title="Подтвердить продажу?"
        message={`${buyerName} купил(а) у вас${convProductTitle ? ` «${convProductTitle}»` : ' этот товар'}. После подтверждения покупатель сможет оставить отзыв. Отменить подтверждение нельзя.`}
        confirmText="Подтвердить"
        cancelText="Отмена"
        confirmTone="accent"
        onCancel={() => setConfirmVisible(false)}
        onConfirm={doConfirmSale}
      />

      {/* Просмотр отправленной фотографии на весь экран, с приближением */}
      <PhotoViewer uri={viewerImage} onClose={() => setViewerImage(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingLeft: 8, paddingRight: 12, paddingTop: 2, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: 15.5, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rating: { color: colors.textMuted, fontSize: 12 },

  pinned: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  pinnedImg: { width: 48, height: 48, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  pinnedPhoto: { width: '100%', height: '100%' },
  pinnedTitle: { color: colors.text, fontSize: 13.5, fontWeight: '600' },
  pinnedPrice: { color: colors.accent, fontSize: 13.5, fontWeight: '800', marginTop: 2 },

  saleBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  saleText: { flex: 1, color: colors.textSub, fontSize: 12.5, lineHeight: 17 },
  saleBtn: { height: 36, paddingHorizontal: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  saleBtnText: { ...type.monoMedium, color: colors.accentText, fontSize: 10.5 },
  saleDoneBar: { paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  saleDone: { color: colors.success, fontSize: 13, fontWeight: '600' },

  feed: { paddingHorizontal: spacing.md, paddingTop: 14, paddingBottom: 8, gap: 10 },
  system: {
    alignSelf: 'center', maxWidth: '90%',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  systemBrand: { ...type.monoMedium, color: colors.accent, fontSize: 10.5 },
  systemText: { color: colors.textSub, fontSize: 12.5, lineHeight: 18, textAlign: 'center' },

  msg: { maxWidth: '78%' },
  msgMine: { alignSelf: 'flex-end' },
  msgTheirs: { alignSelf: 'flex-start' },
  bubble: { paddingHorizontal: 13, paddingVertical: 10 },
  bubbleIn: { backgroundColor: colors.surface },
  bubbleOut: { backgroundColor: colors.accent },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  imageMsg: { borderWidth: 1, borderColor: colors.border },
  bubbleImage: { width: 220, height: 220 },
  time: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  hint: { color: colors.textMuted, fontSize: font.sizeSM, textAlign: 'center', paddingVertical: spacing.md },

  inputBarSafe: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  closedNote: { color: colors.textMuted, fontSize: 13.5, textAlign: 'center', paddingHorizontal: 20, paddingVertical: spacing.md },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8,
  },
  previewRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 12, paddingTop: 8 },
  previewImage: { width: 76, height: 76 },
  previewRemove: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: -12, marginTop: -6,
  },
  attachBtn: { width: 40, height: 42, alignItems: 'center', justifyContent: 'center' },
  inputWrap: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    minHeight: 42, maxHeight: 110,
    justifyContent: 'center',
  },
  input: { color: colors.text, fontSize: 15, paddingHorizontal: 12, paddingVertical: 10 },
  sendBtn: { width: 42, height: 42, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.surface },
  btnPressed: { opacity: 0.7 },

  sheetRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 4, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sheetText: { color: colors.text, fontSize: 15.5 },
});
