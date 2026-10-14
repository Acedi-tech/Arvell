// Картинка с сервера, которая не сдаётся с первой попытки. Тестовый сервер
// часто отвечает с задержкой в 16 с и больше, и обычный <Image> при обрыве
// загрузки оставлял пустое место навсегда — так в ленте и карточке товара
// «не прогружалась» часть фото. Здесь при ошибке пробуем ещё пару раз, а пока
// фото грузится или если так и не загрузилось, показываем заглушку.
import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

export default function RemoteImage({ uri, style, resizeMode = 'cover', placeholder = null, ...rest }) {
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Новый адрес — новая история попыток.
  useEffect(() => {
    setAttempt(0);
    setLoaded(false);
    setFailed(false);
  }, [uri]);

  useEffect(() => {
    if (!failed || attempt >= MAX_RETRIES) return undefined;
    const t = setTimeout(() => {
      setFailed(false);
      setAttempt((a) => a + 1);
    }, RETRY_DELAY_MS);
    return () => clearTimeout(t);
  }, [failed, attempt]);

  if (!uri) return placeholder;

  // Параметр попытки в адресе заставляет загрузчик реально перезапросить
  // файл, а не вернуть закэшированную ошибку.
  const source = { uri: attempt ? `${uri}${uri.includes('?') ? '&' : '?'}r=${attempt}` : uri };

  return (
    <View style={style}>
      {!loaded && placeholder ? <View style={styles.fill}>{placeholder}</View> : null}
      {!(failed && attempt >= MAX_RETRIES) && (
        <Image
          {...rest}
          key={attempt}
          source={source}
          style={styles.fill}
          resizeMode={resizeMode}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
