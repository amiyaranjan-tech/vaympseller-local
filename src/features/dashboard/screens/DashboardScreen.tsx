import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Bell,
  ChartColumnIncreasing,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  IndianRupee,
  LayoutGrid,
  Package,
  Plus,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { BottomSheet } from '../../../components/common/BottomSheet';
import { useThemeColors } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useToast } from '../../../components/feedback/Toast';
import { useMe } from '../../auth/hooks/useMe';
import { updateShopStatus } from '../../shop/shop.api';
import { useUnreadNotificationsCount } from '../../notifications/useUnreadCount';
import { getProducts } from '../../products/products.api';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import {
  ROUTES,
  type MainStackParamList,
  type MainTabParamList,
} from '../../../navigation/routeConfig';

function StatTile({
  icon,
  tint,
  value,
  label,
  caption,
  captionColor,
}: {
  icon: React.ReactNode;
  tint: string;
  value: number;
  label: string;
  caption: string;
  captionColor: string;
}) {
  const { colors } = useThemeColors();
  return (
    <Card style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: `${tint}20` }]}>
        {icon}
      </View>
      <Text style={[styles.tileValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.tileCaption, { color: captionColor }]}>{caption}</Text>
    </Card>
  );
}

// ponytail: no /seller/dashboard endpoint exists yet (see the "Coming
// soon" chart card below), so picking a period only changes the caption
// text on the Revenue/Orders tiles for now — the values themselves stay
// the seller's all-time totals. Wire this to real period-scoped numbers
// once that endpoint lands.
const PERIOD_OPTIONS = ['Today', '3 Days', 'This Week', 'This Month', 'Last 6 Months'] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

type DashboardNav = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

