import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  Bell,
  CircleCheck,
  CircleX,
  ClipboardList,
  Clock3,
  Filter,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkle,
  SlidersHorizontal,
  TrendingUp,
  Truck,
  ChevronRight,
} from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { useThemeColors } from '../../../store/themeStore';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import { ROUTES, type MainTabParamList } from '../../../navigation/routeConfig';

type Colors = ReturnType<typeof useThemeColors>['colors'];

// No /seller/orders endpoint exists yet (see MainNavigator.tsx's own
// comment on this) — every count/list here is a zero placeholder, same
// convention as Dashboard/Products/Shop until that contract lands.
const STAT_DEFS = [
  { key: 'total', label: 'Total', icon: ShoppingBag, tint: (c: Colors) => c.info },
  { key: 'pending', label: 'Pending', icon: Clock3, tint: (c: Colors) => c.warning },
  { key: 'processing', label: 'Processing', icon: Truck, tint: (c: Colors) => c.success },
  { key: 'shipped', label: 'Shipped', icon: Package, tint: (c: Colors) => c.fulfillmentProcessing },
  { key: 'delivered', label: 'Delivered', icon: CircleCheck, tint: (c: Colors) => c.success },
  { key: 'cancelled', label: 'Cancelled', icon: CircleX, tint: (c: Colors) => c.error },
] as const;

const ACTIVITY_ROWS = [
  {
    key: 'new-orders',
    icon: ShoppingCart,
    tint: (c: Colors) => c.success,
    title: 'No new orders',
    description: "You're all caught up!",
  },
  {
    key: 'update-status',
    icon: Truck,
    tint: (c: Colors) => c.warning,
    title: 'Update order status',
    description: 'Keep customers informed about their orders.',
  },
  {
    key: 'enable-notifications',
    icon: Bell,
    tint: (c: Colors) => c.fulfillmentProcessing,
    title: 'Enable notifications',
    description: 'Get notified for new orders and updates.',
  },
] as const;

type OrdersNav = BottomTabNavigationProp<MainTabParamList, 'Orders'>;

export function OrdersScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<OrdersNav>();

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
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>0</Text>
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
          <Pressable style={[styles.tipButton, { backgroundColor: colors.accent10 }]}>
            <Text style={[styles.tipButtonLabel, { color: colors.accent }]}>Learn more</Text>
          </Pressable>
        </View>

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

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent activity</Text>
          <Text style={[styles.viewAll, { color: colors.textLink }]}>View all</Text>
        </View>

        <Card style={styles.activityCard}>
          {ACTIVITY_ROWS.map((row, index) => {
            const Icon = row.icon;
            const tint = row.tint(colors);
            return (
              <View key={row.key}>
                <View style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: `${tint}20` }]}>
                    <Icon size={20} color={tint} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>{row.title}</Text>
                    <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>
                      {row.description}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.textLight} />
                </View>
                {index < ACTIVITY_ROWS.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                )}
              </View>
            );
          })}
        </Card>
      </ScrollView>
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
});
