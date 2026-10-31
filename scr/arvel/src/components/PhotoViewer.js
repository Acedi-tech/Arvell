// Фото на весь экран с приближением (щипок / двойной тап). Тап по фото
// или крестик — закрыть.
import React from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ZoomableImage from './ZoomableImage';
import { CloseIcon } from './Icons';
import { colors } from '../theme';

export default function PhotoViewer({ uri, onClose }) {
  return (
    <Modal visible={!!uri} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {!!uri && <ZoomableImage uri={uri} style={styles.image} onSingleTap={onClose} />}
        <SafeAreaView edges={['top']} style={styles.closeSafe} pointerEvents="box-none">
          <Pressable hitSlop={10} style={styles.close} accessibilityLabel="Закрыть фото" onPress={onClose}>
            <CloseIcon size={20} color={colors.text} />
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000' },
  image: { width: '100%', height: '100%' },
  closeSafe: { position: 'absolute', top: 0, right: 0 },
  close: {
    margin: 14, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
});
