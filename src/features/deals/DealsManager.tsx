import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Percent, Plus, ShoppingBag, Tag, Trash2, Truck } from 'lucide-react-native';

import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { BottomSheet } from '../../components/common/BottomSheet';
import { Badge } from '../../components/common/Badge';
import { Skeleton } from '../../components/feedback/Skeleton';
import { FieldLabel, CountedInput } from '../../components/forms/ProductFormFields';
import { UnverifiedGateModal } from '../../components/common/UnverifiedGateModal';
import { useThemeColors } from '../../store/themeStore';
import { useToast } from '../../components/feedback/Toast';
import { useSellerAccess } from '../../hooks/useSellerAccess';
import { useAuthStore } from '../../store/useAuthStore';
import { Spacing, Radius } from '../../theme/spacing';
import { FontSize, FontWeight } from '../../theme/typography';
import { getProducts } from '../products/products.api';
import {
  getOffers,
  createBogoOffer,
  updateBogoOffer,
  createTierOffer,
  updateTierOffer,
  updateOfferStatus,
  deleteOffer,
  type Offer,
  type OfferType,
} from './offers.api';

type Colors = ReturnType<typeof useThemeColors>['colors'];

export const DEAL_TYPE_META: Record<OfferType, { label: string; icon: typeof Tag; tint: (c: Colors) => string }> = {
  bogo: { label: 'Buy One Get One', icon: ShoppingBag, tint: c => c.fulfillmentProcessing },
  tier_amount: { label: 'Spend & Save (₹ off)', icon: Tag, tint: c => c.warning },
  tier_percentage: { label: 'Spend & Save (% off)', icon: Percent, tint: c => c.success },
  free_shipping: { label: 'Free Shipping', icon: Truck, tint: c => c.info },
};

function dealTerms(offer: Offer): string {
  switch (offer.type) {
    case 'bogo':
      return `Buy ${offer.buyQuantity ?? 1} get ${offer.getQuantity ?? 1} at ${offer.getDiscountPercent ?? 100}% off`;
    case 'tier_amount':
      return `Spend ₹${offer.minSpend ?? 0}, get ₹${offer.discountAmount ?? 0} off`;
    case 'tier_percentage':
      return `Spend ₹${offer.minSpend ?? 0}, get ${offer.discountPercent ?? 0}% off`;
    case 'free_shipping':
      return `Free shipping above ₹${offer.minSpend ?? 0}`;
  }
}

