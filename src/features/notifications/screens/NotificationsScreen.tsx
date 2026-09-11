import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, ChevronLeft, CircleCheck } from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useThemeColors } from '../../../store/themeStore';
import { useToast } from '../../../components/feedback/Toast';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import type { MainStackParamList } from '../../../navigation/routeConfig';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../notifications.api';
import { GROUPS, TYPE_META, type Group, NotificationRow } from '../notificationDisplay';
import { navigateFromNotification } from '../notificationNavigation';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Notifications'>;

export function NotificationsScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<Nav>();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [group, setGroup] = useState<Group>('All');

  const query = useQuery({
    queryKey: ['seller-notifications', 'list'],
    queryFn: () => getNotifications({ limit: 100 }),
  });

  const items = query.data?.items ?? [];
  const unreadCount = items.filter(n => !n.isRead).length;
  const filtered = group === 'All' ? items : items.filter(n => TYPE_META[n.type].group === group);

  const groupCounts: Record<Group, number> = {
    All: items.length,
    Orders: items.filter(n => TYPE_META[n.type].group === 'Orders').length,
    Products: items.filter(n => TYPE_META[n.type].group === 'Products').length,
    Finance: items.filter(n => TYPE_META[n.type].group === 'Finance').length,
    System: items.filter(n => TYPE_META[n.type].group === 'System').length,
  };

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['seller-notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['seller-notifications'] });
      toast.show({ type: 'success', title: 'All notifications marked read' });
    },
    onError: (error: Error) => {
      toast.show({ type: 'error', title: "Couldn't update notifications", message: error.message });
    },
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
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Stay updated on your shop activity
          </Text>
        </View>
        {unreadCount > 0 ? (
          <Pressable
            onPress={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            style={[styles.markAllButton, { borderColor: colors.accent }]}
          >
            <CircleCheck size={15} color={colors.accent} />
            <Text style={[styles.markAllLabel, { color: colors.accent }]}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.groupTabs}
        contentContainerStyle={styles.groupTabsContent}
      >
        {GROUPS.map(g => {
          const isActive = g === group;
          return (
            <Pressable
              key={g}
              onPress={() => setGroup(g)}
              style={[
                styles.groupPill,
                {
                  backgroundColor: isActive ? colors.accent : colors.card,
                  borderColor: isActive ? colors.accent : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.groupPillLabel,
                  { color: isActive ? colors.textInverse : colors.textPrimary },
                ]}
              >
                {g}
              </Text>
              <View
                style={[
                  styles.groupCount,
                  { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.grey200 },
                ]}
              >
                <Text
                  style={[
                    styles.groupCountLabel,
                    { color: isActive ? colors.textInverse : colors.textSecondary },
                  ]}
                >
                  {groupCounts[g]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {query.isLoading ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2, 3].map(i => (
              <Skeleton
                key={i}
                width="100%"
                height={92}
                radius={Radius.lg}
                style={{ marginBottom: Spacing.md }}
              />
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent10 }]}>
              <Bell size={32} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No notifications</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              {group === 'All'
                ? "You're all caught up — new activity will show up here."
                : `No ${group.toLowerCase()} notifications right now.`}
            </Text>
          </View>
        ) : (
          filtered.map(item => (
            <NotificationRow
              key={item._id}
              item={item}
              colors={colors}
              onPress={() => {
                if (!item.isRead) markReadMutation.mutate(item._id);
                navigateFromNotification(item, navigation);
              }}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  headerText: {
    flex: 1,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    marginTop: 2,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 36,
  },
  markAllLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  groupTabs: {
    marginTop: Spacing.lg,
    flexGrow: 0,
  },
  groupTabsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  groupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 36,
  },
  groupPillLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  groupCount: {
    minWidth: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  groupCountLabel: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  skeletonList: {
    marginTop: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
  },
  emptyIcon: {
    width: 72,
    height: 72,
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
