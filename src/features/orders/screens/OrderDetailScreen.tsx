import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bike, Box, ChevronLeft, MapPin, Phone, User } from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Badge, type BadgeTone } from '../../../components/common/Badge';
import { BottomSheet } from '../../../components/common/BottomSheet';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useThemeColors } from '../../../store/themeStore';
import { useToast } from '../../../components/feedback/Toast';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import { ROUTES, type MainStackParamList } from '../../../navigation/routeConfig';
import {
  getOrder,
  acceptOrder,
  rejectOrder,
  notifyRider,
  type OrderFulfillmentStatus,
} from '../orders.api';

type Nav = NativeStackNavigationProp<MainStackParamList, 'OrderDetail'>;
type Route = RouteProp<MainStackParamList, 'OrderDetail'>;

// Mirrors products.api.ts's own deal-type label mapping (ProductDetailsScreen's
// DEAL_TYPE_META) — an order item just needs the label, not the icon/tint.
const DEAL_TYPE_LABEL: Record<string, string> = {
  bogo: 'BOGO',
  tier_amount: 'Deal applied',
  tier_percentage: 'Deal applied',
  free_shipping: 'Free shipping',
};

const STATUS_TONE: Record<OrderFulfillmentStatus, BadgeTone> = {
  Pending: 'warning',
  Confirmed: 'info',
  Processing: 'info',
  Packed: 'info',
  Shipped: 'success',
  'Out for Delivery': 'success',
  Delivered: 'success',
  Cancelled: 'error',
};

