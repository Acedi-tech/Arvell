// Круглый аватар: фото или первая буква имени. ring — жёлтая обводка
// (профиль продавца).
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Text } from './AppText';
import { colors, fonts } from '../theme';

export default function Avatar({ uri, name, size = 44, ring = false }) {
  const letter = (name || '').trim()[0]?.toUpperCase() || '?';
  const inner = ring ? size - 6 : size;
  return (
    <View style={[styles.outer, { width: size, height: size, borderRadius: size / 2 }, ring && styles.ring]}>
      <View style={[styles.inner, { width: inner, height: inner, borderRadius: inner / 2 }]}>
        {uri
          ? <Image source={{ uri }} style={{ width: inner, height: inner }} accessibilityIgnoresInvertColors />
          : <Text style={[styles.letter, { fontSize: Math.round(inner * 0.4) }]}>{letter}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignItems: 'center', justifyContent: 'center' },
  ring: { borderWidth: 2, borderColor: colors.accent },
  inner: { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  letter: { fontFamily: fonts.display, color: colors.text },
});
