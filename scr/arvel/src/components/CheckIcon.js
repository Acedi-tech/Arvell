import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

// Простая галочка (чекбоксы, подтверждения).
export default function CheckIcon({ size = 16, color = colors.accentText, strokeWidth = 2.4 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m5 12.5 4.5 4.5L19 6.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
