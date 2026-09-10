import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Plus, Trash2, UserRound } from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { BottomSheet } from '../../../components/common/BottomSheet';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { FieldLabel, CountedInput } from '../../../components/forms/ProductFormFields';
import { useThemeColors } from '../../../store/themeStore';
import { useToast } from '../../../components/feedback/Toast';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import type { MainStackParamList } from '../../../navigation/routeConfig';
import {
  createStaff,
  getStaff,
  removeStaff,
  updateStaffStatus,
  type SellerStaffMember,
} from '../staff.api';

type Nav = NativeStackNavigationProp<MainStackParamList, 'ManageHelpers'>;

export function ManageHelpersScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<Nav>();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const staffQuery = useQuery({
    queryKey: ['seller-staff', 'list'],
    queryFn: getStaff,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['seller-staff'] });

  const createMutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      setFormOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      void invalidate();
      toast.show({ type: 'success', title: 'Helper account created' });
    },
    onError: (error: Error) => {
      toast.show({ type: 'error', title: "Couldn't create helper", message: error.message });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      updateStaffStatus(id, status),
    onSuccess: () => void invalidate(),
    onError: (error: Error) => {
      toast.show({ type: 'error', title: "Couldn't update helper", message: error.message });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeStaff(id),
    onSuccess: () => {
      void invalidate();
      toast.show({ type: 'success', title: 'Helper removed' });
    },
    onError: (error: Error) => {
      toast.show({ type: 'error', title: "Couldn't remove helper", message: error.message });
    },
  });

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && password.length >= 8;

  const staff = staffQuery.data?.staff ?? [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <ChevronLeft size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Manage Helpers</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Helpers can approve orders and create or edit products, but can't see finance, offers, shop
          settings, or notifications.
        </Text>

        {staffQuery.isLoading ? (
          <View style={styles.skeletonList}>
            {[0, 1].map(i => (
              <Skeleton key={i} width="100%" height={80} radius={Radius.lg} style={{ marginBottom: Spacing.md }} />
            ))}
          </View>
        ) : staff.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.accent10 }]}>
              <UserRound size={28} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No helpers yet</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              Add a helper account to let someone assist with orders and products.
            </Text>
          </View>
        ) : (
          staff.map(member => (
            <HelperRow
              key={member._id}
              member={member}
              colors={colors}
              onToggleStatus={() =>
                statusMutation.mutate({
                  id: member._id,
                  status: member.status === 'active' ? 'inactive' : 'active',
                })
              }
              onRemove={() => removeMutation.mutate(member._id)}
              busy={
                (statusMutation.isPending && statusMutation.variables?.id === member._id) ||
                (removeMutation.isPending && removeMutation.variables === member._id)
              }
            />
          ))
        )}

        <Button
          label="Add Helper"
          leftIcon={<Plus size={18} color={colors.buttonPrimaryText} />}
          onPress={() => setFormOpen(true)}
          style={styles.addButton}
        />
      </ScrollView>

      <BottomSheet visible={formOpen} onClose={() => setFormOpen(false)}>
        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Add Helper</Text>

        <FieldLabel label="Name" required colors={colors} />
        <CountedInput value={name} onChangeText={setName} placeholder="Helper's name" maxLength={60} colors={colors} />

        <View style={{ marginTop: Spacing.md }}>
          <FieldLabel label="Email" required colors={colors} />
          <CountedInput
            value={email}
            onChangeText={setEmail}
            placeholder="helper@example.com"
            maxLength={80}
            keyboardType="default"
            colors={colors}
          />
        </View>

        <View style={{ marginTop: Spacing.md }}>
          <FieldLabel label="Password" required colors={colors} />
          <CountedInput
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            maxLength={40}
            colors={colors}
          />
        </View>

        <Button
          label="Create Helper"
          onPress={() =>
            createMutation.mutate({ name: name.trim(), email: email.trim(), password })
          }
          loading={createMutation.isPending}
          disabled={!canSubmit}
          style={{ marginTop: Spacing.lg }}
        />
      </BottomSheet>
    </Screen>
  );
}

function HelperRow({
  member,
  colors,
  onToggleStatus,
  onRemove,
  busy,
}: {
  member: SellerStaffMember;
  colors: ReturnType<typeof useThemeColors>['colors'];
  onToggleStatus: () => void;
  onRemove: () => void;
  busy: boolean;
}) {
  const isActive = member.status === 'active';

  return (
    <Card style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: colors.accent10 }]}>
        <UserRound size={20} color={colors.accent} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowName, { color: colors.textPrimary }]} numberOfLines={1}>
          {member.name}
        </Text>
        <Text style={[styles.rowEmail, { color: colors.textSecondary }]} numberOfLines={1}>
          {member.email}
        </Text>
        <View style={styles.rowActions}>
          <Badge label={isActive ? 'Active' : 'Inactive'} tone={isActive ? 'success' : 'neutral'} />
          <Pressable onPress={onToggleStatus} disabled={busy} hitSlop={8}>
            <Text style={[styles.actionLabel, { color: colors.textLink }]}>
              {isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </Pressable>
        </View>
      </View>
      <Pressable onPress={onRemove} disabled={busy} hitSlop={8} style={styles.deleteButton}>
        <Trash2 size={18} color={colors.error} />
      </Pressable>
    </Card>
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
    marginBottom: Spacing.lg,
    fontSize: FontSize.sm,
    lineHeight: 20,
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  rowContent: {
    flex: 1,
  },
  rowName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  rowEmail: {
    marginTop: 2,
    fontSize: FontSize.xs,
  },
  rowActions: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  deleteButton: {
    padding: Spacing.xxs,
  },
  addButton: {
    marginTop: Spacing.md,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.lg,
  },
});
