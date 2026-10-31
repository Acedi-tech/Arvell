// Шапка экрана: назад слева, заголовок по центру жёлтым широким шрифтом,
// правый слот, нижняя граница 1px.
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from './AppText';
import { BackIcon } from './Icons';
import { colors, spacing, type } from '../theme';

export default function Header({ title, subtitle, onBack, right, border = true }) {
  return (
    <View style={[styles.wrap, border && styles.border]}>
      <View style={styles.side}>
        {onBack && (
          <Pressable hitSlop={10} accessibilityRole="button" accessibilityLabel="Назад" onPress={onBack}>
            <BackIcon size={24} />
          </Pressable>
        )}
      </View>
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  border: { borderBottomWidth: 1, borderBottomColor: colors.border },
  side: { width: 56, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center' },
  title: { ...type.display, fontSize: 18, color: colors.accent },
  subtitle: { ...type.mono, fontSize: 10.5, color: colors.textMuted, marginTop: 2 },
});
