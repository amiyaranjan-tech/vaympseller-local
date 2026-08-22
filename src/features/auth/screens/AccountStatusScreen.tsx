import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '../../../components/layout/Screen';
import { Button } from '../../../components/common/Button';
import { Badge, type BadgeTone } from '../../../components/common/Badge';
import { useThemeColors } from '../../../store/themeStore';
import { Spacing } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import { useSellerAccess } from '../../../hooks/useSellerAccess';
import { useLogout } from '../hooks/useAuthMutations';

// Shown by AppNavigator whenever the seller is authenticated but not
// active/verified — one screen, content branches on status, rather than
// three near-identical Pending/Rejected/Suspended screens (see
// useSellerAccess for the status -> message mapping shared with the rest
// of the app).
export function AccountStatusScreen() {
  const { colors } = useThemeColors();
  const { seller, isPending, isRejected, isSuspended, isInactive, blockedReason } =
    useSellerAccess();
  const logout = useLogout();

  const tone: BadgeTone = isRejected || isSuspended ? 'error' : isInactive ? 'neutral' : 'warning';
  const label = isPending
    ? 'Pending verification'
    : isRejected
      ? 'Registration rejected'
      : isSuspended
        ? 'Account suspended'
        : isInactive
          ? 'Account inactive'
          : 'Action needed';

  return (
    <Screen>
      <View style={styles.content}>
        <Badge label={label} tone={tone} />

        <Text style={[styles.shopName, { color: colors.textPrimary }]}>
          {seller?.shopName ?? 'Your shop'}
        </Text>

        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {blockedReason}
        </Text>

        <Button
          label="Log out"
          variant="outline"
          onPress={() => logout.mutate()}
          loading={logout.isPending}
          style={styles.logout}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopName: {
    marginTop: Spacing.lg,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  message: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  logout: {
    marginTop: Spacing.xxl,
    minWidth: 160,
  },
});
