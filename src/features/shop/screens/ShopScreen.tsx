import React from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Bell,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Image as ImageIcon,
  Percent,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
} from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useThemeColors } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { getNotifications, markNotificationRead } from '../../notifications/notifications.api';
import { NotificationRow } from '../../notifications/notificationDisplay';
import { navigateFromNotification } from '../../notifications/notificationNavigation';
import { useMe } from '../../auth/hooks/useMe';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import {
  ROUTES,
  type MainStackParamList,
  type MainTabParamList,
} from '../../../navigation/routeConfig';

type Colors = ReturnType<typeof useThemeColors>['colors'];

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
  const goToSettings = () => mainStack?.navigate(ROUTES.SETTINGS);
  const seller = useAuthStore(state => state.seller);
  const queryClient = useQueryClient();

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

  const notificationsQuery = useQuery({
    queryKey: ['seller-notifications', 'list'],
    queryFn: () => getNotifications({ limit: 100 }),
  });
  const meQuery = useMe();

  const isRefreshing = notificationsQuery.isRefetching || meQuery.isRefetching;
  const onRefresh = () => {
    void notificationsQuery.refetch();
    void meQuery.refetch();
  };

  const recentNotifications = (notificationsQuery.data?.items ?? []).slice(0, 4);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['seller-notifications'] }),
  });

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Shop</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage your shop and settings
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={goToSettings}
              style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Settings size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        <Pressable onPress={() => mainStack?.navigate(ROUTES.SHOP_DETAILS)}>
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

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notifications</Text>
          {recentNotifications.length > 0 && (
            <Pressable onPress={() => mainStack?.navigate(ROUTES.NOTIFICATIONS)}>
              <Text style={[styles.viewAll, { color: colors.textLink }]}>View all</Text>
            </Pressable>
          )}
        </View>

        {notificationsQuery.isLoading ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2].map(i => (
              <Skeleton
                key={i}
                width="100%"
                height={92}
                radius={Radius.lg}
                style={{ marginBottom: Spacing.md }}
              />
            ))}
          </View>
        ) : recentNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent10 }]}>
              <Bell size={28} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No notifications
            </Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              You're all caught up — new activity will show up here.
            </Text>
          </View>
        ) : (
          recentNotifications.map(item => (
            <NotificationRow
              key={item._id}
              item={item}
              colors={colors}
              onPress={() => {
                if (!item.isRead) markReadMutation.mutate(item._id);
                if (mainStack) navigateFromNotification(item, mainStack);
              }}
            />
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl, color: colors.textPrimary }]}>
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
            onPress={() => mainStack?.navigate(ROUTES.SHOP_DETAILS, { openBranding: true })}
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
  quickGrid: {
    marginTop: Spacing.md,
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
  skeletonList: {
    marginTop: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  emptyBody: {
    marginTop: Spacing.xs,
    fontSize: FontSize.sm,
    textAlign: 'center',
    maxWidth: 260,
  },
});
