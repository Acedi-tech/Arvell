import React, { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert, Image } from 'react-native';
import { Text, TextInput } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, font } from '../theme';
import { UserIcon, CameraIcon } from '../components/Icons';
import AuthHeader from '../components/AuthHeader';
import KeyboardAware from '../components/KeyboardAware';
import PhotoSourceSheet from '../components/PhotoSourceSheet';
import ShieldIcon from '../components/ShieldIcon';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useAppConfig } from '../context/AppConfigContext';
import { uploadImage } from '../api/media';
import { toUploadAsset, prepareForUpload } from '../utils/imageUpload';
import { otpErrorMessage } from '../utils/otpError';

// Сумка для роли «Я покупатель» — как на макете
function BagIcon({ size = 22, color = colors.accentText }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 8h14l-1 12H6L5 8z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M9 10V6a3 3 0 016 0v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function RoleRow({ active, onPress, icon, title, subtitle }) {
  return (
    <Pressable style={[styles.role, active && styles.roleActive]} onPress={onPress}>
      <View style={[styles.roleIcon, active && styles.roleIconActive]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={styles.roleSub}>{subtitle}</Text>
      </View>
      <View style={[styles.radio, active && styles.radioActive]}>
        {active && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

export default function ProfileSetupScreen({ navigation }) {
  const {
    pendingPhone,
    completeOnboarding, sellerAcceptInvite, sellerComplete,
  } = useAuth();
  const { maxImageWidth, maxImageHeight, maxImageBytes } = useAppConfig();

  // Не подставляем pendingUser.display_name сюда: бэкенд возвращает туда
  // номер телефона по умолчанию, если имя не было передано при регистрации
  // (в этом флоу его собираем только здесь) — поле должно быть пустым.
  const [name, setName] = useState('');
  const [role, setRole] = useState('buyer');
  const [invite, setInvite] = useState('');
  const [shopName, setShopName] = useState('');
  // Выбранный аватар { uri, contentType, filename }. На сервер он уходит при
  // отправке формы (uploadAvatar ниже), а не в момент выбора.
  const [avatar, setAvatar] = useState(null);
  // Уже загруженный файл, чтобы повторная попытка (неверный код продавца и т.п.)
  // не заливала то же фото заново.
  const uploadedAvatarRef = useRef(null);
  const [sheetVisible, setSheetVisible] = useState(false); // шторка выбора фото

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  // Аккаунт уже вошёл (isLoggedIn/pendingUser обновились), но AuthModal
  // закрывает себя реактивным эффектом на следующем кадре, а не мгновенно.
  // Если в этом окне тапнуть «Назад», экран успевает откатиться на Verify
  // (код уже неактуален) прежде, чем модалка закроется сама. Блокируем
  // «Назад» сразу по успеху, а не только на время самого запроса.
  const finishedRef = useRef(false);
  // Продавец: после accept-invite бэкенд шлёт отдельный SMS-код именно для
  // подтверждения продавца — показываем компактный шаг ввода кода прямо
  // на этом же экране, не уходя на отдельный роут.
  const [sellerOtpStep, setSellerOtpStep] = useState(false);
  const [sellerCode, setSellerCode] = useState('');

  const scrollRef = useRef(null);

  const isSeller = role === 'seller';

  // Размер и формат не проверяем: перед загрузкой фото само ужимается под
  // лимиты хранилища (prepareForUpload).
  const chooseAvatar = (asset) => setAvatar(toUploadAsset(asset));

  // Возвращает публичный URL загруженного аватара или null. Сбой загрузки не
  // блокирует регистрацию: человек предупреждён и может добавить фото позже.
  const uploadAvatar = async () => {
    if (!avatar) return null;
    if (uploadedAvatarRef.current?.uri === avatar.uri) return uploadedAvatarRef.current.url;
    try {
      const url = await uploadImage(await prepareForUpload(avatar, {
        maxWidth: maxImageWidth, maxHeight: maxImageHeight, maxBytes: maxImageBytes,
      }));
      uploadedAvatarRef.current = { uri: avatar.uri, url };
      return url;
    } catch (e) {
      Alert.alert(
        'Фото не загрузилось',
        `${e?.message || 'Ошибка загрузки.'}\nРегистрация продолжится без фото — добавить его можно позже в профиле.`
      );
      return null;
    }
  };

  // --- Аватар ---

  const onAvatarPress = () => setSheetVisible(true);

  // --- Код приглашения ---
  // Токен непрозрачный и выдаётся бэкендом (см. admin.createSellerInvite) —
  // на клиенте только убираем случайные пробелы по краям при вставке,
  // без ограничения длины и формата. Действителен ли код на самом деле —
  // знает только бэкенд, узнаём это по ответу accept-invite.

  const inviteFilled = invite.trim().length > 0;

  const canSubmitForm =
    name.trim().length > 0 && (!isSeller || (inviteFilled && shopName.trim().length > 0));
  const canConfirmSellerCode = sellerCode.length === 4;

  const submitBuyer = async () => {
    setFormError(null);
    setSubmitting(true);
    try {
      const profilePicUrl = await uploadAvatar();
      await completeOnboarding({
        display_name: name.trim(),
        ...(profilePicUrl ? { profile_pic_url: profilePicUrl } : {}),
      });
      // isLoggedIn переключится в контексте — RootNavigator сам уйдёт на MainTabs.
      finishedRef.current = true;
    } catch (e) {
      setFormError(e.message || 'Не удалось сохранить профиль. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitSellerInvite = async () => {
    setFormError(null);
    setSubmitting(true);
    try {
      await sellerAcceptInvite(invite, pendingPhone);
      setSellerOtpStep(true);
    } catch (e) {
      setFormError(e.message || 'Не удалось проверить код приглашения. Уточните его у команды ARVELL.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmSellerCode = async () => {
    setFormError(null);
    setSubmitting(true);
    try {
      // Токены после /auth/verify уже рабочие, так что presign доступен ещё
      // до sellerComplete; фото магазина/профиля бэкенд ждёт только после него.
      const profilePicUrl = await uploadAvatar();
      await sellerComplete({
        inviteToken: invite,
        code: sellerCode,
        shopName: shopName.trim(),
        displayName: name.trim(),
        profilePicUrl,
      });
      finishedRef.current = true;
    } catch (e) {
      setFormError(otpErrorMessage(e));
      setSellerCode('');
    } finally {
      setSubmitting(false);
    }
  };

  const onFinishPress = () => {
    if (isSeller) {
      if (sellerOtpStep) confirmSellerCode();
      else submitSellerInvite();
    } else {
      submitBuyer();
    }
  };

  const canFinish = isSeller
    ? (sellerOtpStep ? canConfirmSellerCode : canSubmitForm)
    : canSubmitForm;

  const finishTitle = isSeller
    ? (sellerOtpStep ? 'Подтвердить код' : 'Получить код из SMS')
    : 'Завершить';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAware dismissOnTap={false}>
      {/* Шапка: назад слева, заголовок белым по центру — как на макете */}
      <AuthHeader title="Регистрация" onBack={() => { if (!finishedRef.current) navigation.goBack(); }} />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Шаг кода продавца — отдельный экран по смыслу: под заголовком
            «Расскажите о себе» и с аватаром он выглядел как повторная анкета,
            будто данные нужно вводить второй раз (QA 19.10). */}
        {sellerOtpStep ? (
          <>
            <Text style={styles.title}>Подтвердите номер</Text>
            <Text style={styles.sub}>Последний шаг регистрации продавца</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Расскажите о себе</Text>
            <Text style={styles.sub}>Как вас будут видеть другие пользователи</Text>

            {/* Аватар по центру с жёлтым бейджем камеры */}
            <Pressable style={styles.avatarWrap} accessibilityLabel="Выбрать фото профиля" onPress={onAvatarPress}>
              {avatar ? (
                <Image source={{ uri: avatar.uri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <UserIcon size={44} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.camBtn}>
                <CameraIcon size={14} />
              </View>
            </Pressable>
          </>
        )}

        {sellerOtpStep ? (
          <>
            <Text style={[styles.label, { marginTop: spacing.xl }]}>Код из SMS</Text>
            <Text style={styles.note}>
              Отправили код на {pendingPhone}, чтобы подтвердить регистрацию продавца.
            </Text>
            <TextInput
              style={[styles.input, styles.codeInput, sellerCode.length > 0 && styles.inputFilled]}
              placeholder="0000"
              placeholderTextColor={colors.textFaint}
              keyboardType="number-pad"
              value={sellerCode}
              onChangeText={(t) => setSellerCode(t.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
            />
            {formError && <Text style={styles.error}>{formError}</Text>}
            <Pressable onPress={() => { setSellerOtpStep(false); setSellerCode(''); setFormError(null); }}>
              <Text style={styles.backLink}>Изменить код приглашения</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.label}>Имя</Text>
            <TextInput
              style={[styles.input, !!name && styles.inputFilled]}
              placeholder="Введите имя"
              placeholderTextColor={colors.textFaint}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { marginTop: spacing.lg }]}>Кто вы на ARVELL?</Text>

            <RoleRow
              active={role === 'buyer'}
              onPress={() => setRole('buyer')}
              icon={<BagIcon size={22} color={role === 'buyer' ? colors.accentText : colors.textMuted} />}
              title="Я покупатель"
              subtitle="Просматриваю и покупаю товары"
            />
            <RoleRow
              active={role === 'seller'}
              onPress={() => setRole('seller')}
              icon={<ShieldIcon size={22} color={role === 'seller' ? colors.accentText : colors.textMuted} filled={role === 'seller'} />}
              title="Я продавец"
              subtitle="Только по приглашению ARVELL"
            />

            {isSeller && (
              <>
                <Text style={[styles.label, { marginTop: spacing.lg }]}>Код приглашения</Text>
                <TextInput
                  style={[styles.input, styles.inviteInput, !!invite && styles.inputFilled]}
                  placeholder="Код из приглашения ARVELL"
                  placeholderTextColor={colors.textFaint}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={invite}
                  onChangeText={(t) => setInvite(t.trim())}
                  onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
                />
                <Text style={styles.note}>
                  Продавцы регистрируются только по приглашению. Код
                  приглашения выдаёт команда ARVELL.
                </Text>

                <Text style={[styles.label, { marginTop: spacing.lg }]}>Название магазина</Text>
                <TextInput
                  style={[styles.input, !!shopName && styles.inputFilled]}
                  placeholder="Например, Archive Room"
                  placeholderTextColor={colors.textFaint}
                  value={shopName}
                  onChangeText={setShopName}
                  onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
                />
              </>
            )}

            {formError && <Text style={styles.error}>{formError}</Text>}
          </>
        )}
      </ScrollView>

      {/* Футер внутри KeyboardAware: на Android поднимается вместе с клавиатурой */}
      <View style={styles.footer}>
        <PrimaryButton
          title={submitting ? 'Подождите...' : finishTitle}
          disabled={!canFinish || submitting}
          onPress={onFinishPress}
        />
      </View>
      </KeyboardAware>

      <PhotoSourceSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onPick={chooseAvatar}
        onRemove={avatar ? () => setAvatar(null) : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.sm },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 15, marginTop: 10, lineHeight: 22 },

  avatarWrap: { alignSelf: 'center', marginTop: spacing.lg, marginBottom: spacing.lg },
  avatar: {
    width: 88, height: 88,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: { width: 88, height: 88 },
  camBtn: {
    position: 'absolute', right: -2, bottom: -2,
    width: 30, height: 30,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.bg,
  },

  label: { color: colors.textSub, fontSize: 13, fontWeight: '600', marginBottom: spacing.sm, marginHorizontal: 2 },
  input: {
    minHeight: 50,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    color: colors.text, fontSize: 15,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    marginBottom: 18,
  },
  inputFilled: { borderColor: colors.accent },
  inviteInput: { letterSpacing: 2, fontWeight: '600', marginBottom: spacing.sm },
  codeInput: { marginTop: spacing.sm, letterSpacing: 6, textAlign: 'center', fontSize: 22, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 13, marginTop: spacing.sm, lineHeight: 19 },
  note: { color: colors.textMuted, fontSize: 12.5, marginTop: 0, marginBottom: spacing.md, lineHeight: 19, paddingHorizontal: 4 },
  backLink: {
    color: colors.accent, fontSize: font.sizeSM, fontWeight: '600',
    marginTop: 18, textAlign: 'center',
  },

  role: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: 15, paddingVertical: 13, marginBottom: 10,
  },
  roleActive: { borderColor: colors.accent },
  roleIcon: {
    width: 42, height: 42,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  roleIconActive: { backgroundColor: colors.accent },
  roleTitle: { color: colors.text, fontSize: 15.5, fontWeight: '700' },
  roleSub: { color: colors.textMuted, fontSize: 12.5, marginTop: 2 },
  radio: {
    width: 24, height: 24,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.accent },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent },

  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm },
});
