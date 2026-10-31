import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

export default function ChevronDown({ size = 18, color = colors.textMuted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m6 9 6 6 6-6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
