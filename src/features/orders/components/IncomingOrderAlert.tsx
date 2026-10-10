import React, { useEffect, useRef, useState } from 'react';
import { AppState, Modal, NativeModules, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag } from 'lucide-react-native';

import { Button } from '../../../components/common/Button';
import { useToast } from '../../../components/feedback/Toast';
import { useAuthStore } from '../../../store/useAuthStore';
import { useThemeColors } from '../../../store/themeStore';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import {
  startOrderAlarmSound,
  stopAllNewOrderAlerts,
  stopNewOrderAlert,
} from '../../../services/notifications/localNotifications';
import { acceptOrder, getOrders, rejectOrder } from '../orders.api';

const OrderAlarm = NativeModules.OrderAlarm as
  | { showOverLockScreen(enabled: boolean): void }
  | undefined;

/**
 * Full-screen "New order" popup — can't be dismissed, and the order sound
 * keeps looping, until every Pending order is accepted or rejected. The
 * server's Pending list is the source of truth (not the notification), so
 * it also catches orders whose push never arrived. Rendered once at the
 * app root (App.tsx), over whatever screen is open.
 */
export function IncomingOrderAlert() {
  const { colors } = useThemeColors();
  const toast = useToast();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const pendingQuery = useQuery({
    queryKey: ['seller-orders', 'pending-alert'],
    queryFn: () => getOrders({ sellerStatus: 'Pending', limit: 20 }),
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  const { refetch } = pendingQuery;
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') void refetch();
    });
    return () => sub.remove();
  }, [refetch]);

  const orders = isAuthenticated ? pendingQuery.data?.items ?? [] : [];
  const order = orders[0];
  const hasPending = orders.length > 0;

  // Ring while anything is waiting; stop only on the waiting -> none
  // transition, so a fetch that hasn't caught up with a just-arrived push
  // can't silence it.
  const hadPending = useRef(false);
  useEffect(() => {
    if (hasPending) startOrderAlarmSound();
    else if (hadPending.current) void stopAllNewOrderAlerts();
    hadPending.current = hasPending;
    OrderAlarm?.showOverLockScreen(hasPending);
  }, [hasPending]);

  const onHandled = (orderId: string) => {
    void stopNewOrderAlert(orderId);
    setRejecting(false);
    setReason('');
    void queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
  };

  const acceptMutation = useMutation({
    mutationFn: (id: string) => acceptOrder(id),
    onSuccess: (_, id) => {
      toast.show({ type: 'success', title: 'Order confirmed', message: 'Nearby riders have been notified.' });
      onHandled(id);
    },
    onError: (error: Error) =>
      toast.show({ type: 'error', title: "Couldn't confirm order", message: error.message }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectOrder(id, reason.trim()),
    onSuccess: (_, id) => {
      toast.show({ type: 'success', title: 'Order rejected' });
      onHandled(id);
    },
    onError: (error: Error) =>
      toast.show({ type: 'error', title: "Couldn't reject order", message: error.message }),
  });

  if (!order) return null;

  const busy = acceptMutation.isPending || rejectMutation.isPending;

  return (
    // onRequestClose is a no-op on purpose: the back button can't dismiss it.
    <Modal visible animationType="slide" onRequestClose={() => {}} statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={[styles.icon, { backgroundColor: colors.accent10 }]}>
            <ShoppingBag size={32} color={colors.accent} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>New order</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            #{order.orderNumber}
            {orders.length > 1 ? `  ·  1 of ${orders.length} waiting` : ''}
          </Text>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {order.items.map((item, i) => (
            <View key={i} style={[styles.itemRow, { borderColor: colors.border }]}>
              <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                Size {item.size} × {item.quantity}
                {item.isFreeItem ? '  (free)' : `  ·  ₹${(item.price * item.quantity).toFixed(0)}`}
              </Text>
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
              Total · {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid online'}
            </Text>
            <Text style={[styles.totalValue, { color: colors.textPrimary }]}>₹{order.total.toFixed(0)}</Text>
          </View>

          {rejecting && (
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Why are you rejecting? e.g. Item out of stock"
              placeholderTextColor={colors.inputPlaceholder}
              multiline
              autoFocus
              style={[
                styles.reasonInput,
                { color: colors.textPrimary, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
              ]}
            />
          )}
        </ScrollView>

        <View style={styles.footer}>
          {rejecting ? (
            <>
              <Button label="Back" variant="outline" onPress={() => setRejecting(false)} disabled={busy} style={styles.footerButton} />
              <Button
                label="Reject order"
                variant="danger"
                onPress={() => rejectMutation.mutate(order._id)}
                loading={rejectMutation.isPending}
                disabled={busy || reason.trim().length < 3}
                style={styles.footerButton}
              />
            </>
          ) : (
            <>
              <Button label="Reject" variant="outline" onPress={() => setRejecting(true)} disabled={busy} style={styles.footerButton} />
              <Button
                label="Accept order"
                onPress={() => acceptMutation.mutate(order._id)}
                loading={acceptMutation.isPending}
                disabled={busy}
                style={styles.footerButton}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Spacing.massive },
  header: { alignItems: 'center', paddingHorizontal: Spacing.lg },
  icon: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginTop: Spacing.md, fontSize: FontSize.display, fontWeight: FontWeight.bold },
  subtitle: { marginTop: Spacing.xs, fontSize: FontSize.md },
  body: { flex: 1, marginTop: Spacing.xl },
  bodyContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  itemRow: { paddingVertical: Spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  itemName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  itemMeta: { marginTop: Spacing.xxs, fontSize: FontSize.sm },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  totalLabel: { fontSize: FontSize.sm },
  totalValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  reasonInput: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    textAlignVertical: 'top',
  },
  footer: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.xxl },
  footerButton: { flex: 1 },
});
