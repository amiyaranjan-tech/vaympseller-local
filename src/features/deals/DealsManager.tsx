import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pencil, Percent, Plus, ShoppingBag, Tag, Trash2, Truck } from 'lucide-react-native';

import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/feedback/Skeleton';
import { useThemeColors } from '../../store/themeStore';
import { useToast } from '../../components/feedback/Toast';
import { useAuthStore } from '../../store/useAuthStore';
import { Spacing, Radius } from '../../theme/spacing';
import { FontSize, FontWeight } from '../../theme/typography';
import { ROUTES, type MainStackParamList } from '../../navigation/routeConfig';
import { deleteOffer, getOffers, updateOfferStatus, type Offer, type OfferType } from './offers.api';

type Colors = ReturnType<typeof useThemeColors>['colors'];
type Nav = NativeStackNavigationProp<MainStackParamList>;

export const DEAL_TYPE_META: Record<OfferType, { label: string; icon: typeof Tag; tint: (c: Colors) => string }> = {
  bogo: { label: 'BOGO', icon: ShoppingBag, tint: c => c.fulfillmentProcessing },
  tier_amount: { label: 'Spend deal (₹ off)', icon: Tag, tint: c => c.warning },
  tier_percentage: { label: 'Spend deal (% off)', icon: Percent, tint: c => c.success },
  free_shipping: { label: 'Free shipping', icon: Truck, tint: c => c.info },
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Same "live right now" rule as admin's isOfferActiveNow.
const isActiveNow = (o: Offer) => {
  const now = Date.now();
  return o.isEnabled && new Date(o.startDate).getTime() <= now && now <= new Date(o.endDate).getTime();
};

function dealRule(o: Offer): string {
  if (o.type === 'bogo') return `Buy ${o.buyQuantity ?? 1} → Get ${o.getQuantity ?? 1} FREE`;
  const spend = `Spend ₹${(o.minSpend ?? 0).toLocaleString('en-IN')} → `;
  const used = o.maxUses != null ? ` · ${o.usedCount}/${o.maxUses} used` : '';
  if (o.type === 'tier_amount') return `${spend}₹${o.discountAmount ?? 0} off${used}`;
  if (o.type === 'tier_percentage')
    return `${spend}${o.discountPercent ?? 0}% off${o.maximumDiscount != null ? ` (max ₹${o.maximumDiscount})` : ''}${used}`;
  return `${spend}Free shipping${used}`;
}

// Mutations + navigation shared by every deal list.
function useDealActions() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigation = useNavigation<Nav>();
  const isOwner = useAuthStore(state => state.role) === 'owner';
  const done = (title: string) => {
    void queryClient.invalidateQueries({ queryKey: ['seller-offers'] });
    void queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    toast.show({ type: 'success', title });
  };
  const fail = (title: string) => (error: Error) => toast.show({ type: 'error', title, message: error.message });

  const toggle = useMutation({
    mutationFn: (o: Offer) => updateOfferStatus(o._id, !o.isEnabled),
    onSuccess: () => done('Deal updated'),
    onError: fail("Couldn't update deal"),
  });
  const remove = useMutation({
    mutationFn: (o: Offer) => deleteOffer(o._id),
    onSuccess: () => done('Deal deleted'),
    onError: fail("Couldn't delete deal"),
  });

  return {
    isOwner,
    busy: toggle.isPending || remove.isPending,
    toggle: (o: Offer) => toggle.mutate(o),
    remove: (o: Offer) =>
      Alert.alert('Delete this deal?', "This can't be undone.", [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(o) },
      ]),
    edit: (o: Offer) => navigation.navigate(ROUTES.DEAL_FORM, { kind: o.type === 'bogo' ? 'bogo' : 'tier', offerId: o._id }),
    add: (kind: 'bogo' | 'tier', productId?: string) => navigation.navigate(ROUTES.DEAL_FORM, { kind, productId }),
  };
}

