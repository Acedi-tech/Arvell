// Экран редактирования профиля.
import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Alert } from 'react-native';
import { Text, TextInput } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, type } from '../theme';
import { useAuth, isPlaceholderName } from '../context/AuthContext';
import { useAppConfig } from '../context/AppConfigContext';
import { uploadImage } from '../api/media';
import { updateMyShop, getMyShop } from '../api/shops';
import { toUploadAsset, prepareForUpload } from '../utils/imageUpload';
import { resolveMediaUrl } from '../utils/media';
import PhotoSourceSheet from '../components/PhotoSourceSheet';
import ConfirmDialog from '../components/ConfirmDialog';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import Button from '../components/Button';

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const { maxImageWidth, maxImageHeight, maxImageBytes } = useAppConfig();
  // Номер телефона, который бэкенд подставляет вместо незаполненного имени,
  // никнеймом не считаем — поле тогда пустое.
  const initialNickname = isPlaceholderName(user) ? '' : (user?.name || '');
  const [nickname, setNickname] = useState(initialNickname);
  const [saving, setSaving] = useState(false);
  // Новый аватар, выбранный на этом экране, { uri, contentType, filename }.
  // Пока не нажали «Сохранить», на сервер ничего не уходит.
  const [newAvatar, setNewAvatar] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  // Уход с экрана, отложенный до ответа в диалоге «Сохранить изменения?».
  const [pendingLeave, setPendingLeave] = useState(null);

  const avatarUri = newAvatar?.uri || resolveMediaUrl(user?.profile_pic_url);
  const isSeller = user?.role === 'seller';

  // Продавцу — ещё название магазина и «О магазине» (PATCH /me/shop).
  const [shopInit, setShopInit] = useState({ name: '', about: '' });
  const [shopName, setShopName] = useState('');
  const [about, setAbout] = useState('');
  useEffect(() => {
    if (!isSeller) return undefined;
    let alive = true;
    Promise.resolve(getMyShop?.()).then((shop) => {
      if (!alive || !shop) return;
      const init = { name: shop.shop_name || '', about: shop.description || '' };
      setShopInit(init);
      setShopName(init.name);
      setAbout(init.about);
    }).catch(() => {});
    return () => { alive = false; };
  }, [isSeller]);
  const shopDirty = isSeller && (shopName.trim() !== shopInit.name.trim() || about.trim() !== shopInit.about.trim());

  const canSave = nickname.trim().length > 0 && (!isSeller || !shopDirty || shopName.trim().length > 0);
  const dirty = nickname.trim() !== initialNickname.trim() || !!newAvatar || shopDirty;

  // Выход «Назад» (кнопка, жест, системная кнопка Android) с несохранёнными
  // правками — сначала спрашиваем, сохранить ли их.
  const leaveGuard = useRef({ dirty, saving });
  leaveGuard.current = { dirty, saving };
  useEffect(() => navigation.addListener('beforeRemove', (e) => {
    const { dirty: isDirty, saving: isSaving } = leaveGuard.current;
    if (!isDirty || isSaving) return;
    e.preventDefault();
    setPendingLeave(e.data.action);
  }), [navigation]);

  const save = async () => {
    setSaving(true);
    leaveGuard.current.saving = true;
    try {
      const patch = { display_name: nickname.trim() };
      let profilePicUrl = null;
      if (newAvatar) {
        // Фото с камеры намного больше лимитов хранилища (GET /config) —
        // без ужатия оно отвечало 422.
        const prepared = await prepareForUpload(newAvatar, {
          maxWidth: maxImageWidth, maxHeight: maxImageHeight, maxBytes: maxImageBytes,
        });
        profilePicUrl = await uploadImage(prepared);
        patch.profile_pic_url = profilePicUrl;
      }
      await updateProfile(patch);
      // Продавцу это же фото показываем как логотип магазина (seller.profile_pic_url
      // на карточке товара берётся из магазина, а не из профиля).
      const shopPatch = {};
      if (profilePicUrl && isSeller) shopPatch.profile_pic_url = profilePicUrl;
      if (shopDirty) {
        shopPatch.shop_name = shopName.trim();
        shopPatch.description = about.trim();
      }
      if (Object.keys(shopPatch).length) await updateMyShop(shopPatch);
      return true;
    } catch (e) {
      Alert.alert('Не удалось сохранить', e.message || 'Попробуйте ещё раз.');
      return false;
    } finally {
      setSaving(false);
      leaveGuard.current.saving = false;
    }
  };

  // После успешного сохранения правок больше нет — уходим без вопроса.
  const leave = (action) => {
    leaveGuard.current.dirty = false;
    if (action) navigation.dispatch(action);
    else navigation.goBack();
  };

  const onSave = async () => {
    if (await save()) leave();
  };

  const onLeaveSave = async () => {
    const action = pendingLeave;
    setPendingLeave(null);
    if (!canSave) {
      Alert.alert('Укажите никнейм', 'Без никнейма профиль сохранить нельзя.');
      return;
    }
    if (await save()) leave(action);
  };

  const onLeaveDiscard = () => {
    const action = pendingLeave;
    setPendingLeave(null);
    leave(action);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Header title="Редактирование" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarBlock}>
            <Pressable accessibilityLabel="Изменить фото профиля" onPress={() => setSheetVisible(true)}>
              <Avatar uri={avatarUri} name={nickname || user?.name || '?'} size={88} />
            </Pressable>
            <Pressable hitSlop={8} onPress={() => setSheetVisible(true)}>
              <Text style={styles.changePhoto}>Изменить фото</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Имя</Text>
          <TextInput
            style={[styles.input, nickname.trim() !== initialNickname.trim() && styles.inputActive]}
            value={nickname}
            onChangeText={setNickname}
            placeholder="Придумайте никнейм"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={colors.textFaint}
            selectionColor={colors.accent}
          />

          <Text style={styles.label}>Телефон</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.phoneText}>{user?.phone || '—'}</Text>
            <Text style={styles.verified}>✓ Подтверждён</Text>
          </View>
          <Text style={styles.notice}>
            Номер телефона подтверждён и не может быть изменён здесь. Чтобы сменить номер — обратитесь в поддержку.
          </Text>

          {isSeller && (
            <>
              <Text style={styles.label}>Название магазина</Text>
              <TextInput
                style={[styles.input, shopName.trim() !== shopInit.name.trim() && styles.inputActive]}
                value={shopName}
                onChangeText={setShopName}
                placeholder="Например, Archive Room"
                placeholderTextColor={colors.textFaint}
                selectionColor={colors.accent}
              />
              <Text style={styles.label}>О магазине</Text>
              <TextInput
                style={[styles.input, styles.multiline, about.trim() !== shopInit.about.trim() && styles.inputActive]}
                value={about}
                onChangeText={setAbout}
                placeholder="Расскажите, что вы продаёте и где удобно встретиться"
                placeholderTextColor={colors.textFaint}
                selectionColor={colors.accent}
                multiline
                textAlignVertical="top"
                maxLength={1000}
              />
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={saving ? 'Сохранение...' : 'Сохранить'}
            onPress={onSave}
            disabled={saving || !canSave || !dirty}
          />
        </View>
      </KeyboardAvoidingView>

      <PhotoSourceSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onPick={(asset) => setNewAvatar(toUploadAsset(asset))}
        onRemove={newAvatar ? () => setNewAvatar(null) : undefined}
      />

      <ConfirmDialog
        visible={!!pendingLeave}
        title="Сохранить изменения?"
        message="Вы изменили профиль, но не сохранили изменения."
        confirmText="Сохранить"
        cancelText="Не сохранять"
        confirmTone="accent"
        onConfirm={onLeaveSave}
        onCancel={onLeaveDiscard}
        onDismiss={() => setPendingLeave(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.md, paddingTop: 20, paddingBottom: 20 },
  avatarBlock: { alignItems: 'center', gap: 10, marginBottom: 6 },
  changePhoto: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  label: { ...type.mono, fontSize: 10.5, color: colors.textMuted, marginBottom: spacing.sm, marginTop: 18 },
  input: {
    minHeight: 48, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text,
  },
  multiline: { minHeight: 110, lineHeight: 21 },
  inputActive: { borderColor: colors.accent },
  phoneRow: {
    minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14,
  },
  phoneText: { color: colors.textMuted, fontSize: 15 },
  verified: { ...type.mono, fontSize: 10, color: colors.success },
  notice: { color: colors.textMuted, fontSize: 12.5, lineHeight: 18, marginTop: spacing.sm },
  footer: { paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: 18, borderTopWidth: 1, borderTopColor: colors.border },
});
