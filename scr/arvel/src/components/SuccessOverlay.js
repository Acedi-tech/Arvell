import React, { useEffect, useRef } from 'react';
import { Modal, View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Text } from './AppText';
import Button from './Button';
import { colors, spacing, font, type } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

const SIZE = 96;
const STROKE = 4;
const R = (SIZE - STROKE) / 2;
const RING = 2 * Math.PI * R;
// Длина галочки «4 13 → 9.5 18.5 → 20 6» в её собственных координатах
// (viewBox 24×24); масштаб задаётся transform, длина пунктира — в тех же единицах.
const CHECK = Math.hypot(5.5, 5.5) + Math.hypot(10.5, 12.5);

// Экран успеха: жёлтое кольцо прорисовывается по кругу, затем внутри
// рисуется галочка, потом проявляются текст и кнопка. Используется для
// публикации товара, отзыва и других успешных действий — меняются только
// title/message/buttonText.
export default function SuccessOverlay({ visible, title, message, buttonText = 'Отлично', onClose }) {
  const ring = useRef(new Animated.Value(0)).current;
  const check = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    ring.setValue(0); check.setValue(0); text.setValue(0);
    Animated.sequence([
      Animated.timing(ring, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(check, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(text, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [visible, ring, check, text]);

  if (!visible) return null;

  const ringOffset = ring.interpolate({ inputRange: [0, 1], outputRange: [RING, 0] });
  const checkOffset = check.interpolate({ inputRange: [0, 1], outputRange: [CHECK, 0] });
  const lift = text.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
  const scale = SIZE / 48; // галочка 24×24 занимает середину кольца (половину размера)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Svg width={SIZE} height={SIZE} style={styles.icon}>
          <AnimatedCircle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            stroke={colors.accent} strokeWidth={STROKE} fill="none"
            strokeDasharray={`${RING} ${RING}`} strokeDashoffset={ringOffset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
          <AnimatedPolyline
            points="4 13 9.5 18.5 20 6"
            transform={`translate(${SIZE / 4} ${SIZE / 4}) scale(${scale})`}
            stroke={colors.accent} strokeWidth={2.6} fill="none"
            strokeLinecap="square" strokeLinejoin="miter"
            strokeDasharray={`${CHECK} ${CHECK}`} strokeDashoffset={checkOffset}
          />
        </Svg>
        <Animated.View style={[styles.body, { opacity: text, transform: [{ translateY: lift }] }]}>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}
          <Button title={buttonText} onPress={onClose} style={styles.button} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,10,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  icon: { marginBottom: spacing.lg },
  body: { alignItems: 'center', width: '100%' },
  title: { ...type.display, color: colors.text, fontSize: 24, textAlign: 'center', marginBottom: 10 },
  message: {
    color: colors.textSub, fontSize: font.sizeSM, textAlign: 'center', lineHeight: 21,
    maxWidth: 290, marginBottom: spacing.xl,
  },
  button: { alignSelf: 'stretch', maxWidth: 320, width: '100%' },
});
