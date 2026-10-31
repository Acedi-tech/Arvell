// Нижняя шторка: затемнение, ручка сверху, выезд снизу. Тап по фону и
// системная «Назад» закрывают её.
import React from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './AppText';
import { colors, spacing, type } from '../theme';

export default function BottomSheet({ visible, onClose, title, children }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={onClose} accessibilityLabel="Закрыть">
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]} onPress={() => {}}>
          <View style={styles.handle} />
          {!!title && <Text style={styles.title}>{title}</Text>}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
  },
  handle: { alignSelf: 'center', width: 36, height: 4, backgroundColor: colors.chipBorder, marginBottom: spacing.md },
  title: { ...type.mono, fontSize: 11, color: colors.textMuted, marginBottom: spacing.sm },
});