// Admin-style offer card: rule, scope, free pool, usage, schedule, status.
function OfferCard({ offer, actions }: { offer: Offer; actions: ReturnType<typeof useDealActions> }) {
  const { colors } = useThemeColors();
  const meta = DEAL_TYPE_META[offer.type];
  const Icon = meta.icon;
  const tint = meta.tint(colors);
  const readOnly = !actions.isOwner || !!offer.createdBy;
  const freeCount = offer.freeProductIds?.length ?? 0;
  const lines = [
    dealRule(offer),
    offer.scope === 'entire_shop' ? 'Entire shop' : `Specific products · ${plural(offer.products.length, 'product')}`,
    offer.type === 'bogo' ? `Free pool · ${freeCount > 0 ? plural(freeCount, 'product') : 'Automatic'}` : null,
    offer.type === 'bogo' && offer.maximumFreeItems != null ? `Max ${plural(offer.maximumFreeItems, 'free item')} per order` : null,
    `${formatDate(offer.startDate)} → ${formatDate(offer.endDate)}`,
    offer.createdBy ? 'Set by Vaymp' : null,
  ].filter(Boolean) as string[];

  return (
    <Card style={styles.offerCard}>
      <View style={styles.offerTop}>
        <View style={[styles.offerIcon, { backgroundColor: `${tint}20` }]}>
          <Icon size={20} color={tint} />
        </View>
        <View style={styles.flex}>
          <View style={styles.titleRow}>
            <Text style={[styles.offerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {offer.title}
            </Text>
            <Badge label={isActiveNow(offer) ? 'Active' : 'Inactive'} tone={isActiveNow(offer) ? 'success' : 'neutral'} />
          </View>
          {lines.map((line, i) => (
            <Text key={i} style={[styles.offerMeta, { color: i === 0 ? colors.textPrimary : colors.textSecondary }]}>
              {line}
            </Text>
          ))}
        </View>
        {!readOnly && (
          <Switch
            value={offer.isEnabled}
            onValueChange={() => actions.toggle(offer)}
            disabled={actions.busy}
            trackColor={{ false: colors.buttonSecondaryBg, true: colors.accent }}
            thumbColor="#FFFFFF"
          />
        )}
      </View>
      {!readOnly && (
        <View style={styles.offerButtons}>
          <Pressable onPress={() => actions.edit(offer)} disabled={actions.busy} style={[styles.smallButton, { borderColor: colors.border }]}>
            <Pencil size={14} color={colors.textPrimary} />
            <Text style={[styles.smallLabel, { color: colors.textPrimary }]}>Edit</Text>
          </Pressable>
          <Pressable onPress={() => actions.remove(offer)} disabled={actions.busy} style={styles.smallButton}>
            <Trash2 size={14} color={colors.error} />
            <Text style={[styles.smallLabel, { color: colors.error }]}>Delete</Text>
          </Pressable>
        </View>
      )}
    </Card>
  );
}

export function useSellerOffers() {
  return useQuery({ queryKey: ['seller-offers', 'list'], queryFn: () => getOffers({ limit: 100 }) });
}

// A list of offers with an optional "Create" button — used by each Deals
// screen tab and by a product's own Deals tab.
export function OfferList({
  offers,
  loading,
  emptyText,
  addButtons,
}: {
  offers: Offer[];
  loading: boolean;
  emptyText: string;
  addButtons: { label: string; kind: 'bogo' | 'tier'; productId?: string }[];
}) {
  const { colors } = useThemeColors();
  const actions = useDealActions();

  return (
    <View style={styles.list}>
      {actions.isOwner &&
        addButtons.map(b => (
          <Pressable key={b.label} onPress={() => actions.add(b.kind, b.productId)} style={[styles.addButton, { borderColor: colors.accent }]}>
            <Plus size={16} color={colors.accent} />
            <Text style={[styles.addLabel, { color: colors.accent }]}>{b.label}</Text>
          </Pressable>
        ))}
      {loading ? (
        <>
          <Skeleton width="100%" height={110} radius={Radius.lg} />
          <Skeleton width="100%" height={110} radius={Radius.lg} />
        </>
      ) : offers.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>{emptyText}</Text>
      ) : (
        offers.map(o => <OfferCard key={o._id} offer={o} actions={actions} />)
      )}
    </View>
  );
}

// A product's own Deals tab: its deals plus shop-wide ones.
export function DealsManager({ productId, header }: { productId: string; header?: React.ReactNode }) {
  const query = useSellerOffers();
  const offers = (query.data?.items ?? []).filter(
    o => o.scope === 'entire_shop' || o.products.some(p => p._id === productId),
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {header}
      <OfferList
        offers={offers}
        loading={query.isLoading}
        emptyText="No deals on this product yet. Add a BOGO or spend deal to boost sales."
        addButtons={[
          { label: 'Add BOGO deal', kind: 'bogo', productId },
          { label: 'Add spend deal', kind: 'tier', productId },
        ]}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  list: { gap: Spacing.md, marginTop: Spacing.md },
  flex: { flex: 1 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
  },
  addLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  empty: { textAlign: 'center', fontSize: FontSize.sm, marginTop: Spacing.lg },
  offerCard: { gap: Spacing.sm },
  offerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  offerIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
  offerTitle: { flexShrink: 1, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  offerMeta: { fontSize: FontSize.xs, lineHeight: 17 },
  offerButtons: { flexDirection: 'row', gap: Spacing.sm },
  smallButton: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'transparent', borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  smallLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
});
