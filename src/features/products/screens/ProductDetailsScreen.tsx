import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Box,
  ChevronLeft,
  Percent,
  ShoppingBag,
  Tag,
  Truck,
} from 'lucide-react-native';
// Icons only used by the commented-off DealForm/add-deal UI below:
// Check, Pencil, Plus, Trash2 — restore alongside that block.

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
// BottomSheet is only used by the commented-off add/edit-deal sheet below.
import { ImageCarousel } from '../../../components/common/ImageCarousel';
import { ProductImagePicker, type PickerImage } from '../../../components/common/ProductImagePicker';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { FieldLabel, CountedInput, FlagCheckbox } from '../../../components/forms/ProductFormFields';
import { useThemeColors } from '../../../store/themeStore';
import { useToast } from '../../../components/feedback/Toast';
import { useSellerAccess } from '../../../hooks/useSellerAccess';
import { UnverifiedGateModal } from '../../../components/common/UnverifiedGateModal';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import { type MainStackParamList } from '../../../navigation/routeConfig';
import { getProduct, updateProduct, type Product, type ProductPayload } from '../products.api';
// getProducts, createBogoOffer, updateBogoOffer, createTierOffer,
// updateTierOffer, updateOfferStatus, deleteOffer — only used by the
// commented-off DealForm/add-deal UI below; restore alongside that block.
import {
  getOffers,
  type Offer,
  type OfferType,
} from '../../deals/offers.api';

type Colors = ReturnType<typeof useThemeColors>['colors'];
type Nav = NativeStackNavigationProp<MainStackParamList, 'ProductDetails'>;
type Route = RouteProp<MainStackParamList, 'ProductDetails'>;

const DEAL_TYPE_META: Record<OfferType, { label: string; icon: typeof Tag; tint: (c: Colors) => string }> = {
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

// Read-only — a seller can see a deal (their own shop's or one admin set
// on this product) but never toggle/edit/remove it here. The interactive
// version (Switch + edit/delete) is commented off, not deleted:
//
//   <Switch
//     value={offer.isEnabled}
//     onValueChange={() => onToggle(offer)}
//     disabled={busy}
//     trackColor={{ false: colors.buttonSecondaryBg, true: colors.accent }}
//     thumbColor="#FFFFFF"
//   />
//   <View style={styles.offerIconActions}>
//     <Pressable onPress={() => onEdit(offer)} disabled={busy} hitSlop={8}>
//       <Pencil size={17} color={colors.textSecondary} />
//     </Pressable>
//     <Pressable onPress={() => onDelete(offer)} disabled={busy} hitSlop={8}>
//       <Trash2 size={17} color={colors.error} />
//     </Pressable>
//   </View>
function OfferRow({ offer, colors }: { offer: Offer; colors: Colors }) {
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
      <Badge label={offer.isEnabled ? 'Active' : 'Inactive'} tone={offer.isEnabled ? 'success' : 'neutral'} />
    </Card>
  );
}

// Only used by the commented-off add-deal type picker below.
// const DEAL_TYPE_OPTIONS: { type: OfferType; label: string; description: string; icon: typeof Tag }[] = [
//   { type: 'bogo', label: 'Buy One Get One', description: 'Buy X, get Y free or discounted', icon: ShoppingBag },
//   { type: 'tier_amount', label: 'Spend & Save (₹ off)', description: 'Spend over an amount, get a flat discount', icon: Tag },
//   { type: 'tier_percentage', label: 'Spend & Save (% off)', description: 'Spend over an amount, get a % discount', icon: Percent },
//   { type: 'free_shipping', label: 'Free Shipping', description: 'Free shipping above a spend threshold', icon: Truck },
// ];

