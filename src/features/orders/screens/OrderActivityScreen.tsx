import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft,
  CircleCheck,
  CircleX,
  Clock3,
  History,
  Package,
  Truck,
} from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { useThemeColors } from '../../../store/themeStore';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import type { MainStackParamList } from '../../../navigation/routeConfig';

type Colors = ReturnType<typeof useThemeColors>['colors'];
type Nav = NativeStackNavigationProp<MainStackParamList, 'OrderActivity'>;

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_META: Record<OrderStatus, { label: string; icon: typeof Truck; tint: (c: Colors) => string }> = {
  pending: { label: 'Pending', icon: Clock3, tint: c => c.warning },
  processing: { label: 'Processing', icon: Truck, tint: c => c.success },
  shipped: { label: 'Shipped', icon: Package, tint: c => c.fulfillmentProcessing },
  delivered: { label: 'Delivered', icon: CircleCheck, tint: c => c.success },
  cancelled: { label: 'Cancelled', icon: CircleX, tint: c => c.error },
};

interface OrderActivityEntry {
  id: string;
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  updatedAt: string;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ActivityRow({ entry, colors, isLast }: { entry: OrderActivityEntry; colors: Colors; isLast: boolean }) {
  const meta = STATUS_META[entry.toStatus];
  const Icon = meta.icon;
  const tint = meta.tint(colors);

  return (
    <View>
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: `${tint}20` }]}>
          <Icon size={18} color={tint} />
        </View>
        <View style={styles.rowContent}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
            Order #{entry.orderId}
          </Text>
          <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
            {STATUS_META[entry.fromStatus].label} → {meta.label}
          </Text>
        </View>
        <Text style={[styles.rowTime, { color: colors.textLight }]}>
          {formatDateTime(entry.updatedAt)}
        </Text>
      </View>
      {!isLast && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
    </View>
  );
}

export function OrderActivityScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<Nav>();

  // No /seller/orders endpoint exists yet (see OrdersScreen.tsx's own
  // comment) — this stays an empty feed until order status changes have
  // somewhere real to come from. The row shape/rendering above is built
  // now so wiring in real data later is just filling this array in.
  const activity: OrderActivityEntry[] = [];

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
            All order status updates
          </Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activity.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent10 }]}>
              <History size={28} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No activity yet</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              Every time an order's status changes — confirmed, shipped, delivered, cancelled —
              it will show up here.
            </Text>
          </Card>
        ) : (
          <Card style={styles.listCard}>
            {activity.map((entry, index) => (
              <ActivityRow
                key={entry.id}
                entry={entry}
                colors={colors}
                isLast={index === activity.length - 1}
              />
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
  rowTime: {
    fontSize: FontSize.xxs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.lg + 40 + Spacing.md,
  },
});
