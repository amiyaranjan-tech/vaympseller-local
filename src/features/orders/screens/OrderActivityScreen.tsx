import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, ChevronRight, History, Package } from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useThemeColors } from '../../../store/themeStore';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import { ROUTES, type MainStackParamList } from '../../../navigation/routeConfig';
import { getOrders } from '../orders.api';

type Nav = NativeStackNavigationProp<MainStackParamList, 'OrderActivity'>;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// There's no order-status-change audit log on the backend (only each
// order's current snapshot, via GET /seller/orders — see
// services/sellerOrder.service.js#shapeOrder) — so this is every order,
// newest first, each showing its current status, not a from->to transition
// feed. Shares OrdersScreen.tsx's own query key/cache rather than
// refetching separately.
export function OrderActivityScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<Nav>();
  const mainStack = navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();

  const ordersQuery = useQuery({
    queryKey: ['seller-orders', 'list'],
    queryFn: () => getOrders({ limit: 100 }),
  });

  const orders = ordersQuery.data?.items ?? [];

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Recent Activity</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            All your orders, newest first
          </Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {ordersQuery.isLoading ? (
          <>
            <Skeleton height={72} style={styles.skeletonBlock} />
            <Skeleton height={72} style={styles.skeletonBlock} />
            <Skeleton height={72} style={styles.skeletonBlock} />
          </>
        ) : orders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent10 }]}>
              <History size={28} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No activity yet</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              Every order and its status will show up here once customers start ordering.
            </Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {orders.map((order, index) => (
              <View key={order._id}>
                <Pressable
                  style={styles.row}
                  onPress={() => mainStack?.navigate(ROUTES.ORDER_DETAIL, { orderId: order._id })}
                >
                  <View style={[styles.rowIcon, { backgroundColor: `${colors.info}20` }]}>
                    <Package size={18} color={colors.info} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                      Order #{order.orderNumber} — {order.fulfillment.sellerStatus}
                    </Text>
                    <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
                      {timeAgo(order.createdAt)}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textLight} />
                </Pressable>
                {index < orders.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                )}
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    marginTop: 2,
    fontSize: FontSize.xs,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  skeletonBlock: {
    marginBottom: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  emptyBody: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 300,
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  rowTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  rowDescription: {
    marginTop: 2,
    fontSize: FontSize.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.lg + 40 + Spacing.md,
  },
});
