// Auth success: animated ring with the ARVELL monogram.
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Text } from './AppText';
import Logo from './Logo';
import { colors } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RING = 2 * Math.PI * 50;

export default function AuthSuccess({ isSeller }) {
  const ring = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.timing(ring, { toValue: 1, duration: 550, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      Animated.timing(text, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [ring, pop, text]);

  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Svg width={112} height={112} style={StyleSheet.absoluteFill}>
          <AnimatedCircle
            cx={56} cy={56} r={50} fill="none" stroke={colors.accent} strokeWidth={4}
            strokeDasharray={`${RING} ${RING}`}
            strokeDashoffset={ring.interpolate({ inputRange: [0, 1], outputRange: [RING, 0] })}
            transform="rotate(-90 56 56)"
          />
        </Svg>
        <Animated.View style={[styles.logo, { transform: [{ scale: pop }] }]}>
          <Logo size={76} />
        </Animated.View>
      </View>
      <Animated.View style={{ opacity: text, alignItems: 'center' }}>
        <Text style={styles.title}>Готово!</Text>
        <Text style={styles.sub}>{isSeller ? 'Добро пожаловать, продавец' : 'Вы вошли в ARVELL'}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 22 },
  badge: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 19, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 14, marginTop: 6 },
});
