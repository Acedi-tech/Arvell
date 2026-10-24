import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { StarIcon } from './Icons';

// Ряд из пяти звёзд. Без onChange — только показывает оценку; с onChange —
// это поле ввода: тап по звезде ставит оценку от 1 до 5.
export default function StarRating({ value = 0, size = 16, gap = 2, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  if (!onChange) {
    return (
      <View style={[styles.row, { gap }]} accessibilityLabel={`Оценка ${value} из 5`}>
        {stars.map((n) => (
          <StarIcon key={n} size={size} color={n <= Math.round(value) ? colors.accent : colors.border} />
        ))}
      </View>
    );
  }
  return (
    <View style={[styles.row, { gap }]} accessibilityRole="adjustable">
      {stars.map((n) => (
        <Pressable
          key={n}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Оценка ${n} из 5`}
          accessibilityState={{ selected: n === value }}
          onPress={() => onChange(n)}
        >
          <StarIcon size={size} color={n <= value ? colors.accent : colors.border} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