export function OrderDetailScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { orderId } = params;
  const toast = useToast();
  const queryClient = useQueryClient();

  const [rejectSheetOpen, setRejectSheetOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const orderQuery = useQuery({
    queryKey: ['seller-orders', 'detail', orderId],
    queryFn: () => getOrder(orderId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
  };

  const acceptMutation = useMutation({
    mutationFn: () => acceptOrder(orderId),
    onSuccess: () => {
      toast.show({ type: 'success', title: 'Order confirmed' });
      invalidate();
    },
    onError: (error: Error) =>
      toast.show({ type: 'error', title: "Couldn't confirm order", message: error.message }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectOrder(orderId, rejectReason.trim()),
    onSuccess: () => {
      toast.show({ type: 'success', title: 'Order rejected' });
      setRejectSheetOpen(false);
      setRejectReason('');
      invalidate();
    },
    onError: (error: Error) =>
      toast.show({ type: 'error', title: "Couldn't reject order", message: error.message }),
  });

  const notifyRiderMutation = useMutation({
    mutationFn: () => notifyRider(orderId),
    onSuccess: result => {
      toast.show({
        type: 'success',
        title: 'Riders notified',
        message: `${result.ridersNotified} rider(s) notified — first to accept gets the pickup.`,
      });
      invalidate();
    },
    onError: (error: Error) =>
      toast.show({ type: 'error', title: "Couldn't notify riders", message: error.message }),
  });

  const order = orderQuery.data;
  const fulfillment = order?.fulfillment;

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
          {order ? `Order #${order.orderNumber}` : 'Order'}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {orderQuery.isLoading || !order || !fulfillment ? (
          <>
            <Skeleton height={80} style={styles.skeletonBlock} />
            <Skeleton height={120} style={styles.skeletonBlock} />
            <Skeleton height={160} style={styles.skeletonBlock} />
          </>
        ) : (
          <>
            <Card style={styles.statusCard}>
              <Badge label={fulfillment.sellerStatus} tone={STATUS_TONE[fulfillment.sellerStatus]} />
              <Text style={[styles.placedAt, { color: colors.textSecondary }]}>
                Placed {new Date(order.createdAt).toLocaleString()}
              </Text>
              {fulfillment.cancellationReason ? (
                <Text style={[styles.cancelReason, { color: colors.error }]}>
                  {fulfillment.cancellationReason}
                </Text>
              ) : null}
            </Card>

            {fulfillment.rider ? (
              <Card style={styles.riderCard}>
                <View style={[styles.riderIcon, { backgroundColor: colors.success10 }]}>
                  <Bike size={20} color={colors.success} />
                </View>
                <View style={styles.riderInfo}>
                  <Text style={[styles.riderName, { color: colors.textPrimary }]}>
                    {fulfillment.rider.name}
                  </Text>
                  <Text style={[styles.riderMeta, { color: colors.textSecondary }]}>
                    {fulfillment.rider.vehicleType}
                    {fulfillment.rider.vehicleNumber ? ` · ${fulfillment.rider.vehicleNumber}` : ''}
                    {' · '}
                    {fulfillment.rider.phone}
                  </Text>
                </View>
              </Card>
            ) : fulfillment.sellerStatus === 'Packed' && fulfillment.riderOfferedAt ? (
              <Card style={styles.waitingCard}>
                <Text style={[styles.waitingText, { color: colors.textSecondary }]}>
                  Riders notified — waiting for one to accept the pickup.
                </Text>
              </Card>
            ) : null}

            <Card>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Customer</Text>
              <View style={styles.infoRow}>
                <User size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.textPrimary }]}>{order.customer.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Phone size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.textPrimary }]}>{order.customer.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <MapPin size={16} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.textPrimary }]}>{order.customer.address}</Text>
              </View>
            </Card>

            <Card>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Items</Text>
              {order.items.map((item, index) => {
                const dealLabel = item.isFreeItem
                  ? 'FREE item'
                  : item.dealType
                    ? DEAL_TYPE_LABEL[item.dealType]
                    : null;
                const hasMarkdown = item.originalPrice > item.price;

                return (
                  <Pressable
                    key={`${item.product ?? item.name}-${index}`}
                    disabled={!item.product}
                    onPress={() =>
                      item.product && navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId: item.product })
                    }
                    style={[styles.itemRow, index > 0 && { borderTopColor: colors.divider, borderTopWidth: StyleSheet.hairlineWidth }]}
                  >
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.itemImage} />
                    ) : (
                      <View style={[styles.itemImage, styles.itemImageFallback, { backgroundColor: colors.grey100 }]}>
                        <Box size={22} color={colors.textLight} />
                      </View>
                    )}

                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
                        {item.name}
                      </Text>
                      {!!item.brand && (
                        <Text style={[styles.itemBrand, { color: colors.textSecondary }]} numberOfLines={1}>
                          {item.brand}
                        </Text>
                      )}
                      <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                        {item.size ? `Size ${item.size} · ` : ''}Qty {item.quantity}
                      </Text>
                      {!!dealLabel && (
                        <View style={styles.dealBadgeRow}>
                          <Badge label={dealLabel} tone="warning" />
                        </View>
                      )}
                    </View>

                    <View style={styles.itemPriceCol}>
                      {item.isFreeItem ? (
                        <Text style={[styles.itemPrice, { color: colors.success }]}>FREE</Text>
                      ) : (
                        <>
                          {hasMarkdown && (
                            <Text style={[styles.itemOriginalPrice, { color: colors.textLight }]}>
                              ₹{(item.originalPrice * item.quantity).toFixed(0)}
                            </Text>
                          )}
                          <Text style={[styles.itemPrice, { color: colors.textPrimary }]}>
                            ₹{(item.price * item.quantity).toFixed(0)}
                          </Text>
                        </>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </Card>

            <Card>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Total</Text>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                <Text style={[styles.totalValue, { color: colors.textPrimary }]}>₹{order.subtotal.toFixed(0)}</Text>
              </View>
              {order.tierDiscount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Discount</Text>
                  <Text style={[styles.totalValue, { color: colors.success }]}>-₹{order.tierDiscount.toFixed(0)}</Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Delivery fee</Text>
                <Text style={[styles.totalValue, { color: colors.textPrimary }]}>₹{order.deliveryFee.toFixed(0)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Tax</Text>
                <Text style={[styles.totalValue, { color: colors.textPrimary }]}>₹{order.tax.toFixed(0)}</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow, { borderTopColor: colors.divider }]}>
                <Text style={[styles.grandTotalLabel, { color: colors.textPrimary }]}>Total</Text>
                <Text style={[styles.grandTotalValue, { color: colors.textPrimary }]}>₹{order.total.toFixed(0)}</Text>
              </View>
            </Card>
          </>
        )}
      </ScrollView>

      {fulfillment?.sellerStatus === 'Pending' && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button
            label="Reject"
            variant="outline"
            onPress={() => setRejectSheetOpen(true)}
            style={styles.footerButton}
          />
          <Button
            label="Confirm order"
            onPress={() => acceptMutation.mutate()}
            loading={acceptMutation.isPending}
            style={styles.footerButton}
          />
        </View>
      )}

      {fulfillment?.sellerStatus === 'Packed' && !fulfillment.rider && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button
            label={fulfillment.riderOfferedAt ? 'Notify riders again' : 'Notify rider'}
            onPress={() => notifyRiderMutation.mutate()}
            loading={notifyRiderMutation.isPending}
            style={styles.footerButtonFull}
          />
        </View>
      )}

      <BottomSheet visible={rejectSheetOpen} onClose={() => setRejectSheetOpen(false)}>
        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Reject this order</Text>
        <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
          Let the customer know why — this is shown on their order.
        </Text>
        <TextInput
          value={rejectReason}
          onChangeText={setRejectReason}
          placeholder="e.g. Item out of stock"
          placeholderTextColor={colors.inputPlaceholder}
          multiline
          style={[
            styles.sheetInput,
            { color: colors.textPrimary, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
          ]}
        />
        <Button
          label="Reject order"
          variant="danger"
          onPress={() => rejectMutation.mutate()}
          loading={rejectMutation.isPending}
          disabled={rejectReason.trim().length < 3}
          style={styles.sheetButton}
        />
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
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
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  skeletonBlock: {
    marginBottom: Spacing.md,
  },
  statusCard: {
    gap: Spacing.xs,
  },
  placedAt: {
    fontSize: FontSize.xs,
  },
  cancelReason: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xxs,
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  riderMeta: {
    marginTop: 2,
    fontSize: FontSize.xs,
  },
  waitingCard: {
    alignItems: 'center',
  },
  waitingText: {
    fontSize: FontSize.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: FontSize.sm,
    flexShrink: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
  },
  itemImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
    marginRight: Spacing.sm,
  },
  itemName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  itemBrand: {
    marginTop: 2,
    fontSize: FontSize.xs,
  },
  itemMeta: {
    marginTop: 2,
    fontSize: FontSize.xs,
  },
  dealBadgeRow: {
    marginTop: Spacing.xs,
  },
  itemPriceCol: {
    alignItems: 'flex-end',
  },
  itemOriginalPrice: {
    fontSize: FontSize.xs,
    textDecorationLine: 'line-through',
  },
  itemPrice: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  totalLabel: {
    fontSize: FontSize.sm,
  },
  totalValue: {
    fontSize: FontSize.sm,
  },
  grandTotalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  grandTotalLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  grandTotalValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerButton: {
    flex: 1,
  },
  footerButtonFull: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  sheetSubtitle: {
    marginTop: Spacing.xxs,
    marginBottom: Spacing.lg,
    fontSize: FontSize.sm,
  },
  sheetInput: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.sm,
    textAlignVertical: 'top',
  },
  sheetButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
});
