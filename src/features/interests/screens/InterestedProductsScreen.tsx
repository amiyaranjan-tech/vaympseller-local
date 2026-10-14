import React from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, Heart } from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { AppHeader } from '../../../components/layout/AppHeader';
import { Card } from '../../../components/common/Card';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useThemeColors } from '../../../store/themeStore';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import { ROUTES, type MainStackParamList } from '../../../navigation/routeConfig';
import { getInterestedProducts } from '../interests.api';

type Nav = NativeStackNavigationProp<MainStackParamList, 'InterestedProducts'>;

export function InterestedProductsScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<Nav>();

  const query = useQuery({
    queryKey: ['seller-interests', 'list'],
    queryFn: getInterestedProducts,
  });

  return (
    <Screen>
      <AppHeader title="Interested Customers" onBack={() => navigation.goBack()} />

      {query.isLoading ? (
        <View style={styles.content}>
          <Skeleton width="100%" height={84} radius={Radius.lg} />
          <Skeleton width="100%" height={84} radius={Radius.lg} />
        </View>
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={item => item.product._id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              {query.isError
                ? "Couldn't load interested customers. Pull to retry."
                : 'No customer has marked a product as interested yet.'}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate(ROUTES.INTERESTED_PRODUCT_DETAIL, { productId: item.product._id })
              }
            >
              <Card style={styles.row}>
                <Image
                  source={{ uri: item.product.images[0]?.url }}
                  style={[styles.thumb, { backgroundColor: colors.border }]}
                />
                <View style={styles.info}>
                  <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <Text style={[styles.price, { color: colors.textSecondary }]}>
                    ₹{item.product.finalPrice.toLocaleString('en-IN')}
                  </Text>
                  <View style={styles.countRow}>
                    <Heart size={14} color={colors.accent} fill={colors.accent} />
                    <Text style={[styles.count, { color: colors.accent }]}>
                      {item.count} interested · {new Date(item.lastInterestAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={colors.textSecondary} />
              </Card>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  thumb: { width: 64, height: 64, borderRadius: Radius.md },
  info: { flex: 1, gap: 2 },
  name: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  price: { fontSize: FontSize.sm },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  count: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  empty: { textAlign: 'center', marginTop: Spacing.xxxl, fontSize: FontSize.md },
});