// The product photo, as the first item inside each tab's own ScrollView
// (not a separately-pinned/collapsing header) — same approach the
// Consumer app's own product screen uses (a plain carousel that scrolls
// away with the rest of the content). A hand-rolled collapsing header
// (shrinking on scroll, or pinned behind an overlay) kept being janky or
// stealing touches from the carousel/badge under it; this has none of
// that — it's just normal ScrollView scrolling, so it's always smooth.
function ProductHero({
  product,
  colors,
  width,
  height,
  onDealPress,
}: {
  product: Product;
  colors: Colors;
  width: number;
  height: number;
  onDealPress?: () => void;
}) {
  return (
    <View style={[styles.heroWrap, { height }]}>
      <ImageCarousel
        images={product.images}
        width={width}
        height={height}
        fallback={
          <View style={[styles.heroImage, styles.heroImageFallback, { backgroundColor: colors.grey100 }]}>
            <Box size={32} color={colors.textLight} />
          </View>
        }
      />

      {product.dealType !== 'none' && (() => {
        const dealMeta = DEAL_TYPE_META[product.dealType];
        const DealIcon = dealMeta.icon;
        return (
          <Pressable
            onPress={onDealPress}
            disabled={!onDealPress}
            style={[styles.heroDealBadge, { backgroundColor: colors.warning }]}
          >
            <DealIcon size={13} color={colors.textInverse} />
            <Text style={styles.heroDealBadgeLabel}>{dealMeta.label}</Text>
          </Pressable>
        );
      })()}
    </View>
  );
}

export function ProductDetailsScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { isVerified } = useSellerAccess();
  const { productId } = params;
  const { width: windowWidth } = useWindowDimensions();
  const carouselWidth = windowWidth - Spacing.lg * 2;
  // Same ratio as the Consumer app's own product screen carousel
  // (src/components/products/ProductCarousel.tsx's CARD_HEIGHT = width *
  // 1.12), so a product photo reads the same size/crop in both apps.
  const carouselHeight = carouselWidth * 1.12;

  const [tab, setTab] = useState<'details' | 'deals'>(params.tab ?? 'details');
  const [showUnverifiedGate, setShowUnverifiedGate] = useState(false);

  const productQuery = useQuery({
    queryKey: ['seller-products', 'detail', productId],
    queryFn: () => getProduct(productId),
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {productQuery.data?.name ?? 'Product'}
        </Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.tabRow}>
        {(['details', 'deals'] as const).map(key => {
          const isActive = tab === key;
          return (
            <Pressable key={key} onPress={() => setTab(key)} style={styles.tabItem}>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? colors.accent : colors.textSecondary },
                  isActive && styles.tabLabelActive,
                ]}
              >
                {key === 'details' ? 'Details' : 'Deals'}
              </Text>
              {isActive && <View style={[styles.tabUnderline, { backgroundColor: colors.accent }]} />}
            </Pressable>
          );
        })}
      </View>

      {productQuery.isLoading ? (
        <View style={styles.loadingBlock}>
          <Skeleton width="100%" height={carouselHeight} radius={Radius.lg} />
        </View>
      ) : !productQuery.data ? (
        <View style={styles.loadingBlock}>
          <Text style={{ color: colors.textSecondary }}>Couldn't load this product.</Text>
        </View>
      ) : tab === 'details' ? (
        <DetailsTab
          product={productQuery.data}
          colors={colors}
          isVerified={isVerified}
          onNeedsVerification={() => setShowUnverifiedGate(true)}
          carouselWidth={carouselWidth}
          carouselHeight={carouselHeight}
          onDealPress={() => setTab('deals')}
        />
      ) : (
        <DealsTab
          product={productQuery.data}
          colors={colors}
          isVerified={isVerified}
          onNeedsVerification={() => setShowUnverifiedGate(true)}
          carouselWidth={carouselWidth}
          carouselHeight={carouselHeight}
        />
      )}

      <UnverifiedGateModal
        visible={showUnverifiedGate}
        onClose={() => setShowUnverifiedGate(false)}
      />
    </Screen>
  );
}

