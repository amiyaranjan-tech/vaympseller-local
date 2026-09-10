import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Bike,
  Check,
  CircleCheck,
  CircleX,
  ClipboardList,
  Clock3,
  Package,
  Search,
  ShoppingBag,
  Sparkle,
  SlidersHorizontal,
  Truck,
  ChevronRight,
} from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Badge, type BadgeTone } from '../../../components/common/Badge';
import { BottomSheet } from '../../../components/common/BottomSheet';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useThemeColors } from '../../../store/themeStore';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import { ROUTES, type MainStackParamList, type MainTabParamList } from '../../../navigation/routeConfig';
import { getOrders, type Order, type OrderFulfillmentStatus } from '../orders.api';

type Colors = ReturnType<typeof useThemeColors>['colors'];

const STAT_DEFS = [
  { key: 'total', label: 'Total', icon: ShoppingBag, tint: (c: Colors) => c.info },
  { key: 'pending', label: 'Pending', icon: Clock3, tint: (c: Colors) => c.warning },
  { key: 'processing', label: 'Processing', icon: Truck, tint: (c: Colors) => c.success },
  { key: 'shipped', label: 'Shipped', icon: Package, tint: (c: Colors) => c.fulfillmentProcessing },
  { key: 'delivered', label: 'Delivered', icon: CircleCheck, tint: (c: Colors) => c.success },
  { key: 'cancelled', label: 'Cancelled', icon: CircleX, tint: (c: Colors) => c.error },
] as const;

// Folds the real 8-value sellerStatus enum down into STAT_DEFS' 6 tiles —
// Confirmed/Processing share the "processing" tile, Packed/Shipped/Out for
// Delivery share "shipped", matching what a seller actually cares to count
// at a glance rather than redesigning the tile row for every intermediate
// state.
function statBucket(status: OrderFulfillmentStatus): (typeof STAT_DEFS)[number]['key'] {
  switch (status) {
    case 'Pending':
      return 'pending';
    case 'Confirmed':
    case 'Processing':
      return 'processing';
    case 'Packed':
    case 'Shipped':
    case 'Out for Delivery':
      return 'shipped';
    case 'Delivered':
      return 'delivered';
    case 'Cancelled':
      return 'cancelled';
  }
}

const STATUS_TONE: Record<OrderFulfillmentStatus, BadgeTone> = {
  Pending: 'warning',
  Confirmed: 'info',
  Processing: 'info',
  Packed: 'info',
  Shipped: 'success',
  'Out for Delivery': 'success',
  Delivered: 'success',
  Cancelled: 'error',
};

type SortKey = 'newest' | 'oldest' | 'amount_high' | 'amount_low';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'amount_high', label: 'Amount: High to Low' },
  { key: 'amount_low', label: 'Amount: Low to High' },
];

function sortOrders(orders: Order[], sortBy: SortKey): Order[] {
  const sorted = [...orders];
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case 'amount_high':
      return sorted.sort((a, b) => b.total - a.total);
    case 'amount_low':
      return sorted.sort((a, b) => a.total - b.total);
  }
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type OrdersNav = BottomTabNavigationProp<MainTabParamList, 'Orders'>;

