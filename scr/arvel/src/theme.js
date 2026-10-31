// Единый источник цветов, шрифтов и отступов для всего приложения.
// Стиль Editorial: чёрный с жёлтым, прямые углы, широкий гротеск для
// заголовков и цен, моноширинный капс для подписей и кнопок.
export const colors = {
  bg: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceAlt: '#222222',
  surfaceCard: '#1A1A1A',
  border: '#2A2A2A',
  chipBorder: '#3A3A3A',
  text: '#FFFFFF',
  textMuted: '#888888',
  textSub: '#AAAAAA',
  textFaint: '#5A5A5A',
  accent: '#FFD700',
  accentDim: '#6B5C00',     // приглушённый жёлтый (неактивная кнопка)
  accentText: '#000000',
  danger: '#FF453A',
  success: '#34C759',
  chipInactive: '#1A1A1A',
  overlayButton: 'rgba(0,0,0,0.55)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Все углы прямые. Круглыми остаются только аватары, точки-индикаторы и
// иконки-кнопки поверх фото — для них radius.round.
export const radius = {
  sm: 0,
  md: 0,
  lg: 0,
  xl: 0,
  pill: 0,
  round: 999,
};

// Файлы шрифтов лежат в assets/fonts и грузятся в App.js (useFonts).
// ArvellDisplay/ArvellText — статичные срезы Roboto Flex (в Archivo,
// который был в макете, нет кириллицы): Display — ширина 125, вес 800.
export const fonts = {
  display: 'ArvellDisplay-ExtraBold',
  regular: 'ArvellText-Regular',
  semibold: 'ArvellText-SemiBold',
  bold: 'ArvellText-Bold',
  mono: 'IBMPlexMono-Regular',
  monoMedium: 'IBMPlexMono-Medium',
};

export const fontFiles = {
  [fonts.display]: require('../assets/fonts/ArvellDisplay-ExtraBold.ttf'),
  [fonts.regular]: require('../assets/fonts/ArvellText-Regular.ttf'),
  [fonts.semibold]: require('../assets/fonts/ArvellText-SemiBold.ttf'),
  [fonts.bold]: require('../assets/fonts/ArvellText-Bold.ttf'),
  [fonts.mono]: require('../assets/fonts/IBMPlexMono-Regular.ttf'),
  [fonts.monoMedium]: require('../assets/fonts/IBMPlexMono-Medium.ttf'),
};

export const font = {
  sizeXS: 12,
  sizeSM: 14,
  sizeMD: 16,
  sizeLG: 20,
  sizeXL: 28,
  sizeXXL: 34,
};

// Готовые наборы для типовых ролей текста.
export const type = {
  // Логотип, заголовки экранов, крупные цены.
  display: { fontFamily: fonts.display, letterSpacing: -0.4 },
  // Подписи, чипсы, кнопки, плашки: моно капсом.
  mono: { fontFamily: fonts.mono, textTransform: 'uppercase', letterSpacing: 0.6 },
  monoMedium: { fontFamily: fonts.monoMedium, textTransform: 'uppercase', letterSpacing: 0.6 },
};
