// Профиль (Editorial, design/v3-c.jsx → V3Profile): аватар, имя или магазин,
// рейтинг продавца, плашка роли, «Редактировать профиль», плитки статистики,
// настройки, «Удалить аккаунт» и версия.
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, type } from '../theme';
import {
  HeartIcon, GridIcon, HelpIcon, DocIcon, LogoutIcon, ChevronRight, SunIcon, StarIcon,
} from '../components/Icons';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useMyListings } from '../context/MyListingsContext';
import { listMyPurchases, listMySales } from '../api/purchases';
import { getMyShop } from '../api/shops';
import { resolveMediaUrl } from '../utils/media';
import { reviewsCount } from '../utils/plural';
import appConfig from '../../app.json';

// Сумка для плитки «Заказы» / «Продажи»
function BagIcon({ size = 20, color = colors.accent }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 8h12l-1 12H7L6 8Z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
      <Path d="M9 8a3 3 0 0 1 6 0" stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

function StatTile({ icon, value, label, onPress }) {
  return (
    <Pressable style={styles.tile} onPress={onPress} accessibilityRole="button">
      {icon}
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function SettingRow({ icon, label, onPress, danger, last }) {
  return (
    <Pressable style={[styles.setRow, !last && styles.setRowBorder]} onPress={onPress} accessibilityRole="button">
      {icon}
      <Text style={[styles.setLabel, danger && { color: colors.danger }]}>{label}</Text>
      {!danger && <ChevronRight size={18} />}
    </Pressable>
  );
}

export default function AccountScreen({ navigation }) {
  const { user, signOut, deleteAccount } = useAuth();
  const { count: favCount } = useFavorites();
  const { items: myListings } = useMyListings();
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const name = user?.name || 'Профиль';
  const avatarUri = resolveMediaUrl(user?.profile_pic_url);
  const isSeller = user?.role === 'seller';
  // is_admin приходит с бэкенда в /me и ортогонален role (см. OpenAPI) —
  // админом может быть и покупатель, не только продавец.
  const isAdmin = !!user?.is_admin;

  // Число сделок и данные магазина — с сервера. Пока не пришли, в плитке «—»,
  // а не выдуманное число.
  const [dealsCount, setDealsCount] = useState(null);
  const [shop, setShop] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = isSeller ? listMySales : listMyPurchases;
    Promise.resolve(load?.({ limit: 50 }))
      .then((res) => { if (alive && Array.isArray(res?.data)) setDealsCount(res.data.length); })
      .catch(() => {});
    if (isSeller) {
      Promise.resolve(getMyShop?.())
        .then((s) => { if (alive && s) setShop(s); })
        .catch(() => {});
    }
    return () => { alive = false; };
  }, [isSeller, user?.id]);

  const handleDelete = async () => {
    setDeleteConfirmVisible(false);
    setDeleting(true);
    try {
      await deleteAccount();
      // RootNavigator сам уведёт на экран входа: isLoggedIn стал false.
    } catch (e) {
      setDeleting(false);
      Alert.alert('Не удалось удалить аккаунт', e?.message || 'Попробуйте ещё раз.');
    }
  };

  // guardTab в MainTabs перехватывает только переключение вкладки, а не сам
  // момент выхода на экране «Профиль» — поэтому уводим на «Главную» явно.
  const handleLogout = async () => {
    setLogoutConfirmVisible(false);
    await signOut();
    navigation.getParent()?.navigate('Feed');
  };

  const title = isSeller && shop?.shop_name ? shop.shop_name : name;
  const ratingCount = shop?.rating_count ?? 0;
  const dealsValue = dealsCount == null ? '—' : String(dealsCount);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Профиль" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.profileRow}>
          <Avatar uri={avatarUri} name={name} size={80} ring={isSeller} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={2}>{title}</Text>
            {isSeller && shop?.shop_name && name !== shop.shop_name && <Text style={styles.subName}>{name}</Text>}
            {isSeller && ratingCount > 0 && shop?.rating != null && (
              <View style={styles.ratingRow}>
                <StarIcon size={14} />
                <Text style={styles.ratingValue}>{shop.rating.toFixed(1)}</Text>
                <Text style={styles.ratingCount}>· {reviewsCount(ratingCount)}</Text>
              </View>
            )}
            <View style={[styles.roleBadge, isSeller ? styles.roleSeller : styles.roleBuyer]}>
              <Text style={[styles.roleText, isSeller ? styles.roleTextSeller : styles.roleTextBuyer]}>
                {isSeller ? 'Продавец' : 'Покупатель'}
              </Text>
            </View>
          </View>
        </View>

        <Button title="Редактировать профиль" variant="ghost" onPress={() => navigation.navigate('EditProfile')} style={styles.editBtn} />

        <View style={styles.tiles}>
          {isSeller ? (
            <>
              <StatTile icon={<BagIcon />} value={dealsValue} label="Продажи" onPress={() => navigation.navigate('Orders')} />
              <StatTile
                icon={<GridIcon size={20} color={colors.accent} />}
                value={String(myListings.length)}
                label="Объявления"
                onPress={() => navigation.navigate('MyListings')}
              />
              <StatTile
                icon={<StarIcon size={20} />}
                value={String(ratingCount)}
                label="Отзывы"
                onPress={() => shop?.id && navigation.navigate('Reviews', {
                  shopId: shop.id, title: shop.shop_name, rating: shop.rating, ratingCount,
                })}
              />
            </>
          ) : (
            <>
              <StatTile icon={<BagIcon />} value={dealsValue} label="Заказы" onPress={() => navigation.navigate('Orders')} />
              <StatTile
                icon={<HeartIcon size={20} color={colors.accent} />}
                value={String(favCount)}
                label="Избранное"
                onPress={() => navigation.getParent()?.navigate('Favorites')}
              />
            </>
          )}
        </View>

        <Text style={styles.label}>Настройки</Text>
        <View style={styles.card}>
          <SettingRow icon={<HelpIcon size={20} color={colors.textSub} />} label="Помощь" onPress={() => navigation.navigate('Help')} />
          <SettingRow icon={<DocIcon size={20} color={colors.textSub} />} label="Правила" onPress={() => navigation.navigate('Rules')} />
          {isAdmin && (
            <SettingRow icon={<SunIcon size={20} color={colors.textSub} />} label="Админ-панель" onPress={() => navigation.navigate('AdminPanel')} />
          )}
          <SettingRow icon={<LogoutIcon size={20} />} label="Выйти" danger last onPress={() => setLogoutConfirmVisible(true)} />
        </View>

        <Pressable style={styles.deleteBtn} disabled={deleting} onPress={() => setDeleteConfirmVisible(true)}>
          <Text style={styles.deleteText}>{deleting ? 'Удаляем аккаунт…' : 'Удалить аккаунт'}</Text>
        </Pressable>

        <Text style={styles.version}>ARVELL · версия {appConfig.expo.version}</Text>
      </ScrollView>

      <ConfirmDialog
        visible={logoutConfirmVisible}
        title="Выйти из аккаунта?"
        message="Вы вернётесь на экран входа."
        confirmText="Выйти"
        cancelText="Отмена"
        onCancel={() => setLogoutConfirmVisible(false)}
        onConfirm={handleLogout}
      />

      <ConfirmDialog
        visible={deleteConfirmVisible}
        title="Удалить аккаунт?"
        message={isSeller
          ? 'Профиль, магазин и все объявления будут удалены без возможности восстановления.'
          : 'Профиль, избранное и история будут удалены без возможности восстановления.'}
        confirmText="Удалить"
        cancelText="Отмена"
        onCancel={() => setDeleteConfirmVisible(false)}
        onConfirm={handleDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingTop: 18, paddingBottom: spacing.xl },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  name: { ...type.display, color: colors.text, fontSize: 20, letterSpacing: -0.4 },
  subName: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  ratingValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  ratingCount: { color: colors.textMuted, fontSize: 13 },
  roleBadge: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 8, paddingVertical: 4 },
  roleSeller: { backgroundColor: colors.accent },
  roleBuyer: { backgroundColor: colors.surfaceAlt },
  roleText: { ...type.monoMedium, fontSize: 10 },
  roleTextSeller: { color: colors.accentText },
  roleTextBuyer: { color: colors.textSub },

  editBtn: { marginBottom: spacing.md },

  tiles: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  tile: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', gap: 5,
  },
  tileValue: { ...type.display, color: colors.text, fontSize: 20 },
  tileLabel: { ...type.mono, fontSize: 10, color: colors.textMuted },

  label: { ...type.mono, fontSize: 10.5, color: colors.textMuted, marginBottom: spacing.sm },
  card: { borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 14, paddingVertical: 14 },
  setRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  setLabel: { flex: 1, color: colors.text, fontSize: 15 },

  deleteBtn: { alignSelf: 'center', padding: 6 },
  deleteText: { color: colors.danger, fontSize: 13 },
  version: { color: '#5a5a5a', fontSize: 12, textAlign: 'center', paddingTop: 14, paddingBottom: 4 },
});
