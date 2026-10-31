// Text и TextInput с фирменными шрифтами. Свой шрифт на Android не умеет
// «становиться жирным» по fontWeight — нужен отдельный файл на каждую
// жирность. Поэтому подбираем файл по fontWeight здесь, а экраны пишут
// стили как обычно. Явно заданный fontFamily (display, mono) не трогаем.
import React, { forwardRef } from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet } from 'react-native';
import { fonts } from '../theme';

const BY_WEIGHT = {
  100: fonts.regular, 200: fonts.regular, 300: fonts.regular, 400: fonts.regular, normal: fonts.regular,
  500: fonts.semibold, 600: fonts.semibold,
  700: fonts.bold, bold: fonts.bold, 800: fonts.bold, 900: fonts.bold,
};

export function withFont(style) {
  const flat = StyleSheet.flatten(style) || {};
  if (flat.fontFamily) {
    // Файл уже несёт нужную жирность — системное утолщение поверх него
    // на Android даёт «дважды жирный» текст.
    if (flat.fontWeight == null) return flat;
    const { fontWeight, ...rest } = flat;
    return rest;
  }
  const { fontWeight, ...rest } = flat;
  return { ...rest, fontFamily: BY_WEIGHT[fontWeight ?? 400] || fonts.regular };
}

export const Text = forwardRef(function Text({ style, ...props }, ref) {
  return <RNText ref={ref} {...props} style={withFont(style)} />;
});

export const TextInput = forwardRef(function TextInput({ style, ...props }, ref) {
  return <RNTextInput ref={ref} {...props} style={withFont(style)} />;
});