export function DashboardScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<DashboardNav>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const seller = useAuthStore(state => state.seller);
  const updateSeller = useAuthStore(state => state.updateSeller);
  const role = useAuthStore(state => state.role);
  const isOwner = role === 'owner';
  const unreadCount = useUnreadNotificationsCount(isOwner);
  const meQuery = useMe();

  const [period, setPeriod] = useState<Period>('This Month');
  const [periodOpen, setPeriodOpen] = useState(false);

  // seller.products (from the seller profile) is a stored counter nothing
  // in the backend ever increments on create/delete — it's permanently
  // stale. The real count, same way ProductsScreen.tsx gets its own tab
  // counts: a limit:1 list call, reading pagination.total.
  const productsCountQuery = useQuery({
    queryKey: ['seller-products', 'count', 'all'],
    queryFn: () => getProducts({ limit: 1 }),
    staleTime: 30000,
  });

  const isRefreshing = meQuery.isRefetching || productsCountQuery.isRefetching;
  const onRefresh = () => {
    void meQuery.refetch();
    void productsCountQuery.refetch();
  };

  const shopName = seller?.shopName ?? 'your shop';
  const isOpen = seller?.shopStatus === 'open';

  const shopStatusMutation = useMutation({
    mutationFn: (nextOpen: boolean) =>
      updateShopStatus({ shopStatusMode: 'manual', shopStatus: nextOpen ? 'open' : 'closed' }),
    onSuccess: updated => {
      updateSeller(updated);
      void queryClient.invalidateQueries({ queryKey: ['seller-auth', 'me'] });
      toast.show({
        type: 'success',
        title: updated.shopStatus === 'open' ? 'Shop is now open' : 'Shop is now closed',
      });
    },
    onError: (error: Error) => {
      toast.show({ type: 'error', title: "Couldn't update shop status", message: error.message });
    },
  });

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.greetingSmall, { color: colors.textSecondary }]}>
              Welcome back,
            </Text>
            <Text
              style={[styles.greeting, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {shopName} 👋
            </Text>
          </View>

          <View style={styles.headerActions}>
            <View
              style={[
                styles.openPill,
                { backgroundColor: isOpen ? colors.success10 : colors.neutral10 },
              ]}
            >
              <Text
                style={[styles.openLabel, { color: isOpen ? colors.success : colors.neutral }]}
              >
                {isOpen ? 'OPEN' : 'CLOSED'}
              </Text>
              <Switch
                value={isOpen}
                onValueChange={next => shopStatusMutation.mutate(next)}
                disabled={shopStatusMutation.isPending}
                trackColor={{ false: colors.buttonSecondaryBg, true: colors.success }}
                thumbColor="#FFFFFF"
                style={styles.shopSwitch}
              />
            </View>

            {isOwner && (
              <Pressable
                onPress={() =>
                  navigation
                    .getParent<NativeStackNavigationProp<MainStackParamList>>()
                    ?.navigate(ROUTES.NOTIFICATIONS)
                }
                style={[styles.bellButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Bell size={20} color={colors.textPrimary} />
                {unreadCount > 0 && (
                  <View style={[styles.bellDot, { backgroundColor: colors.warning }]} />
                )}
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.warning10 }]}>
              <LayoutGrid size={16} color={colors.warning} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
          </View>
          <Pressable onPress={() => setPeriodOpen(true)} style={styles.periodButton}>
            <Text style={[styles.periodButtonLabel, { color: colors.textSecondary }]}>
              {period}
            </Text>
            {periodOpen ? (
              <ChevronUp size={16} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={16} color={colors.textSecondary} />
            )}
          </Pressable>
        </View>

        <View style={styles.grid}>
          {isOwner && (
            <StatTile
              icon={<IndianRupee size={20} color={colors.success} />}
              tint={colors.success}
              value={seller?.revenue ?? 0}
              label="Revenue"
              caption={`-- vs ${period.toLowerCase()}`}
              captionColor={colors.textSecondary}
            />
          )}
          <StatTile
            icon={<ShoppingBag size={20} color={colors.info} />}
            tint={colors.info}
            value={seller?.orders ?? 0}
            label="Orders"
            caption={`-- vs ${period.toLowerCase()}`}
            captionColor={colors.textSecondary}
          />
          <StatTile
            icon={<Package size={20} color={colors.fulfillmentProcessing} />}
            tint={colors.fulfillmentProcessing}
            value={productsCountQuery.data?.pagination.total ?? 0}
            label="Products"
            caption="-- total products"
            captionColor={colors.fulfillmentProcessing}
          />
          <StatTile
            icon={<RotateCcw size={20} color={colors.warning} />}
            tint={colors.warning}
            value={seller?.returns ?? 0}
            label="Returns"
            caption="-- total returns"
            captionColor={colors.warning}
          />
        </View>

        <View
          style={[
            styles.growCard,
            { backgroundColor: `${colors.accent}14`, borderColor: `${colors.accent}30` },
          ]}
        >
          <View style={[styles.growIcon, { backgroundColor: `${colors.accent}20` }]}>
            <TrendingUp size={24} color={colors.accent} />
          </View>
          <View style={styles.growContent}>
            <Text style={[styles.growTitle, { color: colors.textPrimary }]}>
              Grow your business
            </Text>
            <Text style={[styles.growBody, { color: colors.textSecondary }]}>
              Add products, manage orders and track your sales — all in one place.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate(ROUTES.PRODUCTS)}
          style={[styles.addProductButton, { backgroundColor: `${colors.accent}20` }]}
        >
          <Text style={[styles.addProductLabel, { color: colors.accent }]}>Add Product</Text>
          <Plus size={18} color={colors.accent} />
        </Pressable>


        <Card style={styles.chartCard}>
          <View style={styles.chartText}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
              Recent orders & sales charts
            </Text>
            <Text style={[styles.chartBody, { color: colors.textSecondary }]}>
              Coming soon — waiting on the{' '}
              <Text style={{ color: colors.textLink }}>/seller/dashboard</Text> and{' '}
              <Text style={{ color: colors.textLink }}>/seller/orders</Text> endpoints.
            </Text>
          </View>
          <View style={[styles.chartGraphic, { backgroundColor: `${colors.accent}14` }]}>
            <ChartColumnIncreasing size={28} color={colors.accent} />
            <View style={[styles.chartClock, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Clock3 size={12} color={colors.textSecondary} />
            </View>
          </View>
        </Card>
      </ScrollView>

      <BottomSheet visible={periodOpen} onClose={() => setPeriodOpen(false)}>
        <Text style={[styles.periodSheetTitle, { color: colors.textPrimary }]}>Period</Text>
        {PERIOD_OPTIONS.map(option => (
          <Pressable
            key={option}
            onPress={() => {
              setPeriod(option);
              setPeriodOpen(false);
            }}
            style={styles.periodSheetRow}
          >
            <Text style={[styles.periodSheetRowLabel, { color: colors.textPrimary }]}>
              {option}
            </Text>
            {option === period && <Check size={18} color={colors.accent} />}
          </Pressable>
        ))}
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
  greetingSmall: {
    fontSize: FontSize.md,
  },
  greeting: {
    marginTop: Spacing.xxs,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xxs,
    gap: Spacing.xs,
  },
  shopSwitch: {
    transform: [{ scale: 0.75 }],
    marginRight: -Spacing.xs,
  },
  openLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.4,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  sectionHeader: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  periodButtonLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  periodSheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  periodSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  periodSheetRowLabel: {
    fontSize: FontSize.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  tileValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  tileLabel: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xxs,
  },
  tileCaption: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  growCard: {
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  growIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  growContent: {
    flex: 1,
  },
  growTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  growBody: {
    marginTop: Spacing.xxs,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  addProductButton: {
    marginTop: Spacing.md,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  addProductLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  todoCard: {
    padding: 0,
    overflow: 'hidden',
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  todoIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  todoDescription: {
    marginTop: Spacing.xxs,
    fontSize: FontSize.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.lg + 44 + Spacing.md,
  },
  chartCard: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  chartTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  chartBody: {
    marginTop: Spacing.xs,
    fontSize: FontSize.sm,
    lineHeight: 19,
  },
  chartGraphic: {
    width: 76,
    height: 76,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartClock: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
