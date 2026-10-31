import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

// Скрепка — прикрепить фото в чате.
export default function ClipIcon({ size = 22, color = colors.textMuted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 11.5 12 18.5a4 4 0 0 1-6-5.3l7-7a2.7 2.7 0 0 1 4 3.7l-7 7a1.4 1.4 0 0 1-2-2l6.5-6.5"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}
