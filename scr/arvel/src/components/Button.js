// Кнопка Editorial: высота 48, прямые углы, текст моно капсом.
// variant: 'primary' — жёлтая с чёрным текстом; 'ghost' — прозрачная с
// белой рамкой; 'outline' — прозрачная с жёлтой рамкой; 'danger' —
// прозрачная с красной рамкой.
import React from 'react';
import { Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from './AppText';
import { colors, type } from '../theme';

export default function Button({
  title, onPress, variant = 'primary', disabled = false, loading = false,
  style, accessibilityLabel, testID,
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const off = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: off, busy: loading }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base, v.box,
        off && (variant === 'primary' ? styles.primaryOff : styles.off),
        pressed && !off && styles.pressed,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={v.text.color} />
        : <Text style={[styles.text, v.text]} numberOfLines={1}>{title}</Text>}
    </Pressable>
  );
}

const VARIANTS = {
  primary: { box: { backgroundColor: colors.accent }, text: { color: colors.accentText } },
  ghost: { box: { borderWidth: 1, borderColor: colors.text }, text: { color: colors.text } },
  outline: { box: { borderWidth: 1, borderColor: colors.accent }, text: { color: colors.accent } },
  danger: { box: { borderWidth: 1, borderColor: colors.danger }, text: { color: colors.danger } },
};

const styles = StyleSheet.create({
  base: { height: 48, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  text: { ...type.monoMedium, fontSize: 13, letterSpacing: 0.8 },
  primaryOff: { backgroundColor: colors.accentDim },
  off: { opacity: 0.4 },
  pressed: { opacity: 0.8 },
});
