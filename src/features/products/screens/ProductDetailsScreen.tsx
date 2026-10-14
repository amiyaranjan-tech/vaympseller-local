import React, { useEffect, useState } from 'react';
import {
  Pressable,
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
} from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { FormScrollView } from '../../../components/layout/FormScrollView';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
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
import { PricingBreakdown, discountedPrice, sellerDiscountPercent } from '../PricingBreakdown';
import { DEAL_TYPE_META, DealsManager } from '../../deals/DealsManager';

type Colors = ReturnType<typeof useThemeColors>['colors'];
type Nav = NativeStackNavigationProp<MainStackParamList, 'ProductDetails'>;
type Route = RouteProp<MainStackParamList, 'ProductDetails'>;

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

      {product.isMassiveDeal && (
        <View style={[styles.heroMassiveDealBadge, { backgroundColor: colors.error }]}>
          <Text style={styles.heroDealBadgeLabel}>Massive Deal</Text>
        </View>
      )}

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
        <DealsManager
          productId={productQuery.data._id}
          header={<ProductHero product={productQuery.data} colors={colors} width={carouselWidth} height={carouselHeight} />}
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
  // The seller's own discount %, recovered from sellerPrice. A product
  // created before sellerPrice existed falls back to its finalPrice (what
  // it already sells for) so saving never silently changes its pricing.
  const initialDiscount = () =>
    String(sellerDiscountPercent(product.sellingPrice, product.sellerPrice ?? product.finalPrice));
  const [discountPercent, setDiscountPercent] = useState(initialDiscount);
  const [isReturnable, setIsReturnable] = useState(product.isReturnable);
  // Try & Buy is derived server-side from isReturnable; Inner Wear is never returnable.
  const isInnerWear = product.category === 'Inner Wear';
  const [images, setImages] = useState<PickerImage[]>(product.images);

  // Re-sync local edit state whenever a fresh product loads (e.g. after
  // Save resets status server-side and refetches).
  useEffect(() => {
    setName(product.name);
    setDescription(product.description);
    setTags(product.tags.join(', '));
    setSellingPrice(String(product.sellingPrice));
    setDiscountPercent(initialDiscount());
    setIsReturnable(product.isReturnable);
    setImages(product.images);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product._id, product.updatedAt]);

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
      sellerPrice: discountedPrice(sellingPrice, discountPercent),
      isReturnable: isReturnable && !isInnerWear,
      images,
    });
  };

  return (
    <FormScrollView contentContainerStyle={styles.content}>
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
            <FieldLabel label="MRP (Selling Price)" required colors={colors} />
            <CountedInput value={sellingPrice} onChangeText={setSellingPrice} placeholder="0" maxLength={10} keyboardType="number-pad" colors={colors} />
          </View>
          <View style={styles.col}>
            <FieldLabel label="Discount %" required colors={colors} />
            <CountedInput value={discountPercent} onChangeText={setDiscountPercent} placeholder="0" maxLength={3} keyboardType="number-pad" colors={colors} />
          </View>
        </View>
        <PricingBreakdown mrp={sellingPrice} discountPercent={discountPercent} colors={colors} />
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Product Flags</Text>
        <FlagCheckbox
          title="Returnable"
          description="Customers can return this product"
          checked={isReturnable && !isInnerWear}
          disabled={isInnerWear}
          onToggle={() => setIsReturnable(v => !v)}
          colors={colors}
        />
        <Text style={[styles.helperText, { color: colors.textSecondary }]}>
          {isInnerWear
            ? "Inner Wear is always non-returnable, so it isn't Try & Buy."
            : isReturnable
              ? 'Returnable products are automatically Try & Buy.'
              : "Non-returnable products aren't eligible for Try & Buy."}
        </Text>
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
    </FormScrollView>
  );
}

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
  heroMassiveDealBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
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
  footer: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});
