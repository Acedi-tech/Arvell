import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import { HeartIcon } from '../components/Icons';
import ProductCard, { GRID_GAP } from '../components/ProductCard';
import { useFavorites } from '../context/FavoritesContext';

export default function FavoritesScreen({ navigation }) {
  // GET /me/favorites уже отдаёт товар вложенным в каждый FavoriteItem —
  // не нужно сверяться с отдельным списком товаров.
  const { items } = useFavorites();
  const liked = items.map((it) => it.product);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header title="Избранное" />

      {liked.length === 0 ? (
        <View style={styles.center}>
          <EmptyState
            icon={<HeartIcon size={30} color={colors.textMuted} />}
            title="Пока пусто"
            message="Добавляйте товары в избранное, нажимая на сердечко"
            actionTitle="Перейти к товарам"
            onAction={() => navigation.navigate('Catalog')}
          />
        </View>
      ) : (
        <FlatList
          data={liked}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: GRID_GAP }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('Product', { id: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { paddingTop: 2, paddingBottom: spacing.xl },
  center: { flex: 1, justifyContent: 'center' },
});
