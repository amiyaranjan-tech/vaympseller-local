import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Box,
  ChevronRight,
  Lightbulb,
  PackageOpen,
  Percent,
  Plus,
  RefreshCcw,
  Search,
  Send,
  ShoppingBag,
  Sparkle,
  Tag,
  TriangleAlert,
  Truck,
} from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { ImageCarousel } from '../../../components/common/ImageCarousel';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useToast } from '../../../components/feedback/Toast';
import { UnverifiedGateModal } from '../../../components/common/UnverifiedGateModal';
import { useSellerAccess } from '../../../hooks/useSellerAccess';
import { useThemeColors } from '../../../store/themeStore';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import { ROUTES, type MainStackParamList } from '../../../navigation/routeConfig';
import { getProducts, updateProductStatus, type Product, type ProductStatus } from '../products.api';

const PRODUCT_FILTERS = [
  'All',
  'Draft',
  'Pending',
  'Published',
  'Hidden',
  'Archived',
  'Deals',
] as const;
type ProductFilter = (typeof PRODUCT_FILTERS)[number];

// "Deals" isn't a product status — the backend's product list endpoint
// has no dealType filter param (see services/sellerProduct.service.js#
// getAll), so it fetches unfiltered (same as All) and gets narrowed to
// dealType !== 'none' client-side below instead.
//
// No separate "Approved" tab — admin's Approve & Publish is one action
// now (see the admin panel's ProductApprovals.tsx), so "approved" is a
// transient status a seller's own product list should never realistically
// catch a product sitting in; Published covers what used to be two tabs.
const FILTER_STATUS: Record<ProductFilter, ProductStatus | undefined> = {
  All: undefined,
  Draft: 'draft',
  Pending: 'pending_review',
  Published: 'published',
  Hidden: 'hidden',
  Archived: 'archived',
  Deals: undefined,
};

const STATUS_LABEL: Record<ProductStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending',
  approved: 'Approved',
  published: 'Published',
  rejected: 'Rejected',
  hidden: 'Hidden',
  archived: 'Archived',
};

const TIPS = [
  'Add high quality images',
  'Write clear product descriptions',
  'Set competitive prices',
  'Keep your inventory updated',
];

type Colors = ReturnType<typeof useThemeColors>['colors'];

// Product.dealType is server-synced from whichever active Offer(s) cover
// this product (see services/offer.service.js#syncBogoProductDealTypes/
// syncTierProductDealTypes on the backend) — reading it directly here
// avoids a second fetch just to badge the card, same as the consumer
// app's own "DEAL ›" badge does off the same field.
const DEAL_BADGE_META: Partial<Record<Product['dealType'], { label: string; icon: typeof ShoppingBag }>> = {
  bogo: { label: 'BOGO', icon: ShoppingBag },
  tier_amount: { label: 'SAVE ₹', icon: Tag },
  tier_percentage: { label: 'SAVE %', icon: Percent },
  free_shipping: { label: 'FREE SHIP', icon: Truck },
};

const STOCK_STATUS_LABEL: Record<Product['stockStatus'], string> = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
};

