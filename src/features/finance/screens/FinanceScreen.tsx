import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  Download,
  FileText,
  Info,
  Landmark,
  Percent,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { useThemeColors } from '../../../store/themeStore';
import { useToast } from '../../../components/feedback/Toast';
import { useAuthStore } from '../../../store/useAuthStore';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';

type Colors = ReturnType<typeof useThemeColors>['colors'];

// No /seller/finance endpoint exists yet (see MainNavigator.tsx's own
// comment) — every figure here is a zero placeholder except Commission
// Rate, which is already cached on the seller profile from login/useMe.
const OVERVIEW_DEFS = [
  { key: 'balance', label: 'Available Balance', icon: Wallet, tint: (c: Colors) => c.success },
  { key: 'pending', label: 'Pending Payout', icon: Clock3, tint: (c: Colors) => c.info },
  { key: 'payouts', label: 'Total Payouts', icon: CreditCard, tint: (c: Colors) => c.warning },
] as const;

const SUMMARY_ROWS = [
  { key: 'sales', label: 'Product Sales', dot: (c: Colors) => c.success, negative: false },
  { key: 'shipping', label: 'Shipping Charges', dot: (c: Colors) => c.info, negative: false },
  { key: 'other', label: 'Other Income', dot: (c: Colors) => c.warning, negative: false },
] as const;

const DEDUCTION_ROWS = [
  { key: 'returns', label: 'Returns & Refunds', dot: (c: Colors) => c.error, negative: true },
  { key: 'adjustments', label: 'Adjustments', dot: (c: Colors) => c.fulfillmentProcessing, negative: false },
] as const;

export function FinanceScreen() {
  const { colors } = useThemeColors();
  const toast = useToast();
  const seller = useAuthStore(state => state.seller);
  const commissionRate = seller?.commissionRate ?? 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Finance</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Track your earnings and payouts
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={[styles.pillButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Download size={16} color={colors.textPrimary} />
              <Text style={[styles.pillButtonLabel, { color: colors.textPrimary }]}>Statement</Text>
            </Pressable>
            <Pressable style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <CircleHelp size={18} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.heroCard, { backgroundColor: colors.accent, borderColor: `${colors.accent}30` }]}>
          <View style={styles.heroTextBlock}>
            <Text style={[styles.heroLabel, { color: colors.textInverse }]}>Total Earnings</Text>
            <Text style={[styles.heroValue, { color: colors.textInverse }]}>₹0.00</Text>
            <Text style={[styles.heroCaption, { color: `${colors.textInverse}99` }]}>
              -- vs last 7 days
            </Text>
            <Pressable style={[styles.heroButton, { borderColor: colors.textInverse }]}>
              <TrendingUp size={16} color={colors.textInverse} />
              <Text style={[styles.heroButtonLabel, { color: colors.textInverse }]}>
                View Earnings Report
              </Text>
              <ChevronRight size={16} color={colors.textInverse} />
            </Pressable>
          </View>
          <View style={[styles.heroIconRing, { backgroundColor: `${colors.textInverse}14` }]}>
            <Wallet size={40} color={colors.textInverse} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.xl }]}>
          Account Overview
        </Text>
        <Card style={styles.overviewCard}>
          <View style={styles.overviewGrid}>
            {OVERVIEW_DEFS.map(def => {
              const Icon = def.icon;
              const tint = def.tint(colors);
              return (
                <View key={def.key} style={styles.overviewItem}>
                  <View style={[styles.overviewIcon, { backgroundColor: `${tint}20` }]}>
                    <Icon size={18} color={tint} />
                  </View>
                  <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>₹0.00</Text>
                  <View style={styles.overviewLabelRow}>
                    <Text style={[styles.overviewLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                      {def.label}
                    </Text>
                    <Info size={11} color={colors.textLight} />
                  </View>
                </View>
              );
            })}
            <View style={styles.overviewItem}>
              <View style={[styles.overviewIcon, { backgroundColor: colors.accent10 }]}>
                <Percent size={18} color={colors.accent} />
              </View>
              <Text style={[styles.overviewValue, { color: colors.textPrimary }]}>
                {commissionRate ?? 0}%
              </Text>
              <View style={styles.overviewLabelRow}>
                <Text style={[styles.overviewLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                  Commission Rate
                </Text>
                <Info size={11} color={colors.textLight} />
              </View>
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Earnings Summary</Text>
            <Pressable style={styles.periodPicker}>
              <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>This Month</Text>
              <ChevronDown size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          {SUMMARY_ROWS.map(row => (
            <View key={row.key} style={styles.summaryRow}>
              <View style={styles.summaryLabelRow}>
                <View style={[styles.summaryDot, { backgroundColor: row.dot(colors) }]} />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{row.label}</Text>
              </View>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>₹0.00</Text>
            </View>
          ))}

          <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />

          {DEDUCTION_ROWS.map(row => (
            <View key={row.key} style={styles.summaryRow}>
              <View style={styles.summaryLabelRow}>
                <View style={[styles.summaryDot, { backgroundColor: row.dot(colors) }]} />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{row.label}</Text>
              </View>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                {row.negative ? '- ₹0.00' : '₹0.00'}
              </Text>
            </View>
          ))}

          <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.netLabel, { color: colors.textPrimary }]}>Net Earnings</Text>
            <Text style={[styles.netValue, { color: colors.success }]}>₹0.00</Text>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Payouts</Text>
          <Text style={[styles.viewAll, { color: colors.textLink }]}>View all</Text>
        </View>
        <Card style={styles.emptyCard}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.accent10 }]}>
            <Landmark size={28} color={colors.accent} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No payouts yet</Text>
          <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
            Your payout history will appear here.
          </Text>
          <Button
            label="Learn about payouts"
            variant="outline"
            onPress={() =>
              toast.show({
                type: 'info',
                title: 'Payouts',
                message: 'Payout scheduling details will show here once payouts are live.',
              })
            }
            leftIcon={<Info size={16} color={colors.accent} />}
            style={styles.emptyButton}
          />
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
          <Text style={[styles.viewAll, { color: colors.textLink }]}>View all</Text>
        </View>
        <Card style={styles.emptyCard}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.grey100 }]}>
            <FileText size={28} color={colors.textLight} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No transactions yet</Text>
          <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
            Your transactions will appear here.
          </Text>
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
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 40,
  },
  pillButtonLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroTextBlock: {
    flex: 1,
  },
  heroLabel: {
    fontSize: FontSize.sm,
    opacity: 0.8,
  },
  heroValue: {
    marginTop: Spacing.xs,
    fontSize: FontSize.display,
    fontWeight: FontWeight.bold,
  },
  heroCaption: {
    marginTop: Spacing.xxs,
    fontSize: FontSize.xs,
  },
  heroButton: {
    marginTop: Spacing.lg,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  heroButtonLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  heroIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  overviewCard: {
    marginTop: Spacing.md,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  overviewItem: {
    width: '50%',
    marginBottom: Spacing.lg,
  },
  overviewIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  overviewValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  overviewLabelRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  overviewLabel: {
    fontSize: FontSize.xs,
  },
  section: {
    marginTop: Spacing.lg,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  periodPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  periodLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
  },
  summaryValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.xs,
  },
  netLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  netValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  sectionHeader: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAll: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  emptyBody: {
    marginTop: Spacing.xs,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: Spacing.lg,
    minWidth: 200,
  },
});
