import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../../store/themeStore';
import { Spacing, Radius } from '../../theme/spacing';
import { FontSize, FontWeight } from '../../theme/typography';
import { useMe } from '../auth/hooks/useMe';

type Colors = ReturnType<typeof useThemeColors>['colors'];

// MRP minus the seller's discount % — sent to the backend as sellerPrice.
export const discountedPrice = (mrp: string, discountPercent: string) =>
  Math.max(0, Math.round((Number(mrp) || 0) * (1 - (Number(discountPercent) || 0) / 100)));

// The seller's discount % back from a saved product (sellerPrice is the
// source of truth; discountPercent on the product is the buyer-facing one).
export const sellerDiscountPercent = (mrp: number, sellerPrice: number) =>
  mrp > 0 ? Math.max(0, Math.round(((mrp - sellerPrice) / mrp) * 100)) : 0;

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

// Read-only price breakdown — mirrors the admin ProductForm's Pricing step.
// The commission rate comes from /seller-auth/me; the seller can't change it.
export function PricingBreakdown({
  mrp,
  discountPercent,
  colors,
}: {
  mrp: string;
  discountPercent: string;
  colors: Colors;
}) {
  const me = useMe();
  const commissionRate = me.data?.seller.effectiveCommissionRate ?? 0;

  const sellerPrice = discountedPrice(mrp, discountPercent);
  const commission = Math.round((sellerPrice * commissionRate) / 100);

  const rows: [string, string][] = [
    ['Discounted price', rupees(sellerPrice)],
    [`Vaymp commission (${commissionRate}%)`, `− ${rupees(commission)}`],
  ];

  return (
    <View style={[styles.box, { backgroundColor: colors.grey100 }]}>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
        </View>
      ))}
      <View style={[styles.row, styles.total, { borderTopColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Cost price (you get)</Text>
        <Text style={[styles.totalValue, { color: colors.textPrimary }]}>
          {rupees(sellerPrice - commission)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: FontSize.sm,
  },
  value: {
    fontSize: FontSize.sm,
  },
  total: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  totalValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
});
