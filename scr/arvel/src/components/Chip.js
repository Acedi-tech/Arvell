// Чипс: высота 30, рамка #3A3A3A, текст моно капсом, справа ↗.
// Активный — жёлтая рамка и жёлтый текст.
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from './AppText';
import { colors, type } from '../theme';

export default function Chip({ label, active = false, onPress, arrow = true, style }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.active, pressed && styles.pressed, style]}
    >
      <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>
        {label}{arrow ? ' ↗' : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 30, paddingHorizontal: 12, justifyContent: 'center',
    borderWidth: 1, borderColor: colors.chipBorder,
  },
  active: { borderColor: colors.accent },
  pressed: { opacity: 0.7 },
  text: { ...type.mono, fontSize: 11.5, color: colors.text },
  textActive: { color: colors.accent },
});