export function OrdersScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<OrdersNav>();
  const mainStack = navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();

  const ordersQuery = useQuery({
    queryKey: ['seller-orders', 'list'],
    queryFn: () => getOrders({ limit: 100 }),
  });

  const orders = useMemo(() => ordersQuery.data?.items ?? [], [ordersQuery.data]);

  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  // Recent activity and the stat counts always reflect the real
  // chronological/total picture regardless of the chosen sort — only the
  // main order list below reorders.
  const sortedOrders = useMemo(() => sortOrders(orders, sortBy), [orders, sortBy]);

  const counts: Record<(typeof STAT_DEFS)[number]['key'], number> = {
    total: orders.length,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };
  orders.forEach(order => {
    counts[statBucket(order.fulfillment.sellerStatus)] += 1;
  });

  const recentOrders = orders.slice(0, 3);

  const goToOrder = (orderId: string) =>
    mainStack?.navigate(ROUTES.ORDER_DETAIL, { orderId });

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={ordersQuery.isRefetching}
            onRefresh={() => void ordersQuery.refetch()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Orders</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage and fulfill customer orders
            </Text>
          </View>
        </View>

        <View style={styles.statGrid}>
          {STAT_DEFS.map(def => {
            const Icon = def.icon;
            const tint = def.tint(colors);
            return (
              <View
                key={def.key}
                style={[
                  styles.statTile,
                  { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: tint },
                ]}
              >
                <View style={[styles.statIcon, { backgroundColor: `${tint}20` }]}>
                  <Icon size={16} color={tint} />
                </View>
                <View style={styles.statTileText}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{counts[def.key]}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                    {def.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
            <Search size={18} color={colors.inputPlaceholder} />
            <TextInput
              placeholder="Search orders by ID, customer or product..."
              placeholderTextColor={colors.inputPlaceholder}
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
          </View>
          <Pressable
            onPress={() => setSortSheetOpen(true)}
            style={[styles.sortButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
          >
            <SlidersHorizontal size={16} color={colors.textPrimary} />
            <Text style={[styles.sortLabel, { color: colors.textPrimary }]}>Sort</Text>
          </Pressable>
        </View>

        {ordersQuery.isLoading ? (
          <>
            <Skeleton height={72} style={styles.skeletonBlock} />
            <Skeleton height={72} style={styles.skeletonBlock} />
            <Skeleton height={72} style={styles.skeletonBlock} />
          </>
        ) : orders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={[styles.emptyIconRing, { backgroundColor: `${colors.accent}14` }]}>
              <ClipboardList size={48} color={colors.accent} />
              <View style={[styles.emptySearchBadge, { backgroundColor: colors.accent }]}>
                <Search size={16} color={colors.textInverse} />
              </View>
              <Sparkle size={14} color={colors.accent} style={[styles.sparkle, { top: 4, left: 4 }]} />
              <Sparkle size={12} color={colors.warning} style={[styles.sparkle, { top: 20, right: -4 }]} />
              <Sparkle size={10} color={colors.accent} style={[styles.sparkle, { bottom: 10, left: -10 }]} />
            </View>

            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No orders yet</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              When customers place orders, they will appear here.
            </Text>

            <Button
              label="Go to Products"
              onPress={() => navigation.navigate(ROUTES.PRODUCTS)}
              leftIcon={<ShoppingBag size={18} color={colors.buttonPrimaryText} />}
              style={styles.emptyButton}
            />
          </Card>
        ) : (
          <Card style={styles.activityCard}>
            {sortedOrders.map((order: Order, index) => (
              <View key={order._id}>
                <Pressable style={styles.orderRow} onPress={() => goToOrder(order._id)}>
                  <View style={styles.orderRowInfo}>
                    <Text style={[styles.orderRowTitle, { color: colors.textPrimary }]}>
                      #{order.orderNumber}
                    </Text>
                    <Text style={[styles.orderRowMeta, { color: colors.textSecondary }]}>
                      {order.customer.name} · ₹{order.total.toFixed(0)}
                    </Text>
                    {order.fulfillment.rider && (
                      <View style={styles.orderRowRider}>
                        <Bike size={12} color={colors.success} />
                        <Text style={[styles.orderRowRiderLabel, { color: colors.success }]} numberOfLines={1}>
                          {order.fulfillment.rider.name}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Badge
                    label={order.fulfillment.sellerStatus}
                    tone={STATUS_TONE[order.fulfillment.sellerStatus]}
                  />
                  <ChevronRight size={20} color={colors.textLight} />
                </Pressable>
                {index < sortedOrders.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                )}
              </View>
            ))}
          </Card>
        )}

        {recentOrders.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent activity</Text>
              <Pressable onPress={() => mainStack?.navigate(ROUTES.ORDER_ACTIVITY)}>
                <Text style={[styles.viewAll, { color: colors.textLink }]}>View all</Text>
              </Pressable>
            </View>

            <Card style={styles.activityCard}>
              {recentOrders.map((order, index) => (
                <View key={order._id}>
                  <Pressable style={styles.activityRow} onPress={() => goToOrder(order._id)}>
                    <View style={[styles.activityIcon, { backgroundColor: `${colors.info}20` }]}>
                      <Package size={20} color={colors.info} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>
                        Order #{order.orderNumber} — {order.fulfillment.sellerStatus}
                      </Text>
                      <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>
                        {timeAgo(order.createdAt)}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={colors.textLight} />
                  </Pressable>
                  {index < recentOrders.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                  )}
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>

      <BottomSheet visible={sortSheetOpen} onClose={() => setSortSheetOpen(false)}>
        <Text style={[styles.sortSheetTitle, { color: colors.textPrimary }]}>Sort orders by</Text>
        {SORT_OPTIONS.map(option => {
          const isSelected = option.key === sortBy;
          return (
            <Pressable
              key={option.key}
              onPress={() => {
                setSortBy(option.key);
                setSortSheetOpen(false);
              }}
              style={styles.sortOptionRow}
            >
              <Text
                style={[
                  styles.sortOptionLabel,
                  { color: isSelected ? colors.accent : colors.textPrimary },
                  isSelected && { fontWeight: FontWeight.bold },
                ]}
              >
                {option.label}
              </Text>
              {isSelected && <Check size={18} color={colors.accent} />}
            </Pressable>
          );
        })}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    flexShrink: 1,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    marginTop: Spacing.xxs,
    fontSize: FontSize.sm,
  },
  statGrid: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statTile: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  statTileText: {
    flexShrink: 1,
  },
  statLabel: {
    fontSize: FontSize.xxs,
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  searchRow: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    height: '100%',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  sortLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyIconRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptySearchBadge: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
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
    maxWidth: 280,
  },
  emptyButton: {
    marginTop: Spacing.xl,
    minWidth: 200,
  },
  skeletonBlock: {
    marginBottom: Spacing.md,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  orderRowInfo: {
    flex: 1,
  },
  orderRowTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  orderRowMeta: {
    marginTop: 2,
    fontSize: FontSize.xs,
  },
  orderRowRider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  orderRowRiderLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    flexShrink: 1,
  },
  sectionHeader: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  viewAll: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  activityCard: {
    padding: 0,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  activityDescription: {
    marginTop: Spacing.xxs,
    fontSize: FontSize.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.lg + 44 + Spacing.md,
  },
  sortSheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  sortOptionLabel: {
    fontSize: FontSize.sm,
  },
});
