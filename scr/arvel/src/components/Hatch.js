// Тёмная заглушка с тонкой диагональной штриховкой — фон баннеров
// и мест, где фото ещё нет (как в прототипе Editorial).
import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Line, Rect } from 'react-native-svg';

export default function Hatch({ color = 'rgba(255,255,255,0.035)', step = 12, style }) {
  return (
    <Svg style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Defs>
        <Pattern id="hatch" patternUnits="userSpaceOnUse" width={step} height={step} patternTransform="rotate(45)">
          <Line x1="0" y1="0" x2="0" y2={step} stroke={color} strokeWidth={1} />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#hatch)" />
    </Svg>
  );
}
