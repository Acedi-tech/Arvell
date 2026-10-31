// Первый шаг входа. Заголовок зависит от того, зачем человек входит
// (route.params.reason): «Войдите, чтобы связаться с продавцом» и т.п.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/AppText';
import { colors, spacing } from '../theme';
import Logo from '../components/Logo';
import Button from '../components/Button';
import AuthHeader, { closeAuth } from '../components/AuthHeader';

export default function WelcomeScreen({ navigation, route }) {
  const reason = route?.params?.reason;
  const canClose = !!navigation.getParent?.()?.canGoBack?.();
  return (
    <SafeAreaView style={styles.safe}>
      <AuthHeader onClose={canClose ? () => closeAuth(navigation) : null} />
      <View style={styles.center}>
        <Logo size={88} />
        <Text style={styles.title}>{reason || 'Войдите в ARVELL'}</Text>
        <Text style={styles.sub}>Вход нужен, чтобы писать продавцам и сохранять избранное</Text>
      </View>

      <View style={styles.footer}>
        <Button title="Войти" onPress={() => navigation.navigate('Phone')} />
        <Text style={styles.legal}>
          Продолжая, вы принимаете{' '}
          <Text
            style={styles.legalLink}
            suppressHighlighting
            onPress={() => navigation.navigate('Legal', { doc: 'terms' })}
          >
            Условия
          </Text>
          {' '}и{' '}
          <Text
            style={styles.legalLink}
            suppressHighlighting
            onPress={() => navigation.navigate('Legal', { doc: 'privacy' })}
          >
            Политику конфиденциальности
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, gap: 18 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  sub: { color: colors.textSub, fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  legal: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: spacing.md, lineHeight: 18 },
  legalLink: { color: colors.textSub },
});
