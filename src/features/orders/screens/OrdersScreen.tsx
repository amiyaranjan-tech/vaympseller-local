import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  CircleCheck,
  CircleX,
  ClipboardList,
  Clock3,
  Filter,
  MessageCircle,
  Package,
  PackageCheck,
  Search,
  ShoppingBag,
  Sparkle,
  SlidersHorizontal,
  TrendingUp,
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

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const HAPPY_CUSTOMER_TIPS = [
  {
    key: 'confirm-fast',
    icon: CircleCheck,
    tint: (c: Colors) => c.success,
    title: 'Confirm orders quickly',
    description: 'Accept new orders within a few hours so customers aren’t left waiting.',
  },
  {
    key: 'update-status',
    icon: Truck,
    tint: (c: Colors) => c.warning,
    title: 'Update status at every step',
    description: 'Move orders through Processing → Shipped → Delivered as they actually happen.',
  },
  {
    key: 'communicate-delays',
    icon: MessageCircle,
    tint: (c: Colors) => c.info,
    title: 'Communicate delays early',
    description: 'A heads-up about a delay builds more trust than a late delivery does damage.',
  },
  {
    key: 'pack-securely',
    icon: PackageCheck,
    tint: (c: Colors) => c.fulfillmentProcessing,
    title: 'Package items securely',
    description: 'Fewer damaged-in-transit returns means fewer refunds and better ratings.',
  },
  {
    key: 'respond-queries',
    icon: MessageCircle,
    tint: (c: Colors) => c.success,
    title: 'Respond to queries fast',
    description: 'Quick replies to order questions reduce cancellations.',
  },
  {
    key: 'keep-stock-accurate',
    icon: Package,
    tint: (c: Colors) => c.error,
    title: 'Keep stock accurate',
    description: 'Out-of-stock cancellations after purchase are the fastest way to lose trust.',
  },
] as const;

type OrdersNav = BottomTabNavigationProp<MainTabParamList, 'Orders'>;

export function OrdersScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<OrdersNav>();
  const mainStack = navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();
  const [tipsSheetOpen, setTipsSheetOpen] = useState(false);

  const ordersQuery = useQuery({
    queryKey: ['seller-orders', 'list'],
    queryFn: () => getOrders({ limit: 100 }),
  });

  const orders = ordersQuery.data?.items ?? [];

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
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Orders</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage and fulfill customer orders
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Search size={18} color={colors.textPrimary} />
            </Pressable>
            <Pressable style={[styles.filterButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Filter size={16} color={colors.textPrimary} />
              <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Filter</Text>
              <View style={[styles.filterDot, { backgroundColor: colors.warning }]} />
            </Pressable>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statRow}>
          {STAT_DEFS.map(def => {
            const Icon = def.icon;
            const tint = def.tint(colors);
            return (
              <View key={def.key} style={[styles.statTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statIcon, { backgroundColor: `${tint}20` }]}>
                  <Icon size={18} color={tint} />
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{def.label}</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{counts[def.key]}</Text>
                <View style={[styles.statUnderline, { backgroundColor: tint }]} />
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
            <Search size={18} color={colors.inputPlaceholder} />
            <TextInput
              placeholder="Search orders by ID, customer or product..."
              placeholderTextColor={colors.inputPlaceholder}
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
          </View>
          <Pressable style={[styles.sortButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
            <SlidersHorizontal size={16} color={colors.textPrimary} />
            <Text style={[styles.sortLabel, { color: colors.textPrimary }]}>Sort</Text>
          </Pressable>
        </View>

        <View style={[styles.tipBanner, { backgroundColor: colors.accent10, borderColor: `${colors.accent}30` }]}>
          <View style={[styles.tipIcon, { backgroundColor: colors.accent }]}>
            <TrendingUp size={20} color={colors.textInverse} />
          </View>
          <View style={styles.tipContent}>
            <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>Keep your customers happy</Text>
            <Text style={[styles.tipBody, { color: colors.textSecondary }]}>
              Update order status on time to build trust and get more sales.
            </Text>
          </View>
          <Pressable
            onPress={() => setTipsSheetOpen(true)}
            style={[styles.tipButton, { backgroundColor: colors.accent10 }]}
          >
            <Text style={[styles.tipButtonLabel, { color: colors.accent }]}>Learn more</Text>
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
            {orders.map((order: Order, index) => (
              <View key={order._id}>
                <Pressable style={styles.orderRow} onPress={() => goToOrder(order._id)}>
                  <View style={styles.orderRowInfo}>
                    <Text style={[styles.orderRowTitle, { color: colors.textPrimary }]}>
                      #{order.orderNumber}
                    </Text>
                    <Text style={[styles.orderRowMeta, { color: colors.textSecondary }]}>
                      {order.customer.name} · ₹{order.total.toFixed(0)}
                    </Text>
                  </View>
                  <Badge
                    label={order.fulfillment.sellerStatus}
                    tone={STATUS_TONE[order.fulfillment.sellerStatus]}
                  />
                  <ChevronRight size={20} color={colors.textLight} />
                </Pressable>
                {index < orders.length - 1 && (
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

      <BottomSheet visible={tipsSheetOpen} onClose={() => setTipsSheetOpen(false)}>
        <ScrollView style={styles.tipsSheetScroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.tipsSheetTitle, { color: colors.textPrimary }]}>
            Keep your customers happy
          </Text>
          <Text style={[styles.tipsSheetSubtitle, { color: colors.textSecondary }]}>
            A few habits that build trust and get you more repeat sales.
          </Text>

          {HAPPY_CUSTOMER_TIPS.map(tip => {
            const Icon = tip.icon;
            const tint = tip.tint(colors);
            return (
              <View key={tip.key} style={styles.tipsSheetRow}>
                <View style={[styles.tipsSheetIcon, { backgroundColor: `${tint}20` }]}>
                  <Icon size={18} color={tint} />
                </View>
                <View style={styles.tipsSheetContent}>
                  <Text style={[styles.tipsSheetRowTitle, { color: colors.textPrimary }]}>
                    {tip.title}
                  </Text>
                  <Text style={[styles.tipsSheetRowDescription, { color: colors.textSecondary }]}>
                    {tip.description}
                  </Text>
                </View>
              </View>
            );
          })}

          <Button label="Got it" onPress={() => setTipsSheetOpen(false)} style={styles.tipsSheetButton} />
        </ScrollView>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 40,
  },
  filterLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statRow: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  statTile: {
    width: 84,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSize.xxs,
  },
  statValue: {
    marginTop: 2,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  statUnderline: {
    marginTop: Spacing.sm,
    width: '60%',
    height: 2,
    borderRadius: 1,
  },
  searchRow: {
    marginTop: Spacing.lg,
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
  tipBanner: {
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  tipContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  tipTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  tipBody: {
    marginTop: 2,
    fontSize: FontSize.xs,
    lineHeight: 17,
  },
  tipButton: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  tipButtonLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  emptyCard: {
    marginTop: Spacing.lg,
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
    marginTop: Spacing.lg,
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
  tipsSheetScroll: {
    maxHeight: 560,
  },
  tipsSheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  tipsSheetSubtitle: {
    marginTop: Spacing.xxs,
    marginBottom: Spacing.lg,
    fontSize: FontSize.sm,
  },
  tipsSheetRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  tipsSheetIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  tipsSheetContent: {
    flex: 1,
  },
  tipsSheetRowTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  tipsSheetRowDescription: {
    marginTop: 2,
    fontSize: FontSize.xs,
    lineHeight: 17,
  },
  tipsSheetButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
});
