// «Мои объявления» продавца (Editorial, design/v3-c.jsx → V3MyListings):
// сетка своих товаров, в шапке жёлтая «+» — новый товар.
// Открывается из плитки «Объявления» в «Профиле».
import React, { useCallback } from 'react';
import { View, FlatList, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../theme';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import MyListingCard from '../components/MyListingCard';
import { GRID_GAP } from '../components/ProductCard';
import { useMyListings } from '../context/MyListingsContext';

function PlusIcon({ size = 20, color = colors.accentText }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export default function MyListingsScreen({ navigation }) {
  const { items, loading, error, refresh, markSold, markActive, archive } = useMyListings();

  // Список живёт на сервере — при каждом заходе на экран обновляем его,
  // чтобы видеть изменения, сделанные с другого устройства.
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const run = (action, id) => {
    Promise.resolve(action?.(id)).catch((e) => {
      Alert.alert('Не удалось выполнить действие', e?.message || 'Попробуйте ещё раз.');
    });
  };

  const addBtn = (
    <Pressable style={styles.addBtn} accessibilityRole="button" accessibilityLabel="Добавить товар" onPress={() => navigation.navigate('AddProduct')}>
      <PlusIcon />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Мои объявления" onBack={() => navigation.goBack()} right={addBtn} />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: GRID_GAP }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading && items.length > 0}
        onRefresh={refresh}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.accent} size="large" style={{ marginTop: spacing.xl }} />
          ) : error ? (
            <EmptyState title="Не удалось загрузить объявления" message={error.message} actionTitle="Повторить" onAction={refresh} />
          ) : (
            <EmptyState
              title="Объявлений пока нет"
              message="Нажмите «+» вверху, чтобы опубликовать первый товар"
            />
          )
        }
        renderItem={({ item }) => (
          <View style={{ zIndex: 1 }}>
            <MyListingCard
              product={item}
              onPress={() => navigation.navigate('Product', { id: item.id })}
              onMarkSold={(id) => run(markSold, id)}
              onMarkActive={(id) => run(markActive, id)}
              onDelete={(id) => run(archive, id)}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  addBtn: { width: 36, height: 36, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  list: { paddingTop: 2, paddingBottom: spacing.xl, flexGrow: 1 },
});