// Vertical grid card matching the consumer app's ProductCard shape
// (src/components/home/ProductCard.tsx in vaympmobile-local) — tall
// rounded image with an overlaid badge, a compact details block below
// with a brand/discount row, name, and price row. No cart/wishlist here,
// this is the seller's own read-only catalog view; the status badge and
// stock line replace those, and a draft gets a Submit for Review action.
function ProductCard({
  product,
  colors,
  cardWidth,
  onPress,
  onDealPress,
  onSubmitForReview,
  submitting,
}: {
  product: Product;
  colors: Colors;
  cardWidth: number;
  onPress: () => void;
  onDealPress: () => void;
  onSubmitForReview: (id: string) => void;
  submitting: boolean;
}) {
  const imageHeight = cardWidth * 1.45;
  const dealBadge = DEAL_BADGE_META[product.dealType];
  const stockColor =
    product.stockStatus === 'in_stock'
      ? colors.success
      : product.stockStatus === 'low_stock'
        ? colors.warning
        : colors.error;
  const hasDiscount = product.discountPercent > 0;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.productCard,
        { width: cardWidth, backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={{ width: cardWidth, height: imageHeight }}>
        <ImageCarousel
          images={product.images}
          width={cardWidth}
          height={imageHeight}
          fallback={
            <View
              style={[styles.productImage, styles.productImageFallback, { backgroundColor: colors.grey100 }]}
            >
              <Box size={28} color={colors.textLight} />
            </View>
          }
        />
        <View style={styles.productImageBadge}>
          <Text style={styles.productImageBadgeLabel}>{STATUS_LABEL[product.status]}</Text>
        </View>

        {dealBadge && (
          <Pressable
            onPress={onDealPress}
            style={[styles.dealBadge, { backgroundColor: colors.warning }]}
          >
            <dealBadge.icon size={11} color={colors.textInverse} />
            <Text style={styles.dealBadgeLabel} numberOfLines={1}>
              {dealBadge.label}
            </Text>
            <ChevronRight size={11} color={colors.textInverse} />
          </Pressable>
        )}
      </View>

      <View style={styles.productDetails}>
        <View style={styles.productTopRow}>
          <Text style={[styles.productBrand, { color: colors.textPrimary }]} numberOfLines={1}>
            {product.brand || product.category}
          </Text>
          {hasDiscount && (
            <View
              style={[
                styles.productDiscountBadge,
                { backgroundColor: colors.accent10, borderColor: `${colors.accent}30` },
              ]}
            >
              <Text style={[styles.productDiscountLabel, { color: colors.accent }]}>
                {product.discountPercent}% OFF
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.productName, { color: colors.textSecondary }]} numberOfLines={1}>
          {product.name}
        </Text>

        <View style={styles.productPriceRow}>
          <Text style={[styles.productPrice, { color: colors.textPrimary }]}>
            ₹{product.finalPrice.toLocaleString('en-IN')}
          </Text>
          {hasDiscount && (
            <Text style={[styles.productStrike, { color: colors.grey500 }]}>
              ₹{product.sellingPrice.toLocaleString('en-IN')}
            </Text>
          )}
        </View>

        <Text style={[styles.productStock, { color: stockColor }]} numberOfLines={1}>
          {STOCK_STATUS_LABEL[product.stockStatus]} · {product.totalStock}
        </Text>
      </View>

      {product.status === 'draft' && (
        <Pressable
          onPress={() => onSubmitForReview(product._id)}
          disabled={submitting}
          style={[styles.submitButton, { backgroundColor: colors.accent10 }]}
        >
          <Send size={13} color={colors.accent} />
          <Text style={[styles.submitButtonLabel, { color: colors.accent }]} numberOfLines={1}>
            {submitting ? 'Submitting…' : 'Submit for Review'}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

type ProductsNav = NativeStackNavigationProp<MainStackParamList>;

export function ProductsScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<ProductsNav>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { isVerified } = useSellerAccess();
  // Two-column grid, same formula as the consumer app's ProductCard
  // ((width - 48) / 2) — Spacing.lg*2 (screen padding) + Spacing.md
  // (inter-card gap) here instead of a flat 48, since this screen's own
  // padding/gap already come from Spacing tokens.
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = (windowWidth - Spacing.lg * 2 - Spacing.md) / 2;

  const [filter, setFilter] = useState<ProductFilter>('All');
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [showUnverifiedGate, setShowUnverifiedGate] = useState(false);

  const handleAddProduct = () => {
    if (!isVerified) {
      setShowUnverifiedGate(true);
      return;
    }
    navigation.navigate(ROUTES.ADD_PRODUCT);
  };

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const query = useQuery({
    queryKey: ['seller-products', 'list', filter, search],
    queryFn: () => getProducts({ status: FILTER_STATUS[filter], search: search || undefined, limit: 50 }),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => updateProductStatus(id, 'pending_review'),
    onSuccess: () => {
      toast.show({ type: 'success', title: 'Submitted for review' });
      void queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    },
    onError: (error: Error) => {
      toast.show({ type: 'error', title: "Couldn't submit product", message: error.message });
    },
  });

  // Per-tab counts — the backend has no aggregate "counts by status"
  // endpoint (see PROJECT_NOTES.md), so this is one cheap limit:1 list
  // call per filter tab, read for its `pagination.total`. Swap for a
  // real aggregate endpoint if this screen's load time ever becomes a
  // problem.
  const filterCounts = useQueries({
    queries: PRODUCT_FILTERS.map(label => ({
      queryKey: ['seller-products', 'count', label],
      queryFn: () => getProducts({ status: FILTER_STATUS[label], limit: 1 }),
      staleTime: 30000,
    })),
  });

  const rawItems = query.data?.items ?? [];
  const items = filter === 'Deals' ? rawItems.filter(p => p.dealType !== 'none') : rawItems;
  const hasActiveFilter = filter !== 'All' || search.length > 0;

  // The per-tab counts (filterCounts above) are their own cached queries
  // with a 30s staleTime — a status change that happens outside this
  // screen (admin approving/rejecting a pending product, for one) can
  // leave a tab's badge showing a stale count indefinitely, since nothing
  // was re-triggering a refetch. Refresh everything under this key
  // whenever the screen regains focus, so coming back to it (e.g. after
  // viewing a product, or backgrounding the app) always shows real counts.
  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    }, [queryClient]),
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void queryClient.invalidateQueries({ queryKey: ['seller-products'] })}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Products</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage your products and inventory
            </Text>
          </View>

          <Pressable
            onPress={handleAddProduct}
            style={[styles.addButton, { backgroundColor: colors.accent }]}
          >
            <Plus size={18} color={colors.textInverse} />
            <Text style={[styles.addButtonLabel, { color: colors.textInverse }]}>
              Add Product
            </Text>
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
            ]}
          >
            <Search size={18} color={colors.inputPlaceholder} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search products..."
              placeholderTextColor={colors.inputPlaceholder}
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabs}
        >
          {PRODUCT_FILTERS.map((label, index) => {
            const isActive = label === filter;
            // filterCounts has no dealType-aware query for "Deals" (see
            // the FILTER_STATUS comment above) — its raw total would just
            // be every product, which is misleading as a "deals" count,
            // so that badge is suppressed rather than shown wrong.
            const count = label === 'Deals' ? 0 : filterCounts[index]?.data?.pagination.total ?? 0;
            return (
              <Pressable key={label} onPress={() => setFilter(label)} style={styles.filterTab}>
                <View style={styles.filterTabLabelRow}>
                  <Text
                    style={[
                      styles.filterTabLabel,
                      { color: isActive ? colors.accent : colors.textSecondary },
                      isActive && styles.filterTabLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                  {count > 0 && (
                    <View
                      style={[
                        styles.filterTabBadge,
                        { backgroundColor: isActive ? colors.accent : colors.grey200 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterTabBadgeLabel,
                          { color: isActive ? colors.textInverse : colors.textSecondary },
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </View>
                {isActive && (
                  <View style={[styles.filterTabUnderline, { backgroundColor: colors.accent }]} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {query.isLoading ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2, 3].map(i => (
              <View
                key={i}
                style={[styles.productCard, { width: cardWidth, backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Skeleton width={cardWidth} height={cardWidth * 1.45} radius={0} />
                <View style={styles.productDetails}>
                  <Skeleton width="60%" height={14} style={{ marginBottom: Spacing.xs }} />
                  <Skeleton width="80%" height={12} style={{ marginBottom: Spacing.sm }} />
                  <Skeleton width="40%" height={16} />
                </View>
              </View>
            ))}
          </View>
        ) : query.isError ? (
          <Card style={styles.emptyCard}>
            <TriangleAlert size={40} color={colors.error} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary, marginTop: Spacing.md }]}>
              Couldn't load products
            </Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              {query.error instanceof Error ? query.error.message : 'Something went wrong.'}
            </Text>
            <Pressable
              onPress={() => query.refetch()}
              style={[styles.emptyButton, { backgroundColor: colors.accent }]}
            >
              <RefreshCcw size={18} color={colors.textInverse} />
              <Text style={[styles.emptyButtonLabel, { color: colors.textInverse }]}>Retry</Text>
            </Pressable>
          </Card>
        ) : items.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={[styles.emptyIconRing, { backgroundColor: `${colors.accent}14` }]}>
              <PackageOpen size={48} color={colors.accent} />
              <Sparkle size={14} color={colors.accent} style={[styles.sparkle, { top: 4, left: 10 }]} />
              <Sparkle size={12} color={colors.warning} style={[styles.sparkle, { top: 30, right: -6 }]} />
              <Sparkle size={10} color={colors.accent} style={[styles.sparkle, { bottom: 10, left: -10 }]} />
              <Sparkle size={10} color={colors.warning} style={[styles.sparkle, { bottom: -4, right: 20 }]} />
            </View>

            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {hasActiveFilter ? 'No products match' : 'No products yet'}
            </Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              {hasActiveFilter
                ? 'Try a different filter or search term.'
                : "You haven't added any products to your shop. Add your first product to start selling."}
            </Text>

            {!hasActiveFilter && (
              <Pressable
                onPress={handleAddProduct}
                style={[styles.emptyButton, { backgroundColor: colors.accent }]}
              >
                <Plus size={18} color={colors.textInverse} />
                <Text style={[styles.emptyButtonLabel, { color: colors.textInverse }]}>
                  Add your first product
                </Text>
              </Pressable>
            )}
          </Card>
        ) : (
          <View style={styles.productList}>
            {items.map(product => (
              <ProductCard
                key={product._id}
                product={product}
                colors={colors}
                cardWidth={cardWidth}
                onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId: product._id })}
                onDealPress={() =>
                  navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId: product._id, tab: 'deals' })
                }
                onSubmitForReview={id => submitMutation.mutate(id)}
                submitting={submitMutation.isPending && submitMutation.variables === product._id}
              />
            ))}
          </View>
        )}

        <Card style={styles.tipsCard}>
          <View style={[styles.tipsIcon, { backgroundColor: `${colors.accent}20` }]}>
            <Lightbulb size={22} color={colors.accent} />
          </View>

          <View style={styles.tipsContent}>
            <Text style={[styles.tipsTitle, { color: colors.textPrimary }]}>
              Tips to get started
            </Text>
            {TIPS.map(tip => (
              <Text key={tip} style={[styles.tipItem, { color: colors.textSecondary }]}>
                {'•'} {tip}
              </Text>
            ))}
          </View>
        </Card>
      </ScrollView>

      <UnverifiedGateModal
        visible={showUnverifiedGate}
        onClose={() => setShowUnverifiedGate(false)}
      />
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xxs,
  },
  addButtonLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  searchRow: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    height: '100%',
  },
  filterTabs: {
    marginTop: Spacing.lg,
    gap: Spacing.lg,
  },
  filterTab: {
    alignItems: 'center',
    paddingBottom: Spacing.sm,
  },
  filterTabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  filterTabLabel: {
    fontSize: FontSize.md,
  },
  filterTabLabelActive: {
    fontWeight: FontWeight.semibold,
  },
  filterTabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: Radius.full,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabBadgeLabel: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
  },
  filterTabUnderline: {
    marginTop: Spacing.xs,
    height: 2,
    width: '100%',
    borderRadius: 1,
  },
  skeletonList: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
  },
  productList: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
  },
  productCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A fixed dark scrim, not the shared Badge component's usual
  // translucent (10%-opacity) tone tint, and not a solid per-status tone
  // color either — over an arbitrary product photo a 10%-opacity chip is
  // nearly invisible, and per-tone solid colors don't work either (the
  // dark theme's "warning"/"neutral" tones are light colors that white
  // text reads poorly against, while the light theme's are dark). A
  // fixed dark scrim + white text is legible over any photo in either
  // theme, full stop — same idea as dealBadge below, just theme-neutral.
  productImageBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  productImageBadgeLabel: {
    color: '#FFFFFF',
    fontSize: FontSize.xxxs,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dealBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
  },
  dealBadgeLabel: {
    color: '#FFFFFF',
    fontSize: FontSize.xxxs,
    fontWeight: FontWeight.bold,
  },
  productDetails: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  productTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  productBrand: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  productDiscountBadge: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
  },
  productDiscountLabel: {
    fontSize: FontSize.xxxs,
    fontWeight: FontWeight.bold,
  },
  productName: {
    marginTop: 2,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  productPriceRow: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  productPrice: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  productStrike: {
    fontSize: FontSize.xxxs,
    textDecorationLine: 'line-through',
  },
  productStock: {
    marginTop: Spacing.xxs,
    fontSize: FontSize.xxxs,
    fontWeight: FontWeight.medium,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: Radius.sm,
  },
  submitButtonLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  emptyCard: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyIconRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  sparkle: {
    position: 'absolute',
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
  emptyButton: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  emptyButtonLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  tipsCard: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipsIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  tipItem: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
