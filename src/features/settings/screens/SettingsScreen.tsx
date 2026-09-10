import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  FileText,
  Headphones,
  LogOut,
  Megaphone,
  Moon,
  Package,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Trash2,
  User,
  Users,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { useThemeColors } from '../../../store/themeStore';
import { useThemeStore, type ThemeMode } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useLogout } from '../../auth/hooks/useAuthMutations';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import { ROUTES, type MainStackParamList } from '../../../navigation/routeConfig';

type Colors = ReturnType<typeof useThemeColors>['colors'];

const THEME_MODE_LABEL: Record<ThemeMode, string> = {
  system: 'System Default',
  light: 'Light',
  dark: 'Dark',
};
const NEXT_THEME_MODE: Record<ThemeMode, ThemeMode> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

function SectionLabel({ label, colors }: { label: string; colors: Colors }) {
  return <Text style={[styles.sectionLabel, { color: colors.textLight }]}>{label}</Text>;
}

function SettingsRow({
  icon,
  tint,
  title,
  description,
  isLast,
  onPress,
  danger,
  right,
  colors,
}: {
  icon: React.ReactNode;
  tint: string;
  title: string;
  description: string;
  isLast: boolean;
  onPress?: () => void;
  danger?: boolean;
  right?: React.ReactNode;
  colors: Colors;
}) {
  return (
    <View>
      <Pressable onPress={onPress} disabled={!onPress} style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: `${tint}20` }]}>{icon}</View>
        <View style={styles.rowContent}>
          <Text style={[styles.rowTitle, { color: danger ? colors.error : colors.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        </View>
        {right ?? (onPress ? <ChevronRight size={18} color={colors.textLight} /> : null)}
      </Pressable>
      {!isLast && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
    </View>
  );
}

type SettingsNav = NativeStackNavigationProp<MainStackParamList, 'Settings'>;

export function SettingsScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<SettingsNav>();
  const mode = useThemeStore(state => state.mode);
  const setMode = useThemeStore(state => state.setMode);
  const isOwner = useAuthStore(state => state.role) === 'owner';
  const logout = useLogout();

  // No /seller/notification-preferences endpoint yet — these toggles are
  // local-only until that contract lands, same as the zero-placeholder
  // stats elsewhere (see ShopScreen.tsx).
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [inventoryAlerts, setInventoryAlerts] = useState(true);
  const [marketingUpdates, setMarketingUpdates] = useState(false);

  const switchProps = {
    trackColor: { false: colors.buttonSecondaryBg, true: colors.accent },
    thumbColor: '#FFFFFF',
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <ChevronLeft size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage your account and preferences
        </Text>

        <SectionLabel label="APPEARANCE" colors={colors} />
        <Card style={styles.card}>
          <SettingsRow
            icon={<Moon size={20} color={colors.fulfillmentProcessing} />}
            tint={colors.fulfillmentProcessing}
            title="Appearance"
            description="Choose your theme preference"
            isLast
            onPress={() => setMode(NEXT_THEME_MODE[mode])}
            right={
              <View style={styles.valueRow}>
                <Text style={[styles.valueLabel, { color: colors.textLink }]}>
                  {THEME_MODE_LABEL[mode]}
                </Text>
                <ChevronRight size={18} color={colors.textLight} />
              </View>
            }
            colors={colors}
          />
        </Card>

        <SectionLabel label="NOTIFICATIONS" colors={colors} />
        <Card style={styles.card}>
          {isOwner && (
            <SettingsRow
              icon={<Bell size={20} color={colors.info} />}
              tint={colors.info}
              title="Notifications"
              description="Manage all notification preferences"
              isLast={false}
              onPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
              colors={colors}
            />
          )}
          <SettingsRow
            icon={<ShoppingBag size={20} color={colors.success} />}
            tint={colors.success}
            title="Order Updates"
            description="Get notified about your orders"
            isLast={false}
            right={
              <Switch value={orderUpdates} onValueChange={setOrderUpdates} {...switchProps} />
            }
            colors={colors}
          />
          <SettingsRow
            icon={<Package size={20} color={colors.warning} />}
            tint={colors.warning}
            title="Inventory Alerts"
            description="Get notified for low stock and out of stock"
            isLast={false}
            right={
              <Switch
                value={inventoryAlerts}
                onValueChange={setInventoryAlerts}
                {...switchProps}
              />
            }
            colors={colors}
          />
          <SettingsRow
            icon={<Megaphone size={20} color={colors.error} />}
            tint={colors.error}
            title="Marketing Updates"
            description="Receive tips, offers and product updates"
            isLast
            right={
              <Switch
                value={marketingUpdates}
                onValueChange={setMarketingUpdates}
                {...switchProps}
              />
            }
            colors={colors}
          />
        </Card>

        <SectionLabel label="ACCOUNT" colors={colors} />
        <Card style={styles.card}>
          <SettingsRow
            icon={<Shield size={20} color={colors.info} />}
            tint={colors.info}
            title="Change Password"
            description="Update your account password"
            isLast={false}
            colors={colors}
          />
          <SettingsRow
            icon={<Smartphone size={20} color={colors.success} />}
            tint={colors.success}
            title="Active Sessions"
            description="Manage your active sessions"
            isLast={false}
            colors={colors}
          />
          <SettingsRow
            icon={<User size={20} color={colors.warning} />}
            tint={colors.warning}
            title="Account Information"
            description="View and update your account details"
            isLast
            colors={colors}
          />
        </Card>

        {isOwner && (
          <>
            <SectionLabel label="TEAM" colors={colors} />
            <Card style={styles.card}>
              <SettingsRow
                icon={<Users size={20} color={colors.accent} />}
                tint={colors.accent}
                title="Manage Helpers"
                description="Add or remove helper accounts for your shop"
                isLast
                onPress={() => navigation.navigate(ROUTES.MANAGE_HELPERS)}
                colors={colors}
              />
            </Card>
          </>
        )}

        <SectionLabel label="SUPPORT" colors={colors} />
        <Card style={styles.card}>
          <SettingsRow
            icon={<Headphones size={20} color={colors.fulfillmentProcessing} />}
            tint={colors.fulfillmentProcessing}
            title="Help & Support"
            description="Get help and contact support"
            isLast={false}
            onPress={() => navigation.navigate(ROUTES.SUPPORT)}
            colors={colors}
          />
          <SettingsRow
            icon={<FileText size={20} color={colors.info} />}
            tint={colors.info}
            title="Terms & Conditions"
            description="Read our terms and conditions"
            isLast={false}
            colors={colors}
          />
          <SettingsRow
            icon={<ShieldCheck size={20} color={colors.success} />}
            tint={colors.success}
            title="Privacy Policy"
            description="Read our privacy policy"
            isLast
            colors={colors}
          />
        </Card>

        <SectionLabel label="DANGER ZONE" colors={colors} />
        <Card style={styles.card}>
          <SettingsRow
            icon={<Trash2 size={20} color={colors.error} />}
            tint={colors.error}
            title="Deactivate Account"
            description="Temporarily deactivate your seller account"
            isLast
            danger
            colors={colors}
          />
        </Card>

        <Pressable
          onPress={() => logout.mutate()}
          disabled={logout.isPending}
          style={[styles.logoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.logoutLabelRow}>
            <LogOut size={18} color={colors.error} />
            <Text style={[styles.logoutLabel, { color: colors.error }]}>
              {logout.isPending ? 'Logging out…' : 'Log out'}
            </Text>
          </View>
          <Text style={[styles.logoutCaption, { color: colors.textSecondary }]}>
            Log out from this account
          </Text>
        </Pressable>

        <Text style={[styles.version, { color: colors.textLight }]}>App version 1.0 (1)</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: Spacing.xxs,
    marginLeft: -Spacing.xxs,
  },
  title: {
    marginTop: Spacing.sm,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    marginTop: Spacing.xxs,
    fontSize: FontSize.sm,
  },
  sectionLabel: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.6,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  rowTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  rowDescription: {
    marginTop: Spacing.xxs,
    fontSize: FontSize.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  valueLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.lg + 40 + Spacing.md,
  },
  logoutCard: {
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  logoutLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  logoutLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  logoutCaption: {
    marginTop: Spacing.xxs,
    fontSize: FontSize.xs,
  },
  version: {
    marginTop: Spacing.lg,
    textAlign: 'center',
    fontSize: FontSize.xs,
  },
});
