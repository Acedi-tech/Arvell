// Шапка шагов входа: назад слева, серый заголовок по центру, крестик
// справа. Крестик закрывает весь вход и возвращает туда, откуда его открыли.
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from './AppText';
import { BackIcon, CloseIcon } from './Icons';
import { colors, spacing, font } from '../theme';

export function closeAuth(navigation) {
  // Вход открыт модалкой поверх приложения (экран Auth корневого стека).
  const root = navigation.getParent?.();
  if (root?.canGoBack?.()) root.goBack();
}

export default function AuthHeader({ title, onBack, onClose }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.side}>
        {onBack && (
          <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Назад" onPress={onBack} style={styles.btn}>
            <BackIcon size={22} />
          </Pressable>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={[styles.side, styles.right]}>
        {onClose && (
          <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Закрыть" onPress={onClose} style={styles.btn}>
            <CloseIcon size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm },
  side: { width: 48 },
  right: { alignItems: 'flex-end' },
  btn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', color: colors.textSub, fontSize: font.sizeMD, fontWeight: '600' },
});
