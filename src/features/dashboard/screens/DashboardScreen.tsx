import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Bell,
  ChartColumnIncreasing,
  ChevronRight,
  ClipboardList,
  Clock3,
  IndianRupee,
  LayoutGrid,
  Package,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  X,
} from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { useThemeColors } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useToast } from '../../../components/feedback/Toast';
import { useMe } from '../../auth/hooks/useMe';
import { updateShopStatus } from '../../shop/shop.api';
import { useUnreadNotificationsCount } from '../../notifications/useUnreadCount';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import {
  ROUTES,
  type MainStackParamList,
  type MainTabParamList,
} from '../../../navigation/routeConfig';

type Colors = ReturnType<typeof useThemeColors>['colors'];

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

type DashboardNav = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

export function DashboardScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<DashboardNav>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const seller = useAuthStore(state => state.seller);
  const updateSeller = useAuthStore(state => state.updateSeller);
  const unreadCount = useUnreadNotificationsCount();
  useMe();

  const shopName = seller?.shopName ?? 'your shop';
  const isOpen = seller?.shopStatus === 'open';
  const isVerified = seller?.isVerified ?? false;
  const [showVerifyInfo, setShowVerifyInfo] = useState(false);
  const [motivationDismissed, setMotivationDismissed] = useState(false);
  const verifyTint = isVerified ? colors.success : colors.warning;
  const verifyTintBg = isVerified ? colors.success10 : colors.warning10;
  const VerifyIcon = isVerified ? ShieldCheck : ShieldOff;

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
      if (updated.shopStatus === 'open') setMotivationDismissed(false);
    },
    onError: (error: Error) => {
      toast.show({ type: 'error', title: "Couldn't update shop status", message: error.message });
    },
  });

  // Re-arm the nudge every time the shop transitions to closed, so
  // dismissing it only silences the current closed stretch, not every
  // future one.
  useEffect(() => {
    if (!isOpen) setMotivationDismissed(false);
  }, [isOpen]);

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isOpen || motivationDismissed) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.5, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isOpen, motivationDismissed, pulse]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.greetingSmall, { color: colors.textSecondary }]}>
              Welcome back,
            </Text>
            <Text style={[styles.greeting, { color: colors.textPrimary }]} numberOfLines={1}>
              {shopName} 👋
            </Text>
          </View>

          <View style={styles.headerActions}>
            <View style={styles.shopToggleWrap}>
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

              {!isOpen && !motivationDismissed && (
                <Animated.View
                  style={[
                    styles.motivationCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pulse,
                    },
                  ]}
                >
                  <View style={[styles.motivationArrow, { backgroundColor: colors.card, borderColor: colors.border }]} />
                  <View style={[styles.motivationIcon, { backgroundColor: colors.warning10 }]}>
                    <Sparkles size={14} color={colors.warning} />
                  </View>
                  <View style={styles.motivationTextBlock}>
                    <Text style={[styles.motivationTitle, { color: colors.textPrimary }]}>
                      Open your shop
                    </Text>
                    <Text style={[styles.motivationBody, { color: colors.textSecondary }]}>
                      Customers can't order while you're closed. Open up to start getting sales.
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setMotivationDismissed(true)}
                    hitSlop={8}
                    style={styles.motivationClose}
                  >
                    <X size={14} color={colors.textLight} />
                  </Pressable>
                </Animated.View>
              )}
            </View>

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
          </View>
        </View>

        <View style={styles.verifyWrap}>
          <Pressable
            onPress={() => setShowVerifyInfo(v => !v)}
            style={[styles.verifyPill, { backgroundColor: verifyTintBg }]}
          >
            <VerifyIcon size={13} color={verifyTint} />
            <Text style={[styles.verifyLabel, { color: verifyTint }]}>
              {isVerified ? 'VERIFIED' : 'UNVERIFIED'}
            </Text>
          </Pressable>

          {showVerifyInfo && (
            <View
              style={[
                styles.verifyTooltip,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.verifyTooltipArrow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              />
              <Text style={[styles.verifyTooltipText, { color: colors.textSecondary }]}>
                {isVerified
                  ? 'Your shop is verified — every seller action, including adding products, is unlocked.'
                  : "Your shop isn't verified yet. Actions like adding products are locked until an admin verifies your account."}
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Here's what's happening with your shop today.
        </Text>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.warning10 }]}>
              <LayoutGrid size={16} color={colors.warning} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
          </View>
          <Text style={[styles.viewAll, { color: colors.textSecondary }]}>View all</Text>
        </View>

        <View style={styles.grid}>
          <StatTile
            icon={<IndianRupee size={20} color={colors.success} />}
            tint={colors.success}
            value={seller?.revenue ?? 0}
            label="Revenue"
            caption="-- vs yesterday"
            captionColor={colors.textSecondary}
          />
          <StatTile
            icon={<ShoppingBag size={20} color={colors.info} />}
            tint={colors.info}
            value={seller?.orders ?? 0}
            label="Orders"
            caption="-- vs yesterday"
            captionColor={colors.textSecondary}
          />
          <StatTile
            icon={<Package size={20} color={colors.fulfillmentProcessing} />}
            tint={colors.fulfillmentProcessing}
            value={seller?.products ?? 0}
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
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  shopToggleWrap: {
    zIndex: 20,
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
  motivationCard: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: Spacing.md,
    width: 230,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 6,
  },
  motivationArrow: {
    position: 'absolute',
    top: -6,
    right: Spacing.lg,
    width: 12,
    height: 12,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
  motivationIcon: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  motivationTextBlock: {
    flex: 1,
  },
  motivationTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  motivationBody: {
    marginTop: 2,
    fontSize: FontSize.xxs,
    lineHeight: 15,
  },
  motivationClose: {
    marginLeft: Spacing.xs,
    marginTop: 1,
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
  subtitle: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
  },
  verifyWrap: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    zIndex: 20,
  },
  verifyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  verifyLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.4,
  },
  verifyTooltip: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: Spacing.sm,
    width: 260,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    elevation: 6,
  },
  verifyTooltipArrow: {
    position: 'absolute',
    top: -6,
    left: Spacing.lg,
    width: 12,
    height: 12,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
  verifyTooltipText: {
    fontSize: FontSize.xs,
    lineHeight: 18,
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
  viewAll: {
    fontSize: FontSize.sm,
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
