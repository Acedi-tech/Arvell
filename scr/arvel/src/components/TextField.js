// Поле ввода: фон #1A1A1A, рамка #2A2A2A, в фокусе — жёлтая. Подпись сверху
// моно капсом, ошибка снизу красным, счётчик символов справа (если задан
// maxLength и counter). multiline — многострочный вариант (TextArea).
import React, { forwardRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput } from './AppText';
import { colors, spacing, font, type } from '../theme';

const TextField = forwardRef(function TextField({
  label, error, hint, counter = false, multiline = false, style, inputStyle,
  value = '', maxLength, onFocus, onBlur, ...props
}, ref) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={style}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        ref={ref}
        value={value}
        maxLength={maxLength}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        placeholderTextColor={colors.textFaint}
        selectionColor={colors.accent}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        style={[
          styles.input, multiline && styles.multiline,
          focused && styles.focused, !!error && styles.errored, inputStyle,
        ]}
        {...props}
      />
      {(!!error || !!hint || (counter && maxLength)) && (
        <View style={styles.footer}>
          <Text style={[styles.hint, !!error && styles.errorText]}>{error || hint || ''}</Text>
          {counter && !!maxLength && <Text style={styles.counter}>{String(value).length} / {maxLength}</Text>}
        </View>
      )}
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  label: { ...type.mono, fontSize: 11, color: colors.textMuted, marginBottom: spacing.sm },
  input: {
    minHeight: 48, paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    color: colors.text, fontSize: font.sizeMD,
  },
  multiline: { minHeight: 120, lineHeight: 22 },
  focused: { borderColor: colors.accent },
  errored: { borderColor: colors.danger },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, marginTop: 6 },
  hint: { flex: 1, color: colors.textMuted, fontSize: font.sizeXS },
  errorText: { color: colors.danger },
  counter: { ...type.mono, fontSize: 10.5, color: colors.textFaint },
});