function OfferRow({
  offer,
  colors,
  onToggle,
  onEdit,
  onDelete,
  busy,
  readOnly,
}: {
  offer: Offer;
  colors: Colors;
  onToggle: (offer: Offer) => void;
  onEdit: (offer: Offer) => void;
  onDelete: (offer: Offer) => void;
  busy: boolean;
  readOnly: boolean;
}) {
  const meta = DEAL_TYPE_META[offer.type];
  const Icon = meta.icon;
  const tint = meta.tint(colors);

  return (
    <Card style={styles.offerCard}>
      <View style={[styles.offerIcon, { backgroundColor: `${tint}20` }]}>
        <Icon size={20} color={tint} />
      </View>
      <View style={styles.offerInfo}>
        <Text style={[styles.offerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {offer.title}
        </Text>
        <Text style={[styles.offerMeta, { color: colors.textSecondary }]} numberOfLines={2}>
          {dealTerms(offer)}
        </Text>
        <Badge label={meta.label} tone="neutral" />
      </View>
      {/* View-only: admin-set deals (createdBy = admin), or a helper (only the owner may change deals). */}
      {readOnly ? (
        <Badge label={offer.isEnabled ? 'Active' : 'Inactive'} tone={offer.isEnabled ? 'success' : 'neutral'} />
      ) : (
      <View style={styles.offerActions}>
        <Switch
          value={offer.isEnabled}
          onValueChange={() => onToggle(offer)}
          disabled={busy}
          trackColor={{ false: colors.buttonSecondaryBg, true: colors.accent }}
          thumbColor="#FFFFFF"
        />
        <View style={styles.offerIconActions}>
          <Pressable onPress={() => onEdit(offer)} disabled={busy} hitSlop={8}>
            <Pencil size={17} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => onDelete(offer)} disabled={busy} hitSlop={8}>
            <Trash2 size={17} color={colors.error} />
          </Pressable>
        </View>
      </View>
      )}
    </Card>
  );
}

const DEAL_TYPE_OPTIONS: { type: OfferType; label: string; description: string; icon: typeof Tag }[] = [
  { type: 'bogo', label: 'Buy One Get One', description: 'Buy X, get Y free or discounted', icon: ShoppingBag },
  { type: 'tier_amount', label: 'Spend & Save (₹ off)', description: 'Spend over an amount, get a flat discount', icon: Tag },
  { type: 'tier_percentage', label: 'Spend & Save (% off)', description: 'Spend over an amount, get a % discount', icon: Percent },
  { type: 'free_shipping', label: 'Free Shipping', description: 'Free shipping above a spend threshold', icon: Truck },
];

// Add / list / toggle / edit / delete deals. With `productId` (a product's
// Deals tab) it shows that product's deals plus shop-wide ones and new
// deals target that product; without it (Offers screen) it shows every
// deal and new deals cover the whole shop.
export function DealsManager({ productId, header }: { productId?: string; header?: React.ReactNode }) {
  const { colors } = useThemeColors();
  const { isVerified } = useSellerAccess();
  const isOwner = useAuthStore(state => state.role) === 'owner';
  const [showUnverifiedGate, setShowUnverifiedGate] = useState(false);
  const onNeedsVerification = () => setShowUnverifiedGate(true);
  const toast = useToast();
  const queryClient = useQueryClient();

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<OfferType | null>(null);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  const offersQuery = useQuery({
    queryKey: ['seller-offers', 'list'],
    queryFn: () => getOffers({ limit: 100 }),
  });

  const productOffers = (offersQuery.data?.items ?? []).filter(
    offer => !productId || offer.scope === 'entire_shop' || offer.products.some(p => p._id === productId),
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['seller-offers'] });
  };

  const toggleMutation = useMutation({
    mutationFn: (offer: Offer) => updateOfferStatus(offer._id, !offer.isEnabled),
    onSuccess: () => {
      invalidate();
      toast.show({ type: 'success', title: 'Deal updated' });
    },
    onError: (error: Error) => {
      toast.show({ type: 'error', title: "Couldn't update deal", message: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (offer: Offer) => deleteOffer(offer._id),
    onSuccess: () => {
      invalidate();
      toast.show({ type: 'success', title: 'Deal removed' });
    },
    onError: (error: Error) => {
      toast.show({ type: 'error', title: "Couldn't remove deal", message: error.message });
    },
  });

  const openAddSheet = () => {
    if (!isVerified) {
      onNeedsVerification();
      return;
    }
    setEditingOffer(null);
    setSelectedType(null);
    setAddSheetOpen(true);
  };

  const openEditSheet = (offer: Offer) => {
    if (!isVerified) {
      onNeedsVerification();
      return;
    }
    setEditingOffer(offer);
    setSelectedType(offer.type);
    setAddSheetOpen(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {header}

      {isOwner && (
        <Pressable onPress={openAddSheet} style={[styles.addDealButton, { borderColor: colors.accent }]}>
          <Plus size={16} color={colors.accent} />
          <Text style={[styles.addDealLabel, { color: colors.accent }]}>Add Deal</Text>
        </Pressable>
      )}

      {offersQuery.isLoading ? (
        <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
          <Skeleton width="100%" height={72} radius={Radius.lg} />
          <Skeleton width="100%" height={72} radius={Radius.lg} />
        </View>
      ) : productOffers.length === 0 ? (
        <Text style={[styles.emptyDealsText, { color: colors.textSecondary }]}>
          {productId
            ? 'No deals on this product yet. Add a BOGO or spend-and-save deal to boost sales.'
            : 'No deals yet. Add a shop-wide BOGO, spend-and-save or free-shipping deal to boost sales.'}
        </Text>
      ) : (
        <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
          {productOffers.map(offer => (
            <OfferRow
              key={offer._id}
              offer={offer}
              colors={colors}
              onToggle={o => toggleMutation.mutate(o)}
              onEdit={o => openEditSheet(o)}
              onDelete={o => deleteMutation.mutate(o)}
              busy={toggleMutation.isPending || deleteMutation.isPending}
              readOnly={!isOwner || !!offer.createdBy}
            />
          ))}
        </View>
      )}

      <BottomSheet
        visible={addSheetOpen}
        onClose={() => {
          setAddSheetOpen(false);
          setSelectedType(null);
          setEditingOffer(null);
        }}
      >
        {selectedType === null ? (
          <View style={styles.sheetContent}>
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Choose a deal type</Text>
            {DEAL_TYPE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <Pressable
                  key={opt.type}
                  onPress={() => setSelectedType(opt.type)}
                  style={[styles.dealTypeOption, { borderColor: colors.border }]}
                >
                  <View style={[styles.offerIcon, { backgroundColor: colors.accent10 }]}>
                    <Icon size={20} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dealTypeOptionLabel, { color: colors.textPrimary }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.dealTypeOptionDescription, { color: colors.textSecondary }]}>
                      {opt.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <DealForm
            type={selectedType}
            productId={productId}
            colors={colors}
            existingOffer={editingOffer ?? undefined}
            onBack={() => {
              if (editingOffer) {
                setAddSheetOpen(false);
                setSelectedType(null);
                setEditingOffer(null);
                return;
              }
              setSelectedType(null);
            }}
            onDone={() => {
              setAddSheetOpen(false);
              setSelectedType(null);
              setEditingOffer(null);
              invalidate();
            }}
          />
        )}
      </BottomSheet>
      <UnverifiedGateModal visible={showUnverifiedGate} onClose={() => setShowUnverifiedGate(false)} />
    </ScrollView>
  );
}

function DealForm({
  type,
  productId,
  colors,
  existingOffer,
  onBack,
  onDone,
}: {
  type: OfferType;
  productId?: string;
  colors: Colors;
  existingOffer?: Offer;
  onBack: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const isEditing = Boolean(existingOffer);

  const [title, setTitle] = useState(existingOffer?.title ?? '');
  const [startDate, setStartDate] = useState(existingOffer?.startDate.slice(0, 10) ?? '');
  const [endDate, setEndDate] = useState(existingOffer?.endDate.slice(0, 10) ?? '');
  const [buyQuantity, setBuyQuantity] = useState(String(existingOffer?.buyQuantity ?? 1));
  const [getQuantity, setGetQuantity] = useState(String(existingOffer?.getQuantity ?? 1));
  const [getDiscountPercent, setGetDiscountPercent] = useState(
    String(existingOffer?.getDiscountPercent ?? 100),
  );
  const [freeProductIds, setFreeProductIds] = useState<string[]>(existingOffer?.freeProductIds ?? []);
  const [maximumFreeItems, setMaximumFreeItems] = useState(
    existingOffer?.maximumFreeItems != null ? String(existingOffer.maximumFreeItems) : '',
  );
  const [minSpend, setMinSpend] = useState(
    existingOffer?.minSpend != null ? String(existingOffer.minSpend) : '',
  );
  const [discountAmount, setDiscountAmount] = useState(
    existingOffer?.discountAmount != null ? String(existingOffer.discountAmount) : '',
  );
  const [discountPercent, setDiscountPercent] = useState(
    existingOffer?.discountPercent != null ? String(existingOffer.discountPercent) : '',
  );

  // Only needed to populate the "free / suggested item" picker below —
  // which product(s) get given away free, distinct from which product(s)
  // the offer applies to buying.
  const catalogQuery = useQuery({
    queryKey: ['seller-products', 'list-for-deal-picker'],
    queryFn: () => getProducts({ limit: 50 }),
    enabled: type === 'bogo',
  });

  const toggleFreeProduct = (id: string) => {
    setFreeProductIds(prev =>
      prev.includes(id) ? prev.filter(existing => existing !== id) : [...prev, id],
    );
  };

  // Editing keeps the deal's own scope/products; a new one targets this
  // product, or the whole shop when there's no product (Offers screen).
  const target = existingOffer
    ? { scope: existingOffer.scope, products: existingOffer.products.map(p => p._id) }
    : productId
      ? { scope: 'selected_products' as const, products: [productId] }
      : { scope: 'entire_shop' as const, products: [] as string[] };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (type === 'bogo') {
        const payload = {
          title,
          ...target,
          buyQuantity: Number(buyQuantity) || 1,
          getQuantity: Number(getQuantity) || 1,
          getDiscountPercent: Number(getDiscountPercent) || 100,
          freeProductIds: freeProductIds.length > 0 ? freeProductIds : undefined,
          maximumFreeItems: maximumFreeItems.trim() ? Number(maximumFreeItems) : null,
          startDate,
          endDate,
        };
        return existingOffer
          ? updateBogoOffer(existingOffer._id, payload)
          : createBogoOffer(payload);
      }
      const payload = {
        title,
        type,
        ...target,
        minSpend: Number(minSpend) || 0,
        discountAmount: type === 'tier_amount' ? Number(discountAmount) || 0 : undefined,
        discountPercent: type === 'tier_percentage' ? Number(discountPercent) || 0 : undefined,
        startDate,
        endDate,
      };
      return existingOffer
        ? updateTierOffer(existingOffer._id, payload)
        : createTierOffer(payload);
    },
    onSuccess: () => {
      toast.show({ type: 'success', title: isEditing ? 'Deal updated' : 'Deal added' });
      onDone();
    },
    onError: (error: Error) => {
      toast.show({
        type: 'error',
        title: isEditing ? "Couldn't update deal" : "Couldn't add deal",
        message: error.message,
      });
    },
  });

  const handleSave = () => {
    if (!title.trim() || !startDate.trim() || !endDate.trim()) {
      toast.show({ type: 'error', title: 'Fill in title and dates to continue' });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <ScrollView style={styles.sheetContent} keyboardShouldPersistTaps="handled">
      <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
        {isEditing ? 'Edit ' : ''}{DEAL_TYPE_META[type].label}
      </Text>

      <FieldLabel label="Deal title" required colors={colors} />
      <CountedInput value={title} onChangeText={setTitle} placeholder="e.g. Festive BOGO" maxLength={80} colors={colors} />

      {type === 'bogo' ? (
        <View style={styles.row}>
          <View style={styles.col}>
            <FieldLabel label="Buy quantity" colors={colors} />
            <CountedInput value={buyQuantity} onChangeText={setBuyQuantity} placeholder="1" maxLength={3} keyboardType="number-pad" colors={colors} />
          </View>
          <View style={styles.col}>
            <FieldLabel label="Get quantity" colors={colors} />
            <CountedInput value={getQuantity} onChangeText={setGetQuantity} placeholder="1" maxLength={3} keyboardType="number-pad" colors={colors} />
          </View>
        </View>
      ) : (
        <FieldLabel label="Minimum spend (₹)" required colors={colors} />
      )}

      {type === 'bogo' && (
        <>
          <FieldLabel label="Discount on the free item (%)" colors={colors} />
          <CountedInput
            value={getDiscountPercent}
            onChangeText={setGetDiscountPercent}
            placeholder="100"
            maxLength={3}
            keyboardType="number-pad"
            colors={colors}
          />

          <FieldLabel label="Free / suggested item" colors={colors} />
          <Text style={[styles.freeItemHint, { color: colors.textSecondary }]}>
            Pick which product(s) the customer actually gets free. Leave everything
            unchecked to give away the same product they bought.
          </Text>
          <ScrollView
            nestedScrollEnabled
            style={[styles.freeItemList, { borderColor: colors.border }]}
          >
            {catalogQuery.isLoading ? (
              <Text style={[styles.freeItemEmpty, { color: colors.textSecondary }]}>Loading products…</Text>
            ) : (catalogQuery.data?.items.length ?? 0) === 0 ? (
              <Text style={[styles.freeItemEmpty, { color: colors.textSecondary }]}>No other products yet.</Text>
            ) : (
              catalogQuery.data!.items.map((item, index) => {
                const checked = freeProductIds.includes(item._id);
                return (
                  <Pressable
                    key={item._id}
                    onPress={() => toggleFreeProduct(item._id)}
                    style={[
                      styles.freeItemRow,
                      index > 0 && { borderTopWidth: 1, borderTopColor: colors.divider },
                    ]}
                  >
                    <View
                      style={[
                        styles.freeItemCheckbox,
                        {
                          borderColor: checked ? colors.accent : colors.inputBorder,
                          backgroundColor: checked ? colors.accent : 'transparent',
                        },
                      ]}
                    >
                      {checked && <Check size={12} color={colors.textInverse} />}
                    </View>
                    <Text
                      style={[styles.freeItemLabel, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {item.name}
                      {item._id === productId ? ' (this product)' : ''}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          <FieldLabel label="Max free items per order (optional)" colors={colors} />
          <CountedInput
            value={maximumFreeItems}
            onChangeText={setMaximumFreeItems}
            placeholder="No limit"
            maxLength={4}
            keyboardType="number-pad"
            colors={colors}
          />
        </>
      )}

      {type !== 'bogo' && (
        <CountedInput value={minSpend} onChangeText={setMinSpend} placeholder="0" maxLength={10} keyboardType="number-pad" colors={colors} />
      )}

      {type === 'tier_amount' && (
        <>
          <FieldLabel label="Discount amount (₹)" required colors={colors} />
          <CountedInput value={discountAmount} onChangeText={setDiscountAmount} placeholder="0" maxLength={10} keyboardType="number-pad" colors={colors} />
        </>
      )}

      {type === 'tier_percentage' && (
        <>
          <FieldLabel label="Discount (%)" required colors={colors} />
          <CountedInput value={discountPercent} onChangeText={setDiscountPercent} placeholder="0" maxLength={3} keyboardType="number-pad" colors={colors} />
        </>
      )}

      <View style={styles.row}>
        <View style={styles.col}>
          <FieldLabel label="Start date" required colors={colors} />
          <CountedInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" maxLength={10} colors={colors} />
        </View>
        <View style={styles.col}>
          <FieldLabel label="End date" required colors={colors} />
          <CountedInput value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" maxLength={10} colors={colors} />
        </View>
      </View>

      <View style={styles.row}>
        <Button label={isEditing ? 'Cancel' : 'Back'} variant="outline" onPress={onBack} style={styles.footerButton} />
        <Button
          label={isEditing ? 'Save Changes' : 'Add Deal'}
          onPress={handleSave}
          loading={saveMutation.isPending}
          style={styles.footerButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  col: {
    flex: 1,
  },
  footerButton: {
    flex: 1,
  },
  addDealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
  },
  addDealLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  emptyDealsText: {
    marginTop: Spacing.xl,
    textAlign: 'center',
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  offerInfo: {
    flex: 1,
    gap: Spacing.xxs,
  },
  offerTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  offerMeta: {
    fontSize: FontSize.xs,
  },
  offerActions: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  offerIconActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sheetContent: {
    paddingBottom: Spacing.lg,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  dealTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dealTypeOptionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  dealTypeOptionDescription: {
    marginTop: 1,
    fontSize: FontSize.xs,
  },
  freeItemHint: {
    marginBottom: Spacing.sm,
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  freeItemList: {
    borderWidth: 1,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
    maxHeight: 180,
    overflow: 'hidden',
  },
  freeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  freeItemCheckbox: {
    width: 18,
    height: 18,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeItemLabel: {
    flex: 1,
    fontSize: FontSize.sm,
  },
  freeItemEmpty: {
    padding: Spacing.md,
    fontSize: FontSize.xs,
  },
});
