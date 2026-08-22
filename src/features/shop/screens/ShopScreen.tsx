import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  Eye,
  Heart,
  Image as ImageIcon,
  Landmark,
  Percent,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  TrendingUp,
  TriangleAlert,
  Truck,
  Users,
} from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { useThemeColors } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import {
  ROUTES,
  type MainStackParamList,
  type MainTabParamList,
} from '../../../navigation/routeConfig';

type Colors = ReturnType<typeof useThemeColors>['colors'];

function PerfTile({
  icon,
  tint,
  value,
  label,
  caption,
}: {
  icon: React.ReactNode;
  tint: string;
  value: string;
  label: string;
  caption: string;
}) {
  const { colors } = useThemeColors();
  return (
    <Card style={styles.perfTile}>
      <View style={[styles.perfIcon, { backgroundColor: `${tint}20` }]}>{icon}</View>
      <Text style={[styles.perfValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.perfLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.perfCaption, { color: colors.success }]}>{caption}</Text>
    </Card>
  );
}

function SetupRow({
  icon,
  tint,
  title,
  description,
  completed,
  isLast,
  onPress,
  colors,
}: {
  icon: React.ReactNode;
  tint: string;
  title: string;
  description: string;
  completed: boolean;
  isLast: boolean;
  onPress: () => void;
  colors: Colors;
}) {
  return (
    <View>
      <Pressable onPress={onPress} style={styles.setupRow}>
        <View style={[styles.setupIcon, { backgroundColor: `${tint}20` }]}>{icon}</View>
        <View style={styles.setupContent}>
          <Text style={[styles.setupTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.setupDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        </View>
        <View style={styles.setupStatus}>
          {completed ? (
            <CircleCheck size={14} color={colors.success} />
          ) : (
            <TriangleAlert size={14} color={colors.warning} />
          )}
          <Text
            style={[
              styles.setupStatusLabel,
              { color: completed ? colors.success : colors.warning },
            ]}
          >
            {completed ? 'Completed' : 'Pending'}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.textLight} />
      </Pressable>
      {!isLast && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
    </View>
  );
}

function QuickAction({
  icon,
  tint,
  label,
  onPress,
  colors,
}: {
  icon: React.ReactNode;
  tint: string;
  label: string;
  onPress: () => void;
  colors: Colors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${tint}20` }]}>{icon}</View>
      <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

type ShopNav = BottomTabNavigationProp<MainTabParamList, 'Shop'>;

export function ShopScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<ShopNav>();
  const mainStack = navigation.getParent<NativeStackNavigationProp<MainStackParamList>>();
  const seller = useAuthStore(state => state.seller);

  const isOpen = seller?.shopStatus === 'open';
  const shopName = seller?.shopName ?? 'Your shop';
  const joinedOn = seller?.createdAt
    ? new Date(seller.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '--';
  // No dedicated human-friendly shop code on the model yet — derive a
  // display id from the Mongo _id rather than adding a backend field for it.
  const shopId = seller?._id ? `SHP${seller._id.slice(-6).toUpperCase()}` : '--';

  const setupItems = [
    {
      key: 'profile',
      icon: <Store size={20} color={colors.success} />,
      tint: colors.success,
      title: 'Shop Profile',
      description: 'Name, logo and contact details',
      completed: Boolean(seller?.shopName && seller?.logo?.url),
    },
    {
      key: 'business',
      icon: <Building2 size={20} color={colors.fulfillmentProcessing} />,
      tint: colors.fulfillmentProcessing,
      title: 'Business Information',
      description: 'Business details and documents',
      completed: Boolean(seller?.gstNumber && seller?.businessRegistration),
    },
    {
      key: 'shipping',
      icon: <Truck size={20} color={colors.info} />,
      tint: colors.info,
      title: 'Shipping Settings',
      description: 'Delivery zones and shipping options',
      completed: Boolean(
        seller?.workingHours?.open && seller?.workingHours?.close && seller?.workingDays?.length,
      ),
    },
    {
      key: 'bank',
      icon: <Landmark size={20} color={colors.warning} />,
      tint: colors.warning,
      title: 'Bank Details',
      description: 'Add bank account for payouts',
      completed: Boolean(seller?.bank?.accountNumber),
    },
    {
      // No policies field exists on the seller model yet, so this step
      // can never resolve to completed until that contract lands.
      key: 'policies',
      icon: <ShieldCheck size={20} color={colors.fulfillmentProcessing} />,
      tint: colors.fulfillmentProcessing,
      title: 'Shop Policies',
      description: 'Returns, privacy and terms',
      completed: false,
    },
  ];
  const completedCount = setupItems.filter(item => item.completed).length;

  const goToSettings = () => mainStack?.navigate(ROUTES.SETTINGS);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Shop</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage your shop and settings
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => mainStack?.navigate(ROUTES.NOTIFICATIONS)}
              style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Bell size={20} color={colors.textPrimary} />
              <View style={[styles.bellDot, { backgroundColor: colors.warning }]} />
            </Pressable>
            <Pressable
              onPress={goToSettings}
              style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Settings size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <Pressable onPress={goToSettings}>
          <Card style={styles.shopCard}>
            <View style={styles.shopCardTop}>
              {seller?.logo?.url ? (
                <Image source={{ uri: seller.logo.url }} style={styles.logo} />
              ) : (
                <View style={[styles.logo, styles.logoFallback, { backgroundColor: colors.grey100 }]}>
                  <Store size={28} color={colors.textLight} />
                </View>
              )}
              <View style={styles.shopCardInfo}>
                <Text style={[styles.shopName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {shopName}
                </Text>
                <View style={styles.badgeRow}>
                  <Badge label={isOpen ? 'OPEN' : 'CLOSED'} tone={isOpen ? 'success' : 'neutral'} />
                  {seller?.isVerified && (
                    <View style={styles.verifiedRow}>
                      <ShieldCheck size={14} color={colors.info} />
                      <Text style={[styles.verifiedLabel, { color: colors.info }]}>
                        Verified Seller
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <ChevronRight size={20} color={colors.textLight} />
            </View>

            <Text style={[styles.shopCardStatus, { color: colors.textSecondary }]}>
              {isOpen
                ? 'Your shop is live and visible to customers.'
                : 'Your shop is currently closed to customers.'}
            </Text>

            <View style={[styles.shopCardMetaRow, { borderTopColor: colors.divider }]}>
              <View style={styles.shopCardMeta}>
                <View style={[styles.metaIcon, { backgroundColor: colors.info10 }]}>
                  <CalendarDays size={14} color={colors.info} />
                </View>
                <View>
                  <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Joined on</Text>
                  <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{joinedOn}</Text>
                </View>
              </View>
              <View style={styles.shopCardMeta}>
                <View style={[styles.metaIcon, { backgroundColor: colors.info10 }]}>
                  <Tag size={14} color={colors.info} />
                </View>
                <View>
                  <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Shop ID</Text>
                  <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{shopId}</Text>
                </View>
              </View>
            </View>
          </Card>
        </Pressable>

        <Pressable onPress={goToSettings}>
          <View
            style={[
              styles.growCard,
              { backgroundColor: `${colors.success}14`, borderColor: `${colors.success}30` },
            ]}
          >
            <View style={[styles.growIcon, { backgroundColor: `${colors.success}20` }]}>
              <TrendingUp size={22} color={colors.success} />
            </View>
            <View style={styles.growContent}>
              <Text style={[styles.growTitle, { color: colors.textPrimary }]}>Grow your shop</Text>
              <Text style={[styles.growBody, { color: colors.textSecondary }]}>
                Complete these steps to increase visibility and boost sales.
              </Text>
            </View>
            <View style={styles.growProgress}>
              <Text style={[styles.growProgressLabel, { color: colors.success }]}>
                {completedCount}/{setupItems.length} completed
              </Text>
              <View style={[styles.progressTrack, { backgroundColor: `${colors.success}20` }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.success,
                      width: `${(completedCount / setupItems.length) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
            <ChevronRight size={20} color={colors.textLight} style={styles.growChevron} />
          </View>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Shop Performance</Text>
          <Text style={[styles.viewAll, { color: colors.textLink }]}>View all</Text>
        </View>
        {/* Views/visitors/followers have no backing endpoint yet (see
            features/shop/api stub) — zero placeholders like the
            Dashboard and Products screens use until that contract lands.
            No shop rating/reviews concept in this app — removed per
            product decision, not just an unbuilt endpoint. */}
        <View style={styles.perfGrid}>
          <PerfTile
            icon={<Eye size={20} color={colors.fulfillmentProcessing} />}
            tint={colors.fulfillmentProcessing}
            value="0"
            label="Views"
            caption="-- vs last 7 days"
          />
          <PerfTile
            icon={<Users size={20} color={colors.info} />}
            tint={colors.info}
            value="0"
            label="Visitors"
            caption="-- vs last 7 days"
          />
          <PerfTile
            icon={<Heart size={20} color={colors.error} />}
            tint={colors.error}
            value="0"
            label="Followers"
            caption="-- vs last 7 days"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Shop Setup</Text>
          <Pressable onPress={goToSettings}>
            <Text style={[styles.viewAll, { color: colors.textLink }]}>Manage</Text>
          </Pressable>
        </View>
        <Card style={styles.setupCard}>
          {setupItems.map((item, index) => (
            <SetupRow
              key={item.key}
              icon={item.icon}
              tint={item.tint}
              title={item.title}
              description={item.description}
              completed={item.completed}
              isLast={index === setupItems.length - 1}
              onPress={goToSettings}
              colors={colors}
            />
          ))}
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.xl }]}>
          Quick Actions
        </Text>
        <View style={styles.quickGrid}>
          <QuickAction
            icon={<ShoppingBag size={22} color={colors.fulfillmentProcessing} />}
            tint={colors.fulfillmentProcessing}
            label="Add Product"
            onPress={() => navigation.navigate(ROUTES.PRODUCTS)}
            colors={colors}
          />
          <QuickAction
            icon={<ClipboardList size={22} color={colors.info} />}
            tint={colors.info}
            label="Manage Orders"
            onPress={() => navigation.navigate(ROUTES.ORDERS)}
            colors={colors}
          />
          <QuickAction
            icon={<Percent size={22} color={colors.warning} />}
            tint={colors.warning}
            label="Create Offer"
            onPress={() => mainStack?.navigate(ROUTES.OFFERS)}
            colors={colors}
          />
          <QuickAction
            icon={<ImageIcon size={22} color={colors.success} />}
            tint={colors.success}
            label="Edit Shop Banner"
            onPress={goToSettings}
            colors={colors}
          />
        </View>
      </ScrollView>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  shopCard: {
    marginTop: Spacing.lg,
  },
  shopCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopCardInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  shopName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  badgeRow: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  verifiedLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  shopCardStatus: {
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
  },
  shopCardMetaRow: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shopCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  metaIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: {
    fontSize: FontSize.xxs,
  },
  metaValue: {
    marginTop: 1,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  growCard: {
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  growIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  growContent: {
    marginTop: Spacing.md,
  },
  growTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  growBody: {
    marginTop: Spacing.xxs,
    fontSize: FontSize.sm,
    lineHeight: 19,
  },
  growProgress: {
    marginTop: Spacing.md,
  },
  growProgressLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  progressTrack: {
    marginTop: Spacing.sm,
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  growChevron: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
  },
  sectionHeader: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  viewAll: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  perfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  perfTile: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  perfIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  perfValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  perfLabel: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xxs,
  },
  perfCaption: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
  setupCard: {
    padding: 0,
    overflow: 'hidden',
  },
  setupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  setupIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  setupContent: {
    flex: 1,
  },
  setupTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  setupDescription: {
    marginTop: Spacing.xxs,
    fontSize: FontSize.xs,
  },
  setupStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    marginRight: Spacing.sm,
  },
  setupStatusLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.lg + 40 + Spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickAction: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
