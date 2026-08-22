import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import {
  AlertCircle,
  Clock3,
  FileText,
  LogOut,
  ShieldCheck,
} from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Button } from '../../../components/common/Button';
import { Badge, type BadgeTone } from '../../../components/common/Badge';
import { useThemeColors } from '../../../store/themeStore';
import { Spacing } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import { useSellerAccess } from '../../../hooks/useSellerAccess';
import { useLogout } from '../hooks/useAuthMutations';

export function AccountStatusScreen() {
  const { colors } = useThemeColors();

  const {
    seller,
    isPending,
    isRejected,
    isSuspended,
    isInactive,
    blockedReason,
  } = useSellerAccess();

  const logout = useLogout();

  const tone: BadgeTone =
    isRejected || isSuspended ? 'error' : isInactive ? 'neutral' : 'warning';

  const label = isPending
    ? 'Pending verification'
    : isRejected
    ? 'Registration rejected'
    : isSuspended
    ? 'Account suspended'
    : isInactive
    ? 'Account inactive'
    : 'Action needed';

  const shopName = seller?.shopName ?? 'Your shop';

  const isBlocked = isRejected || isSuspended || isInactive;

  const statusTitle = isPending
    ? 'Your shop is awaiting verification'
    : isRejected
    ? 'Your registration needs attention'
    : isSuspended
    ? 'Your seller account is suspended'
    : isInactive
    ? 'Your seller account is currently inactive'
    : 'Action is required';

  const helperMessage = isPending
    ? 'Our team is reviewing your shop details to ensure a safe and trusted marketplace for everyone.'
    : blockedReason;

  return (
    <Screen>
      <View style={styles.container}>
        <Image
          source={require('../../../assets/shopstatuslogo.png')}
          style={styles.heroImage}
          resizeMode="contain"
        />

        <View style={styles.badgeContainer}>
          <Badge label={label} tone={tone} />
        </View>

        <Text style={[styles.shopName, { color: colors.textPrimary }]}>
          {shopName}
        </Text>

        <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
          {statusTitle}
        </Text>

        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {helperMessage}
        </Text>

        {isPending && (
          <>
            <View
              style={[
                styles.progressCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <StatusRow
                icon={<FileText size={22} color={colors.primary} />}
                title="Application submitted"
                description="Your seller registration has been received."
                isLast={false}
                colors={colors}
              />

              <StatusRow
                icon={<ShieldCheck size={22} color={colors.primary} />}
                title="Under review"
                description="Our team is verifying your information."
                isLast={false}
                colors={colors}
              />

              <StatusRow
                icon={<Clock3 size={22} color={colors.textSecondary} />}
                title="Expected response"
                description="You will be notified once verification is complete."
                isLast
                colors={colors}
              />
            </View>

            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: `${colors.primary}10`,
                  borderColor: `${colors.primary}35`,
                },
              ]}
            >
              <View
                style={[
                  styles.infoIcon,
                  {
                    backgroundColor: `${colors.primary}18`,
                  },
                ]}
              >
                <AlertCircle size={22} color={colors.primary} />
              </View>

              <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                Once verified, you'll be able to add products, manage orders,
                create offers, and grow your business.
              </Text>
            </View>
          </>
        )}

        {isBlocked && (
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.infoIcon,
                {
                  backgroundColor:
                    isRejected || isSuspended
                      ? `${colors.error}18`
                      : `${colors.primary}18`,
                },
              ]}
            >
              <AlertCircle
                size={22}
                color={
                  isRejected || isSuspended ? colors.error : colors.primary
                }
              />
            </View>

            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {blockedReason ??
                'Please contact support if you need help with your seller account.'}
            </Text>
          </View>
        )}

        <Button
          label="Log out"
          variant="outline"
          onPress={() => logout.mutate()}
          loading={logout.isPending}
          style={styles.logout}
          leftIcon={
            !logout.isPending ? (
              <LogOut size={20} color={colors.primary} />
            ) : undefined
          }
        />
      </View>
    </Screen>
  );
}

type StatusRowProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  isLast: boolean;
  colors: {
    primary: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
  };
};

function StatusRow({
  icon,
  title,
  description,
  isLast,
  colors,
}: StatusRowProps) {
  return (
    <View>
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusIcon,
            {
              backgroundColor: `${colors.primary}12`,
            },
          ]}
        >
          {icon}
        </View>

        <View style={styles.statusContent}>
          <Text style={[styles.statusRowTitle, { color: colors.textPrimary }]}>
            {title}
          </Text>

          <Text
            style={[
              styles.statusRowDescription,
              { color: colors.textSecondary },
            ]}
          >
            {description}
          </Text>
        </View>
      </View>

      {!isLast && (
        <View
          style={[
            styles.divider,
            {
              backgroundColor: colors.border,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },

  heroImage: {
    width: 220,
    height: 220,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },

  badgeContainer: {
    marginBottom: Spacing.md,
  },

  shopName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },

  statusTitle: {
    marginTop: Spacing.md,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },

  message: {
    marginTop: Spacing.sm,
    fontSize: FontSize.md,
    lineHeight: 25,
    textAlign: 'center',
    maxWidth: 360,
  },

  progressCard: {
    width: '100%',
    marginTop: Spacing.xxl,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },

  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  statusRowTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },

  statusRowDescription: {
    marginTop: 4,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 64,
  },

  infoCard: {
    width: '100%',
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },

  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 22,
  },

  logout: {
    width: '100%',
    marginTop: Spacing.xxl,
    minHeight: 56,
  },
});
