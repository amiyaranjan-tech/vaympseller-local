import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { useThemeColors } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useMe } from '../../auth/hooks/useMe';
import { Spacing } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';

// Real seller data (revenue/orders/returns/refunds/products are all
// verified fields on the seller-auth response) rendered as stat tiles —
// no dashboard.api call here since /seller/dashboard's contract isn't
// confirmed yet (see features/dashboard/dashboard.api.ts stub). useMe()
// keeps this in sync with the server on mount.
function StatTile({ label, value }: { label: string; value: number }) {
  const { colors } = useThemeColors();
  return (
    <Card style={styles.tile}>
      <Text style={[styles.tileValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>{label}</Text>
    </Card>
  );
}

export function DashboardScreen() {
  const { colors } = useThemeColors();
  const seller = useAuthStore(state => state.seller);
  useMe();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textPrimary }]}>
            Welcome, {seller?.shopName ?? 'Seller'}
          </Text>
          <Badge label={seller?.shopStatus ?? 'closed'} tone={seller?.shopStatus === 'open' ? 'success' : 'neutral'} />
        </View>

        <View style={styles.grid}>
          <StatTile label="Revenue" value={seller?.revenue ?? 0} />
          <StatTile label="Orders" value={seller?.orders ?? 0} />
          <StatTile label="Products" value={seller?.products ?? 0} />
          <StatTile label="Returns" value={seller?.returns ?? 0} />
        </View>

        <Card style={styles.placeholder}>
          <Text style={[styles.placeholderTitle, { color: colors.textPrimary }]}>
            Recent orders & sales charts
          </Text>
          <Text style={[styles.placeholderBody, { color: colors.textSecondary }]}>
            Coming soon — waiting on the /seller/dashboard and /seller/orders
            endpoints.
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    flexShrink: 1,
    marginRight: Spacing.sm,
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
  tileValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  tileLabel: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xxs,
  },
  placeholder: {
    marginTop: Spacing.lg,
  },
  placeholderTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  placeholderBody: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
});
