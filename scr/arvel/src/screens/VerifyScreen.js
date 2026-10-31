import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Text, TextInput } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, font } from '../theme';
import AuthHeader, { closeAuth } from '../components/AuthHeader';
import KeyboardAware from '../components/KeyboardAware';
import { useAuth } from '../context/AuthContext';
import { otpErrorMessage } from '../utils/otpError';

const LEN = 4;
const RESEND_SECONDS = 30;

// Паттерн «скрытое поле + ячейки-отображение»:
// весь код живёт одной строкой в невидимом TextInput, а ячейки —
// обычные Text, рисующие по одному символу из состояния.
// Нативному полю негде мигать (оно невидимо), лишняя цифра
// не может появиться на экране ни на мгновение.
export default function VerifyScreen({ navigation, route }) {
  // Без параметров тут показывался выдуманный номер, будто код ушёл именно
  // на него. Лучше не показывать номер вовсе, чем чужой.
  const phone = route?.params?.phone ?? null;
  const { verifyCode, registerPhone, pendingPhone } = useAuth();
  const [value, setValue] = useState('');
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const hidden = useRef(null);
  // Неверный код: ячейки краснеют и коротко трясутся.
  const [wrong, setWrong] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;
  const runShake = () => {
    shake.setValue(0);
    Animated.sequence([-8, 8, -5, 5, 0].map((x) =>
      Animated.timing(shake, { toValue: x, duration: 70, useNativeDriver: true }))).start();
  };

  // Автофокус при открытии экрана — клавиатура поднимается сразу
  useEffect(() => {
    const t = setTimeout(() => hidden.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  // Вернулись сюда «Назад» с анкеты: код уже использован, а экран оставался в
  // состоянии проверки — с цифрами в ячейках и заблокированным полем, ни
  // стереть, ни ввести новый (QA 21.10, Galaxy S9). При каждом возврате
  // начинаем с чистого поля.
  useEffect(() => navigation.addListener?.('focus', () => {
    setValue('');
    setVerifying(false);
    setError(null);
  }), [navigation]);

  // Таймер повторной отправки
  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  // Если клавиатуру свернули кнопкой «Назад»/жестом, поле остаётся в фокусе,
  // и повторный focus() клавиатуру не открывает. Поэтому сначала снимаем
  // фокус, а на следующем кадре ставим заново.
  const openKeyboard = () => {
    const input = hidden.current;
    if (!input || verifying) return;
    if (input.isFocused()) {
      input.blur();
      requestAnimationFrame(() => input.focus());
    } else {
      input.focus();
    }
  };

  const onChange = (text) => {
    if (verifying) return;
    const digits = text.replace(/\D/g, '').slice(0, LEN);
    setValue(digits);
    setError(null);
    setWrong(false);

    if (digits.length === LEN) {
      setVerifying(true);
      hidden.current?.blur();
      verifyCode(digits)
        .then(({ needsOnboarding }) => {
          // Существующий аккаунт уже залогинен в контексте — модалка входа
          // закроется сама (см. AuthModal), имя второй раз не спрашиваем.
          if (needsOnboarding) navigation.navigate('ProfileSetup');
        })
        .catch((e) => {
          setError(otpErrorMessage(e));
          setWrong(true);
          runShake();
          setValue('');
          setVerifying(false);
        });
    }
  };

  const resend = () => {
    if (!pendingPhone) return;
    setSeconds(RESEND_SECONDS);
    registerPhone(pendingPhone).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAware>
      <AuthHeader title="Подтверждение" onBack={() => navigation.goBack()} onClose={() => closeAuth(navigation)} />

      <View style={styles.body}>
        <Text style={styles.title}>Введите код</Text>
        <Text style={styles.sub}>{phone ? `Код отправлен на ${phone}` : 'Код отправлен'}</Text>

        {/* Тап по любой ячейке возвращает фокус в скрытое поле */}
        <Animated.View style={{ transform: [{ translateX: shake }] }}>
          <Pressable style={styles.cells} onPress={openKeyboard}>
            {Array.from({ length: LEN }).map((_, i) => (
              <View
                key={i}
                style={[styles.cell, value[i] ? styles.cellFilled : null, wrong && styles.cellWrong]}
              >
                <Text style={styles.cellText}>{value[i] ?? ''}</Text>
              </View>
            ))}
          </Pressable>
        </Animated.View>

        {/* Невидимое поле, в котором реально идёт ввод.
            Backspace здесь стирает последнюю цифру — визуально это
            «стереть и перейти в предыдущую ячейку», удержание
            стирает весь код справа налево. */}
        <TextInput
          ref={hidden}
          style={styles.hiddenInput}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          value={value}
          onChangeText={onChange}
          maxLength={LEN}
          editable={!verifying}
          caretHidden
        />

        {error && <Text style={styles.error}>{error}</Text>}

        {seconds > 0 ? (
          <Text style={styles.resendOff}>
            Отправить код повторно через 0:{String(seconds).padStart(2, '0')}
          </Text>
        ) : pendingPhone ? (
          <Pressable onPress={resend}>
            <Text style={styles.resendOn}>Отправить код повторно</Text>
          </Pressable>
        ) : (
          // Без номера повторно отправлять некуда: кнопка молча ничего не
          // делала, что выглядело как поломка. Отправляем назад, на ввод номера.
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.resendOn}>Изменить номер</Text>
          </Pressable>
        )}
      </View>
      </KeyboardAware>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  sub: { color: colors.textSub, fontSize: font.sizeSM, marginTop: 10, lineHeight: 21 },
  cells: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: spacing.lg },
  cell: {
    width: 62, height: 70,
    backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cellFilled: { borderColor: colors.accent },
  cellWrong: { borderColor: colors.danger },
  cellText: { color: colors.text, fontSize: 28, fontWeight: '700' },
  hiddenInput: {
    position: 'absolute',
    width: 1, height: 1,
    opacity: 0,
  },
  error: {
    color: colors.danger, fontSize: 13,
    textAlign: 'center', marginTop: 12,
  },
  resendOff: {
    color: colors.textMuted, fontSize: font.sizeSM,
    textAlign: 'center', marginTop: spacing.xl,
  },
  resendOn: {
    color: colors.accent, fontSize: font.sizeSM, fontWeight: '600',
    textAlign: 'center', marginTop: spacing.xl,
  },
});
