import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BadgeCheck,
  ChevronRight,
  CircleX,
  IndianRupee,
  Package,
  Percent,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Wallet,
} from 'lucide-react-native';

import { useThemeColors } from '../../store/themeStore';
import { Spacing, Radius } from '../../theme/spacing';
import { FontSize, FontWeight } from '../../theme/typography';
import type { NotificationType, SellerNotification } from './notifications.api';

type Colors = ReturnType<typeof useThemeColors>['colors'];

export const GROUPS = ['All', 'Orders', 'Products', 'Finance', 'System'] as const;
export type Group = (typeof GROUPS)[number];

// Mirrors models/Notification.js's NOTIFICATION_TYPES enum on the
// backend — each type maps to a display icon/tint/badge and a coarser
// tab group. No "Support"/"Offers" tab exists because those aren't real
// notification types yet; "offer_expiring" surfaces as a System-grouped
// "Offers" badge instead of inventing a tab with nothing else in it.
export const TYPE_META: Record<
  NotificationType,
  { icon: typeof ShoppingBag; tint: (c: Colors) => string; badge: string; group: Group }
> = {
  new_order: { icon: ShoppingBag, tint: c => c.accent, badge: 'Orders', group: 'Orders' },
  order_cancelled: { icon: CircleX, tint: c => c.error, badge: 'Orders', group: 'Orders' },
  return_request: { icon: RotateCcw, tint: c => c.info, badge: 'Orders', group: 'Orders' },
  product_approved: {
    icon: BadgeCheck,
    tint: c => c.success,
    badge: 'Products',
    group: 'Products',
  },
  product_rejected: { icon: CircleX, tint: c => c.error, badge: 'Products', group: 'Products' },
  low_stock: { icon: Package, tint: c => c.warning, badge: 'Inventory', group: 'Products' },
  out_of_stock: { icon: Package, tint: c => c.error, badge: 'Inventory', group: 'Products' },
  payout_completed: { icon: Wallet, tint: c => c.accent, badge: 'Finance', group: 'Finance' },
  refund_update: { icon: IndianRupee, tint: c => c.info, badge: 'Finance', group: 'Finance' },
  verification_update: {
    icon: ShieldCheck,
    tint: c => c.accent,
    badge: 'System',
    group: 'System',
  },
  offer_expiring: { icon: Percent, tint: c => c.error, badge: 'Offers', group: 'System' },
};

export function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function NotificationRow({
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

const styles = StyleSheet.create({
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
});
