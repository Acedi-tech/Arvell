// Карточка своего объявления (Editorial, design/v3-c.jsx → V3MyListings):
// та же карточка, что в ленте, но без сердечка; в углу фото «…» с меню
// «Снять с продажи / Вернуть в продажу / Удалить». Снятые — бледнее
// и с плашкой «Снято».
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from './AppText';
import { colors, type } from '../theme';
import { MoreIcon } from './Icons';
import ConfirmDialog from './ConfirmDialog';
import ProductCard from './ProductCard';

// product — ProductSummary с бэкенда. out_of_stock у нас — «снято с продажи».
export default function MyListingCard({ product, onPress, onMarkSold, onMarkActive, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const off = product.status === 'out_of_stock';

  const moreBtn = (
    <Pressable
      style={styles.moreBtn}
      hitSlop={8}
      accessibilityLabel="Меню объявления"
      onPress={() => setMenuOpen((v) => !v)}
    >
      <MoreIcon size={18} color={colors.text} />
    </Pressable>
  );

  return (
    <View>
      <View style={off && styles.dim}>
        <ProductCard product={product} onPress={onPress} hideFav topRight={moreBtn} />
      </View>
      {off && (
        <View style={styles.offBadge} pointerEvents="none">
          <Text style={styles.offText}>Снято</Text>
        </View>
      )}

      {menuOpen && (
        <View style={styles.menu}>
          <Pressable
            style={styles.menuRow}
            onPress={() => { setMenuOpen(false); (off ? onMarkActive : onMarkSold)?.(product.id); }}
          >
            <Text style={styles.menuText}>{off ? 'Вернуть в продажу' : 'Снять с продажи'}</Text>
          </Pressable>
          <Pressable style={[styles.menuRow, styles.menuLast]} onPress={() => { setMenuOpen(false); setConfirmVisible(true); }}>
            <Text style={[styles.menuText, { color: colors.danger }]}>Удалить</Text>
          </Pressable>
        </View>
      )}

      <ConfirmDialog
        visible={confirmVisible}
        title="Удалить объявление?"
        message="Это действие нельзя отменить."
        confirmText="Удалить"
        cancelText="Отмена"
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => { setConfirmVisible(false); onDelete?.(product.id); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { opacity: 0.55 },
  moreBtn: {
    position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  offBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: colors.surfaceAlt, paddingHorizontal: 7, paddingVertical: 3 },
  offText: { ...type.mono, fontSize: 9.5, color: colors.textSub },
  menu: {
    position: 'absolute', top: 44, right: 8, zIndex: 5, minWidth: 170,
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border,
  },
  menuRow: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLast: { borderBottomWidth: 0 },
  menuText: { color: colors.text, fontSize: 14 },
});
