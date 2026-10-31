import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator, Share } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, font, type } from '../theme';
import Header from '../components/Header';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import {
  listSellerInvites, createSellerInvite, revokeSellerInvite,
  listAdminUsers, banUser, unbanUser,
} from '../api/admin';

const TABS = [
  { key: 'invites', label: 'Инвайты' },
  { key: 'users', label: 'Пользователи' },
];

// SellerInviteStatus: created | used | expired | revoked (см. OpenAPI)
const INVITE_STATUS_LABEL = {
  created: 'Активен', used: 'Использован', expired: 'Истёк', revoked: 'Отозван',
};

const ROLE_LABEL = { user: 'Покупатель', seller: 'Продавец' };

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad2 = (n) => String(n).padStart(2, '0');
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

// created_by/used_by с бэкенда — id пользователя, не имя (в API нет
// отдельного лукапа id → имя для этого места) — показываем укороченный id.
function shortId(id) {
  return id ? id.slice(0, 8) : '';
}

function InviteBadge({ status }) {
  return (
    <View style={[styles.badge, styles[`badge_${status}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${status}`]]}>{INVITE_STATUS_LABEL[status] || status}</Text>
    </View>
  );
}

function InviteRow({ invite, onRevoke, last }) {
  const share = () => Share.share({
    message: `Код приглашения продавца ARVELL: ${invite.token}\nВведите его при регистрации, выбрав «Я продавец».`,
  }).catch(() => {});
  return (
    <View style={[styles.inviteRow, !last && styles.rowBorderBottom]}>
      <View style={styles.inviteHead}>
        <Text style={styles.inviteCode} numberOfLines={1} ellipsizeMode="middle">{invite.token}</Text>
        <InviteBadge status={invite.status} />
      </View>
      <Text style={styles.inviteSub}>
        Создал {shortId(invite.created_by)} · {formatDate(invite.created_at)} · истекает {formatDate(invite.expires_at)}
        {invite.used_by ? ` · использовал ${shortId(invite.used_by)}` : ''}
      </Text>
      {invite.status === 'created' && (
        <View style={styles.inviteActions}>
          <Pressable style={styles.shareBtn} onPress={share}>
            <Text style={styles.shareText}>Поделиться</Text>
          </Pressable>
          <Pressable style={styles.revokeBtn} onPress={() => onRevoke(invite.id)}>
            <Text style={styles.revokeText}>Отозвать</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function UserRow({ user, onToggleBan }) {
  const banned = !user.is_active;
  return (
    <View style={styles.userRow}>
      <Avatar name={user.display_name} size={40} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.userNameRow}>
          <Text style={styles.userName} numberOfLines={1}>{user.display_name}</Text>
          {banned && <View style={styles.bannedBadge}><Text style={styles.bannedText}>Забанен</Text></View>}
        </View>
        <Text style={styles.userSub}>
          {[ROLE_LABEL[user.role] || user.role, user.phone, `с ${formatDate(user.created_at)}`].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Pressable
        style={[styles.banBtn, banned && styles.unbanBtn]}
        onPress={() => onToggleBan(user.id, banned)}
      >
        <Text style={[styles.banText, banned && styles.unbanText]}>
          {banned ? 'Разбанить' : 'Забанить'}
        </Text>
      </Pressable>
    </View>
  );
}

export default function AdminPanelScreen({ navigation }) {
  // Права проверяет и сервер, но экран не должен открываться у не-админа:
  // попасть сюда можно было только строкой в профиле, и это единственное,
  // что его закрывало. Флаг is_admin приходит в /me и ортогонален role.
  const { user } = useAuth();
  const isAdmin = !!user?.is_admin;

  const [tab, setTab] = useState('invites');

  const [invites, setInvites] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [invitesError, setInvitesError] = useState(null);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);

  const loadInvites = useCallback(() => {
    setInvitesLoading(true);
    setInvitesError(null);
    listSellerInvites()
      .then((page) => setInvites(page.data || []))
      .catch((e) => setInvitesError(e))
      .finally(() => setInvitesLoading(false));
  }, []);

  const loadUsers = useCallback(() => {
    setUsersLoading(true);
    setUsersError(null);
    listAdminUsers()
      .then((page) => setUsers(page.data || []))
      .catch((e) => setUsersError(e))
      .finally(() => setUsersLoading(false));
  }, []);

  // Не-админу экран показывает только «нет прав» — запросы к /admin/* уходить
  // не должны вовсе, даже если сервер всё равно ответил бы отказом.
  useEffect(() => { if (isAdmin) loadInvites(); }, [isAdmin, loadInvites]);
  useEffect(() => { if (isAdmin) loadUsers(); }, [isAdmin, loadUsers]);

  // Отзыв инвайта и бан — только после подтверждения.
  const [confirm, setConfirm] = useState(null);
  const revokeInvite = (id) => {
    setConfirm(null);
    revokeSellerInvite(id)
      .then((updated) => setInvites((prev) => prev.map((i) => (i.id === id ? updated : i))))
      .catch((e) => Alert.alert('Не удалось отозвать', e.message || 'Попробуйте ещё раз.'));
  };

  const createInvite = () => {
    createSellerInvite()
      .then((invite) => setInvites((prev) => [invite, ...prev]))
      .catch((e) => Alert.alert('Не удалось создать инвайт', e.message || 'Попробуйте ещё раз.'));
  };

  const toggleBan = (id, banned) => {
    setConfirm(null);
    const action = banned ? unbanUser : banUser;
    action(id)
      .then((updated) => setUsers((prev) => prev.map((u) => (u.id === id ? updated : u))))
      .catch((e) => Alert.alert('Не удалось изменить статус', e.message || 'Попробуйте ещё раз.'));
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header title="Админ-панель" onBack={() => navigation.goBack()} />
        <View style={styles.denied}>
          <Text style={styles.deniedText}>У вас нет прав администратора.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Админ-панель" onBack={() => navigation.goBack()} border={false} />

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => setTab(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.key }}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {tab === 'invites' && (
          <>
            <Button title="+ Создать инвайт" onPress={createInvite} style={{ marginBottom: 20 }} />

            {invitesLoading ? (
              <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
            ) : invitesError ? (
              <Text style={styles.empty}>Не удалось загрузить инвайты</Text>
            ) : invites.length === 0 ? (
              <Text style={styles.empty}>Инвайтов пока нет</Text>
            ) : (
              <View style={styles.card}>
                {invites.map((invite, i) => (
                  <InviteRow
                    key={invite.id}
                    invite={invite}
                    last={i === invites.length - 1}
                    onRevoke={(id) => setConfirm({ kind: 'revoke', id })}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {tab === 'users' && (
          usersLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
          ) : usersError ? (
            <Text style={styles.empty}>Не удалось загрузить пользователей</Text>
          ) : (
            <View style={styles.card}>
              {users.map((user, i) => (
                <View key={user.id} style={i < users.length - 1 && styles.rowBorderBottom}>
                  <UserRow user={user} onToggleBan={(id, banned) => setConfirm({ kind: banned ? 'unban' : 'ban', id, name: user.display_name })} />
                </View>
              ))}
            </View>
          )
        )}
      </ScrollView>

      <ConfirmDialog
        visible={!!confirm}
        title={confirm?.kind === 'revoke' ? 'Отозвать инвайт?' : confirm?.kind === 'ban' ? 'Забанить пользователя?' : 'Разбанить пользователя?'}
        message={confirm?.kind === 'revoke'
          ? 'Код перестанет работать.'
          : confirm?.kind === 'ban'
            ? `${confirm?.name || 'Пользователь'} не сможет пользоваться ARVELL.`
            : `${confirm?.name || 'Пользователь'} снова сможет пользоваться ARVELL.`}
        confirmText={confirm?.kind === 'revoke' ? 'Отозвать' : confirm?.kind === 'ban' ? 'Забанить' : 'Разбанить'}
        confirmTone={confirm?.kind === 'unban' ? 'accent' : 'danger'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => (confirm?.kind === 'revoke' ? revokeInvite(confirm.id) : toggleBan(confirm.id, confirm.kind === 'unban'))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  deniedText: { color: colors.textMuted, fontSize: font.sizeMD, textAlign: 'center' },
  safe: { flex: 1, backgroundColor: colors.bg },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.md },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: colors.accent },
  tabText: { ...type.mono, color: colors.textMuted, fontSize: 12 },
  tabTextActive: { color: colors.accent },

  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  card: { borderWidth: 1, borderColor: colors.border },
  rowBorderBottom: { borderBottomWidth: 1, borderBottomColor: colors.border },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },

  inviteRow: { paddingHorizontal: 14, paddingVertical: 13, gap: 6 },
  inviteHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inviteCode: { ...type.monoMedium, flex: 1, color: colors.text, fontSize: 14, letterSpacing: 1 },
  inviteSub: { color: colors.textMuted, fontSize: 12.5 },
  inviteActions: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },

  badge: { paddingHorizontal: 8, paddingVertical: 3 },
  badge_created: { backgroundColor: colors.accent },
  badge_revoked: { backgroundColor: colors.danger },
  badge_used: { backgroundColor: colors.surfaceAlt },
  badge_expired: { backgroundColor: colors.surfaceAlt },
  badgeText: { ...type.monoMedium, fontSize: 10 },
  badgeText_created: { color: colors.accentText },
  badgeText_revoked: { color: colors.text },
  badgeText_used: { color: colors.textMuted },
  badgeText_expired: { color: colors.textMuted },

  shareBtn: { borderWidth: 1, borderColor: colors.text, paddingHorizontal: 12, paddingVertical: 6 },
  shareText: { ...type.mono, color: colors.text, fontSize: 11 },
  revokeBtn: { borderWidth: 1, borderColor: colors.danger, paddingHorizontal: 12, paddingVertical: 6 },
  revokeText: { ...type.mono, color: colors.danger, fontSize: 11 },

  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  userName: { flexShrink: 1, color: colors.text, fontSize: 14.5, fontWeight: '600' },
  userSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  bannedBadge: { backgroundColor: colors.danger, paddingHorizontal: 6, paddingVertical: 2 },
  bannedText: { ...type.monoMedium, color: colors.text, fontSize: 9 },

  banBtn: { borderWidth: 1, borderColor: colors.danger, paddingHorizontal: 12, paddingVertical: 7 },
  unbanBtn: { backgroundColor: colors.accent, borderColor: colors.accent },
  banText: { ...type.mono, color: colors.danger, fontSize: 11 },
  unbanText: { color: colors.accentText },
});
