import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { Screen } from '../../../components/layout/Screen';
import { AppHeader } from '../../../components/layout/AppHeader';
import { FormScrollView } from '../../../components/layout/FormScrollView';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { FieldLabel, CountedInput } from '../../../components/forms/ProductFormFields';
import { useThemeColors } from '../../../store/themeStore';
import { useToast } from '../../../components/feedback/Toast';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import type { MainStackParamList } from '../../../navigation/routeConfig';
import { ProductSelector } from '../ProductSelector';
import {
  createBogoOffer,
  createTierOffer,
  getOffer,
  updateBogoOffer,
  updateTierOffer,
  type OfferScope,
  type OfferType,
} from '../offers.api';

type Route = RouteProp<MainStackParamList, 'DealForm'>;
type TierType = Exclude<OfferType, 'bogo'>;

const TIER_TYPES: { type: TierType; label: string }[] = [
  { type: 'tier_amount', label: '₹ off' },
  { type: 'tier_percentage', label: '% off' },
  { type: 'free_shipping', label: 'Free shipping' },
];

const idOf = (p: string | { _id: string }) => (typeof p === 'string' ? p : p._id);
const num = (v: string) => (v.trim() === '' ? null : Number(v));

// Seller-app port of admin's pages/deals/BogoOfferForm + SpendThresholdOfferForm
// (same sections and validation, see admin offer.schema.ts). Admin-only
// settings — offer priority and promo banners — are left to admin.
export function DealFormScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { kind, offerId, productId } = useRoute<Route>().params;
  const isBogo = kind === 'bogo';
  const isEdit = !!offerId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<OfferScope>(productId || isBogo ? 'selected_products' : 'entire_shop');
  const [products, setProducts] = useState<string[]>(productId ? [productId] : []);
  // BOGO
  const [buyQuantity, setBuyQuantity] = useState('1');
  const [getQuantity, setGetQuantity] = useState('1');
  const [freeProductIds, setFreeProductIds] = useState<string[]>([]);
  const [maximumFreeItems, setMaximumFreeItems] = useState('');
  // Tier
  const [tierType, setTierType] = useState<TierType>('tier_amount');
  const [minSpend, setMinSpend] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [maximumDiscount, setMaximumDiscount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  // Schedule
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

  const offerQuery = useQuery({
    queryKey: ['seller-offers', 'detail', offerId],
    queryFn: () => getOffer(offerId!),
    enabled: isEdit,
  });

  useEffect(() => {
    const o = offerQuery.data;
    if (!o) return;
    setTitle(o.title);
    setDescription(o.description ?? '');
    setScope(o.scope);
    setProducts(o.products.map(idOf));
    setBuyQuantity(String(o.buyQuantity ?? 1));
    setGetQuantity(String(o.getQuantity ?? 1));
    setFreeProductIds((o.freeProductIds ?? []).map(idOf));
    setMaximumFreeItems(o.maximumFreeItems != null ? String(o.maximumFreeItems) : '');
    if (o.type !== 'bogo') setTierType(o.type);
    setMinSpend(o.minSpend != null ? String(o.minSpend) : '');
    setDiscountAmount(o.discountAmount ? String(o.discountAmount) : '');
    setDiscountPercent(o.discountPercent ? String(o.discountPercent) : '');
    setMaximumDiscount(o.maximumDiscount != null ? String(o.maximumDiscount) : '');
    setMaxUses(o.maxUses != null ? String(o.maxUses) : '');
    setStartDate(o.startDate.slice(0, 10));
    setEndDate(o.endDate.slice(0, 10));
    setIsEnabled(o.isEnabled);
  }, [offerQuery.data]);

  // Same rules as admin's offer.schema.ts.
  const validate = (): string | null => {
    if (title.trim().length < 2) return 'Enter an offer title';
    if (scope === 'selected_products' && products.length === 0) return 'Select at least one qualifying product';
    if (isBogo) {
      if (!(Number(buyQuantity) >= 1) || !(Number(getQuantity) >= 1)) return 'Buy and get quantities must be at least 1';
      if (freeProductIds.length === 0) return 'Select at least one free product';
    } else {
      if (minSpend.trim() === '' || !(Number(minSpend) >= 0)) return 'Enter the minimum spend';
      if (tierType === 'tier_amount' && !(Number(discountAmount) > 0)) return 'Discount amount must be greater than 0';
      if (tierType === 'tier_percentage' && !(Number(discountPercent) > 0 && Number(discountPercent) <= 100))
        return 'Discount percent must be between 1 and 100';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return 'Enter start and end dates as YYYY-MM-DD';
    if (!(new Date(endDate) > new Date(startDate))) return 'End date must be after start date';
    return null;
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const common = {
        title: title.trim(),
        description: description.trim(),
        scope,
        products: scope === 'entire_shop' ? [] : products,
        isEnabled,
        startDate,
        endDate,
      };
      if (isBogo) {
        const payload = {
          ...common,
          buyQuantity: Number(buyQuantity),
          getQuantity: Number(getQuantity),
          getDiscountPercent: 100,
          freeProductIds,
          maximumFreeItems: num(maximumFreeItems),
        };
        return isEdit ? updateBogoOffer(offerId!, payload) : createBogoOffer(payload);
      }
      const payload = {
        ...common,
        type: tierType,
        minSpend: Number(minSpend),
        discountAmount: tierType === 'tier_amount' ? Number(discountAmount) : 0,
        discountPercent: tierType === 'tier_percentage' ? Number(discountPercent) : 0,
        maximumDiscount: tierType === 'tier_percentage' ? num(maximumDiscount) : null,
        maxUses: num(maxUses),
      };
      return isEdit ? updateTierOffer(offerId!, payload) : createTierOffer(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller-offers'] });
      void queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast.show({ type: 'success', title: isEdit ? 'Deal updated' : 'Deal created' });
      navigation.goBack();
    },
    onError: (error: Error) =>
      toast.show({ type: 'error', title: isEdit ? "Couldn't update deal" : "Couldn't create deal", message: error.message }),
  });

  const save = () => {
    const error = validate();
    if (error) {
      toast.show({ type: 'error', title: error });
      return;
    }
    saveMutation.mutate();
  };

  const section = (heading: string, hint?: string) => (
    <View style={styles.sectionHead}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{heading}</Text>
      {!!hint && <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text>}
    </View>
  );

  const choice = (label: string, hint: string, selected: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={[styles.choice, { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accent10 : 'transparent' }]}
    >
      <Text style={[styles.choiceLabel, { color: colors.textPrimary }]}>{label}</Text>
      {!!hint && <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text>}
    </Pressable>
  );

  const title_ = `${isEdit ? 'Edit' : 'New'} ${isBogo ? 'BOGO offer' : 'Spend deal'}`;

  if (isEdit && offerQuery.isLoading) {
    return (
      <Screen>
        <AppHeader title={title_} onBack={() => navigation.goBack()} />
        <View style={styles.content}>
          <Skeleton width="100%" height={160} radius={Radius.lg} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title={title_} onBack={() => navigation.goBack()} />
      <FormScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          {section('Offer details')}
          <FieldLabel label="Offer title" required colors={colors} />
          <CountedInput
            value={title}
            onChangeText={setTitle}
            placeholder={isBogo ? 'e.g. Buy 2 Get 1 FREE' : 'e.g. Spend ₹999 get ₹100 off'}
            maxLength={80}
            colors={colors}
          />
          <FieldLabel label="Description" colors={colors} />
          <CountedInput value={description} onChangeText={setDescription} placeholder="Optional" maxLength={300} multiline colors={colors} />
        </Card>

        {!isBogo && (
          <Card style={styles.card}>
            {section('Deal rule')}
            <View style={styles.choiceRow}>
              {TIER_TYPES.map(t => choice(t.label, '', tierType === t.type, () => setTierType(t.type)))}
            </View>
            <FieldLabel label="Minimum spend (₹)" required colors={colors} />
            <CountedInput value={minSpend} onChangeText={setMinSpend} placeholder="e.g. 999" maxLength={8} keyboardType="number-pad" colors={colors} />
            {tierType === 'tier_amount' && (
              <>
                <FieldLabel label="Discount amount (₹)" required colors={colors} />
                <CountedInput value={discountAmount} onChangeText={setDiscountAmount} placeholder="e.g. 100" maxLength={8} keyboardType="number-pad" colors={colors} />
              </>
            )}
            {tierType === 'tier_percentage' && (
              <>
                <FieldLabel label="Discount (%)" required colors={colors} />
                <CountedInput value={discountPercent} onChangeText={setDiscountPercent} placeholder="e.g. 10" maxLength={3} keyboardType="number-pad" colors={colors} />
                <FieldLabel label="Maximum discount (₹)" colors={colors} />
                <CountedInput value={maximumDiscount} onChangeText={setMaximumDiscount} placeholder="No cap" maxLength={8} keyboardType="number-pad" colors={colors} />
              </>
            )}
            <FieldLabel label="Usage limit" colors={colors} />
            <CountedInput value={maxUses} onChangeText={setMaxUses} placeholder="Unlimited" maxLength={6} keyboardType="number-pad" colors={colors} />
            <Text style={[styles.preview, { backgroundColor: colors.accent10, color: colors.textPrimary }]}>
              Preview: Spend ₹{minSpend || 0} →{' '}
              {tierType === 'tier_amount' ? `₹${discountAmount || 0} off` : tierType === 'tier_percentage' ? `${discountPercent || 0}% off` : 'Free shipping'}
            </Text>
          </Card>
        )}

        <Card style={styles.card}>
          {section('Qualifying products', 'Which of your products this deal applies to.')}
          <View style={styles.choiceRow}>
            {choice('Entire shop', 'Every eligible product, including ones added later.', scope === 'entire_shop', () => setScope('entire_shop'))}
            {choice('Specific products', 'Only the products you select below.', scope === 'selected_products', () => setScope('selected_products'))}
          </View>
          {scope === 'selected_products' && <ProductSelector selectedIds={products} onChange={setProducts} />}
        </Card>

        {isBogo && (
          <>
            <Card style={styles.card}>
              {section('BOGO rule')}
              <View style={styles.choiceRow}>
                <View style={styles.flex}>
                  <FieldLabel label="Buy quantity" required colors={colors} />
                  <CountedInput value={buyQuantity} onChangeText={setBuyQuantity} placeholder="1" maxLength={3} keyboardType="number-pad" colors={colors} />
                </View>
                <View style={styles.flex}>
                  <FieldLabel label="Get quantity (FREE)" required colors={colors} />
                  <CountedInput value={getQuantity} onChangeText={setGetQuantity} placeholder="1" maxLength={3} keyboardType="number-pad" colors={colors} />
                </View>
              </View>
              <Text style={[styles.preview, { backgroundColor: colors.accent10, color: colors.textPrimary }]}>
                Preview: Buy {buyQuantity || 0} → Get {getQuantity || 0} FREE
              </Text>
            </Card>

            <Card style={styles.card}>
              {section('Free products', 'Products the customer can pick as their FREE item — shown to them as suggested items.')}
              <ProductSelector selectedIds={freeProductIds} onChange={setFreeProductIds} />
            </Card>

            <Card style={styles.card}>
              {section('Limits')}
              <FieldLabel label="Maximum free items per order" colors={colors} />
              <CountedInput value={maximumFreeItems} onChangeText={setMaximumFreeItems} placeholder="No limit" maxLength={4} keyboardType="number-pad" colors={colors} />
            </Card>
          </>
        )}

        <Card style={styles.card}>
          {section('Schedule')}
          <View style={styles.choiceRow}>
            <View style={styles.flex}>
              <FieldLabel label="Start date" required colors={colors} />
              <CountedInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" maxLength={10} colors={colors} />
            </View>
            <View style={styles.flex}>
              <FieldLabel label="End date" required colors={colors} />
              <CountedInput value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" maxLength={10} colors={colors} />
            </View>
          </View>
          <View style={[styles.enabledRow, { borderColor: colors.border }]}>
            <View style={styles.flex}>
              <Text style={[styles.choiceLabel, { color: colors.textPrimary }]}>Enabled</Text>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>Turn off to pause the deal without deleting it.</Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={setIsEnabled}
              trackColor={{ false: colors.buttonSecondaryBg, true: colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        <View style={styles.choiceRow}>
          <Button label="Cancel" variant="outline" onPress={() => navigation.goBack()} style={styles.flex} />
          <Button label={isEdit ? 'Save changes' : 'Create offer'} onPress={save} loading={saveMutation.isPending} style={styles.flex} />
        </View>
      </FormScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  card: { gap: Spacing.sm },
  sectionHead: { gap: 2, marginBottom: Spacing.xs },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 0.6, textTransform: 'uppercase' },
  hint: { fontSize: FontSize.xs },
  choiceRow: { flexDirection: 'row', gap: Spacing.sm },
  choice: { flex: 1, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: 2 },
  choiceLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  preview: { borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  enabledRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.sm },
  flex: { flex: 1 },
});
