import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  BadgeCheck,
  Bell,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  IndianRupee,
  Package,
  Percent,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Wallet,
} from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useThemeColors } from '../../../store/themeStore';
import { useToast } from '../../../components/feedback/Toast';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import type { MainStackParamList } from '../../../navigation/routeConfig';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationType,
  type SellerNotification,
} from '../notifications.api';

type Colors = ReturnType<typeof useThemeColors>['colors'];
type Nav = NativeStackNavigationProp<MainStackParamList, 'Notifications'>;

const GROUPS = ['All', 'Orders', 'Products', 'Finance', 'System'] as const;
type Group = (typeof GROUPS)[number];

// Mirrors models/Notification.js's NOTIFICATION_TYPES enum on the
// backend — each type maps to a display icon/tint/badge and a coarser
// tab group. No "Support"/"Offers" tab exists because those aren't real
// notification types yet; "offer_expiring" surfaces as a System-grouped
// "Offers" badge instead of inventing a tab with nothing else in it.
const TYPE_META: Record<
  NotificationType,
  { icon: typeof ShoppingBag; tint: (c: Colors) => string; badge: string; group: Group }
> = {
  new_order: { icon: ShoppingBag, tint: c => c.accent, badge: 'Orders', group: 'Orders' },
  order_cancelled: { icon: CircleX, tint: c => c.error, badge: 'Orders', group: 'Orders' },
  return_request: { icon: RotateCcw, tint: c => c.info, badge: 'Orders', group: 'Orders' },
  product_approved: { icon: BadgeCheck, tint: c => c.success, badge: 'Products', group: 'Products' },
  product_rejected: { icon: CircleX, tint: c => c.error, badge: 'Products', group: 'Products' },
  low_stock: { icon: Package, tint: c => c.warning, badge: 'Inventory', group: 'Products' },
  out_of_stock: { icon: Package, tint: c => c.error, badge: 'Inventory', group: 'Products' },
  payout_completed: { icon: Wallet, tint: c => c.accent, badge: 'Finance', group: 'Finance' },
  refund_update: { icon: IndianRupee, tint: c => c.info, badge: 'Finance', group: 'Finance' },
  verification_update: { icon: ShieldCheck, tint: c => c.accent, badge: 'System', group: 'System' },
  offer_expiring: { icon: Percent, tint: c => c.error, badge: 'Offers', group: 'System' },
};

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function NotificationRow({
  item,
  colors,
  onPress,
}: {
  item: SellerNotification;
  colors: Colors;
  onPress: () => void;
}) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  const tint = meta.tint(colors);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: item.isRead ? colors.card : colors.accent10,
          borderColor: item.isRead ? colors.border : `${colors.accent}30`,
        },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: `${tint}20` }]}>
        <Icon size={22} color={tint} />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTopLine}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <Text style={[styles.rowMessage, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.message}
        </Text>
        <View style={[styles.rowBadge, { backgroundColor: colors.accent10 }]}>
          <Text style={[styles.rowBadgeLabel, { color: colors.accent }]}>{meta.badge}</Text>
        </View>
      </View>
      <View style={styles.rowMeta}>
        <Text style={[styles.rowTime, { color: colors.textLight }]}>{timeAgo(item.createdAt)}</Text>
        {!item.isRead ? (
          <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
        ) : (
          <ChevronRight size={18} color={colors.textLight} />
        )}
      </View>
    </Pressable>
  );
}

export function NotificationsScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<Nav>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [group, setGroup] = useState<Group>('All');

  const query = useQuery({
    queryKey: ['seller-notifications', 'list'],
    queryFn: () => getNotifications({ limit: 100 }),
  });

  const items = query.data?.items ?? [];
  const unreadCount = items.filter(n => !n.isRead).length;
  const filtered = group === 'All' ? items : items.filter(n => TYPE_META[n.type].group === group);

  const groupCounts: Record<Group, number> = {
    All: items.length,
    Orders: items.filter(n => TYPE_META[n.type].group === 'Orders').length,
    Products: items.filter(n => TYPE_META[n.type].group === 'Products').length,
    Finance: items.filter(n => TYPE_META[n.type].group === 'Finance').length,
    System: items.filter(n => TYPE_META[n.type].group === 'System').length,
  };

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['seller-notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller-notifications'] });
      toast.show({ type: 'success', title: 'All notifications marked read' });
    },
    onError: (error: Error) => {
      toast.show({ type: 'error', title: "Couldn't update notifications", message: error.message });
    },
  });

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
          <Text style={[styles.title, { color: colors.textPrimary }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Stay updated on your shop activity
          </Text>
        </View>
        {unreadCount > 0 ? (
          <Pressable
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            style={[styles.markAllButton, { borderColor: colors.accent }]}
          >
            <CircleCheck size={15} color={colors.accent} />
            <Text style={[styles.markAllLabel, { color: colors.accent }]}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupTabs} contentContainerStyle={styles.groupTabsContent}>
        {GROUPS.map(g => {
          const isActive = g === group;
          return (
            <Pressable
              key={g}
              onPress={() => setGroup(g)}
              style={[
                styles.groupPill,
                { backgroundColor: isActive ? colors.accent : colors.card, borderColor: isActive ? colors.accent : colors.border },
              ]}
            >
              <Text style={[styles.groupPillLabel, { color: isActive ? colors.textInverse : colors.textPrimary }]}>
                {g}
              </Text>
              <View
                style={[
                  styles.groupCount,
                  { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.grey200 },
                ]}
              >
                <Text style={[styles.groupCountLabel, { color: isActive ? colors.textInverse : colors.textSecondary }]}>
                  {groupCounts[g]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {query.isLoading ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2, 3].map(i => (
              <Skeleton key={i} width="100%" height={92} radius={Radius.lg} style={{ marginBottom: Spacing.md }} />
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent10 }]}>
              <Bell size={32} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No notifications</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              {group === 'All'
                ? "You're all caught up — new activity will show up here."
                : `No ${group.toLowerCase()} notifications right now.`}
            </Text>
          </View>
        ) : (
          filtered.map(item => (
            <NotificationRow
              key={item._id}
              item={item}
              colors={colors}
              onPress={() => {
                if (!item.isRead) markReadMutation.mutate(item._id);
              }}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginTop: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    marginTop: 2,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 36,
  },
  markAllLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  groupTabs: {
    marginTop: Spacing.lg,
    flexGrow: 0,
  },
  groupTabsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  groupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 36,
  },
  groupPillLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  groupCount: {
    minWidth: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  groupCountLabel: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  skeletonList: {
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  rowMessage: {
    marginTop: 2,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  rowBadge: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  rowBadgeLabel: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semibold,
  },
  rowMeta: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  rowTime: {
    fontSize: FontSize.xxs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
  },
  emptyIcon: {
    width: 72,
    height: 72,
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
    marginTop: Spacing.xs,
    fontSize: FontSize.sm,
    textAlign: 'center',
    maxWidth: 260,
  },
});
