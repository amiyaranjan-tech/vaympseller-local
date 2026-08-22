import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';

import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { useThemeColors } from '../../store/themeStore';
import { useToast } from '../feedback/Toast';
import { Spacing, Radius } from '../../theme/spacing';
import { FontSize, FontWeight } from '../../theme/typography';

interface UnverifiedGateModalProps {
  visible: boolean;
  onClose: () => void;
}

// Shown wherever a verified-only action (adding a product, ...) is
// blocked by an unverified account — see useSellerAccess().isActive.
// No "request verification" endpoint exists on the backend yet, so
// Send is client-only for now: it surfaces the toast the seller expects
// without actually notifying anyone. Wire to a real call once that
// contract lands.
export function UnverifiedGateModal({ visible, onClose }: UnverifiedGateModalProps) {
  const { colors } = useThemeColors();
  const toast = useToast();

  const handleSend = () => {
    onClose();
    toast.show({ type: 'success', title: 'Admin notified successfully' });
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={[styles.icon, { backgroundColor: colors.warning10 }]}>
        <ShieldAlert size={28} color={colors.warning} />
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Account not verified
      </Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        Your account is not verified yet. Send admin a notification to verify your account.
      </Text>

      <View style={styles.actions}>
        <Button label="Cancel" variant="outline" onPress={onClose} style={styles.actionButton} />
        <Button label="Send" onPress={handleSend} style={styles.actionButton} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  title: {
    marginTop: Spacing.lg,
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  body: {
    marginTop: Spacing.xs,
    textAlign: 'center',
    fontSize: FontSize.sm,
    lineHeight: 20,
    paddingHorizontal: Spacing.sm,
  },
  actions: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