function DetailsTab({
  product,
  colors,
  isVerified,
  onNeedsVerification,
  carouselWidth,
  carouselHeight,
  onDealPress,
}: {
  product: Product;
  colors: Colors;
  isVerified: boolean;
  onNeedsVerification: () => void;
  carouselWidth: number;
  carouselHeight: number;
  onDealPress: () => void;
}) {
  const toast = useToast();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [tags, setTags] = useState(product.tags.join(', '));
  const [sellingPrice, setSellingPrice] = useState(String(product.sellingPrice));
  // A product created before this field existed has no sellerPrice yet —
  // fall back to its current finalPrice (what it already sells for) so
  // opening this screen never silently zeroes out its pricing on save.
  const [sellerPrice, setSellerPrice] = useState(
    String(product.sellerPrice ?? product.finalPrice),
  );
  const [isReturnable, setIsReturnable] = useState(product.isReturnable);
  const [tryAndBuy, setTryAndBuy] = useState(product.tryAndBuy);
  const [images, setImages] = useState<PickerImage[]>(product.images);

  // Re-sync local edit state whenever a fresh product loads (e.g. after
  // Save resets status server-side and refetches).
  useEffect(() => {
    setName(product.name);
    setDescription(product.description);
    setTags(product.tags.join(', '));
    setSellingPrice(String(product.sellingPrice));
    setSellerPrice(String(product.sellerPrice ?? product.finalPrice));
    setIsReturnable(product.isReturnable);
    setTryAndBuy(product.tryAndBuy);
    setImages(product.images);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product._id, product.updatedAt]);

  const yourDiscountPercent = (() => {
    const total = Number(sellingPrice) || 0;
    const seller = Number(sellerPrice) || 0;
    if (total <= 0) return 0;
    return Math.max(0, Math.round(((total - seller) / total) * 100));
  })();

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<ProductPayload>) => updateProduct(product._id, payload),
    onSuccess: updated => {
      void queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast.show({
        type: 'success',
        title: 'Product updated',
        message:
          updated.status === 'draft' && product.status !== 'draft'
            ? 'Submit for Review again to make it live once more.'
            : undefined,
      });
    },
    onError: (error: Error) => {
      toast.show({ type: 'error', title: "Couldn't save changes", message: error.message });
    },
  });

  const handleSave = () => {
    if (!isVerified) {
      onNeedsVerification();
      return;
    }
    saveMutation.mutate({
      name,
      description,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      sellingPrice: Number(sellingPrice) || 0,
      sellerPrice: Number(sellerPrice) || 0,
      isReturnable,
      tryAndBuy,
      images,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ProductHero
        product={product}
        colors={colors}
        width={carouselWidth}
        height={carouselHeight}
        onDealPress={onDealPress}
      />

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Photos</Text>
        <ProductImagePicker images={images} onChange={setImages} />
      </Card>

      <Text style={[styles.readOnlyMeta, { color: colors.textSecondary }]}>
        {[product.brand, product.gender, product.category, product.subcategory]
          .filter(Boolean)
          .join(' • ')}
      </Text>

      {product.status !== 'draft' && (
        <View style={[styles.reviewNote, { backgroundColor: colors.info10 }]}>
          <Text style={[styles.reviewNoteText, { color: colors.info }]}>
            Saving changes sends this product back to Draft — you'll need to tap Submit for
            Review again before it goes live.
          </Text>
        </View>
      )}

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Basic Information</Text>

        <FieldLabel label="Product Name" required colors={colors} />
        <CountedInput value={name} onChangeText={setName} placeholder="Enter product name" maxLength={120} colors={colors} />

        <FieldLabel label="Description" required colors={colors} />
        <CountedInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your product in detail"
          maxLength={2000}
          multiline
          colors={colors}
        />

        <FieldLabel label="Tags" colors={colors} />
        <View style={[styles.tagsField, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholder="Add tags (e.g. casual, summer)"
            placeholderTextColor={colors.inputPlaceholder}
            style={[styles.tagsInput, { color: colors.textPrimary }]}
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pricing</Text>
        <View style={styles.row}>
          <View style={styles.col}>
            <FieldLabel label="Total Price" required colors={colors} />
            <CountedInput value={sellingPrice} onChangeText={setSellingPrice} placeholder="0" maxLength={10} keyboardType="number-pad" colors={colors} />
          </View>
          <View style={styles.col}>
            <FieldLabel label="Discounted Price" required colors={colors} />
            <CountedInput value={sellerPrice} onChangeText={setSellerPrice} placeholder="0" maxLength={10} keyboardType="number-pad" colors={colors} />
          </View>
        </View>
        <View style={[styles.finalPriceRow, { borderTopColor: colors.divider }]}>
          <Text style={[styles.finalPriceLabel, { color: colors.textSecondary }]}>You get paid</Text>
          <Text style={[styles.finalPriceValue, { color: colors.textPrimary }]}>
            ₹{(Number(sellerPrice) || 0).toLocaleString('en-IN')} ({yourDiscountPercent}% off)
          </Text>
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Product Flags</Text>
        <FlagCheckbox
          title="Returnable"
          description="Customers can return this product"
          checked={isReturnable}
          onToggle={() => {
            const next = !isReturnable;
            setIsReturnable(next);
            if (!next) setTryAndBuy(false);
          }}
          colors={colors}
        />
        <FlagCheckbox
          title="Try & Buy"
          description="Allow customers to try this product before buying"
          checked={tryAndBuy}
          disabled={!isReturnable}
          onToggle={() => setTryAndBuy(v => !v)}
          colors={colors}
        />
        {!isReturnable && (
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Non-returnable products aren't eligible for Try & Buy.
          </Text>
        )}
      </Card>

      <View style={styles.footer}>
        <Button label="Cancel" variant="outline" onPress={() => navigation.goBack()} style={styles.footerButton} />
        <Button
          label="Save Changes"
          onPress={handleSave}
          loading={saveMutation.isPending}
          style={styles.footerButton}
        />
      </View>
    </ScrollView>
  );
}

function DealsTab({
  product,
  colors,
  // isVerified/onNeedsVerification are unused while add/edit is commented
  // off below — kept in the props type so the caller doesn't need to
  // change, prefixed so the linter doesn't flag them as dead.
  isVerified: _isVerified,
  onNeedsVerification: _onNeedsVerification,
  carouselWidth,
  carouselHeight,
}: {
  product: Product;
  colors: Colors;
  isVerified: boolean;
  onNeedsVerification: () => void;
  carouselWidth: number;
  carouselHeight: number;
}) {
  // Read-only for sellers: a deal on a product may have been set by admin,
  // so a seller can see it here but never add/edit/enable/remove one
  // themselves. Add/edit UI (the add-deal button, the type-picker sheet,
  // DealForm, and the toggle/edit/delete mutations) is commented off below
  // rather than deleted — see DealForm's own definition further down.

  const offersQuery = useQuery({
    queryKey: ['seller-offers', 'list'],
    queryFn: () => getOffers({ limit: 100 }),
  });

  const productOffers = (offersQuery.data?.items ?? []).filter(
    offer => offer.scope === 'entire_shop' || offer.products.some(p => p._id === product._id),
  );

  // const queryClient = useQueryClient();
  // const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['seller-offers'] });
  //
  // const toggleMutation = useMutation({
  //   mutationFn: (offer: Offer) => updateOfferStatus(offer._id, !offer.isEnabled),
  //   onSuccess: () => {
  //     invalidate();
  //     toast.show({ type: 'success', title: 'Deal updated' });
  //   },
  //   onError: (error: Error) => {
  //     toast.show({ type: 'error', title: "Couldn't update deal", message: error.message });
  //   },
  // });
  //
  // const deleteMutation = useMutation({
  //   mutationFn: (offer: Offer) => deleteOffer(offer._id),
  //   onSuccess: () => {
  //     invalidate();
  //     toast.show({ type: 'success', title: 'Deal removed' });
  //   },
  //   onError: (error: Error) => {
  //     toast.show({ type: 'error', title: "Couldn't remove deal", message: error.message });
  //   },
  // });
  //
  // const [addSheetOpen, setAddSheetOpen] = useState(false);
  // const [selectedType, setSelectedType] = useState<OfferType | null>(null);
  // const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  //
  // const openAddSheet = () => {
  //   if (!isVerified) {
  //     onNeedsVerification();
  //     return;
  //   }
  //   setEditingOffer(null);
  //   setSelectedType(null);
  //   setAddSheetOpen(true);
  // };
  //
  // const openEditSheet = (offer: Offer) => {
  //   if (!isVerified) {
  //     onNeedsVerification();
  //     return;
  //   }
  //   setEditingOffer(offer);
  //   setSelectedType(offer.type);
  //   setAddSheetOpen(true);
  // };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ProductHero product={product} colors={colors} width={carouselWidth} height={carouselHeight} />

      {/* Add Deal — seller-side deal creation is off, see comment above.
      <Pressable onPress={openAddSheet} style={[styles.addDealButton, { borderColor: colors.accent }]}>
        <Plus size={16} color={colors.accent} />
        <Text style={[styles.addDealLabel, { color: colors.accent }]}>Add Deal</Text>
      </Pressable>
      */}

      {offersQuery.isLoading ? (
        <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
          <Skeleton width="100%" height={72} radius={Radius.lg} />
          <Skeleton width="100%" height={72} radius={Radius.lg} />
        </View>
      ) : productOffers.length === 0 ? (
        <Text style={[styles.emptyDealsText, { color: colors.textSecondary }]}>
          No deals on this product yet.
        </Text>
      ) : (
        <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
          {productOffers.map(offer => (
            <OfferRow key={offer._id} offer={offer} colors={colors} />
          ))}
        </View>
      )}

      {/* Add/edit sheet — seller-side deal creation is off, see comment above.
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
            productId={product._id}
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
      */}
    </ScrollView>
  );
}

// DealForm — seller-side deal creation/editing, commented off (not
// deleted). Deals are now admin-set and read-only for sellers in the
// app (see DealsTab/OfferRow above). Re-enable by uncommenting this
// block and DealsTab's own commented add/edit sheet.
/*
function DealForm({
  type,
  productId,
  colors,
  existingOffer,
  onBack,
  onDone,
}: {
  type: OfferType;
  productId: string;
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (type === 'bogo') {
        const payload = {
          title,
          scope: 'selected_products' as const,
          products: [productId],
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
        scope: 'selected_products' as const,
        products: [productId],
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
*/

const styles = StyleSheet.create({
  helperText: {
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
    fontSize: FontSize.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    flex: 1,
    marginHorizontal: Spacing.md,
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  tabRow: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  tabItem: {
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  tabLabel: {
    fontSize: FontSize.md,
  },
  tabLabelActive: {
    fontWeight: FontWeight.semibold,
  },
  tabUnderline: {
    marginTop: Spacing.xs,
    height: 2,
    width: '100%',
    borderRadius: 1,
  },
  loadingBlock: {
    padding: Spacing.lg,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  // First item inside each tab's own ScrollView content (see
  // ProductHero) — a normal flex-flow block, not a pinned/absolute one,
  // so it just scrolls away with everything else like any other item.
  heroWrap: {
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  heroDealBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  heroDealBadgeLabel: {
    color: '#FFFFFF',
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.lg,
  },
  heroImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyMeta: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
  },
  reviewNote: {
    marginTop: Spacing.md,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  reviewNoteText: {
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  col: {
    flex: 1,
  },
  tagsField: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  tagsInput: {
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
  },
  finalPriceRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  finalPriceLabel: {
    fontSize: FontSize.sm,
  },
  finalPriceValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  footer: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    gap: Spacing.md,
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
