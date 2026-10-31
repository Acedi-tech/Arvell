// Пустое состояние: иконка в круге, заголовок, пояснение и необязательная
// кнопка (например «Повторить» при ошибке сети).
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './AppText';
import Button from './Button';
import { colors, spacing, font } from '../theme';

export default function EmptyState({ icon, title, message, actionTitle, onAction, style }) {
  return (
    <View style={[styles.wrap, style]}>
      {!!icon && <View style={styles.iconCircle}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {!!actionTitle && <Button title={actionTitle} variant="ghost" onPress={onAction} style={styles.action} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xl },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  title: { color: colors.text, fontSize: font.sizeLG, fontWeight: '700', textAlign: 'center' },
  message: { color: colors.textMuted, fontSize: font.sizeSM, lineHeight: 20, textAlign: 'center', marginTop: spacing.sm },
  action: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
