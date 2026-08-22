import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../../store/themeStore';
import { Spacing } from '../../theme/spacing';
import { FontSize, FontWeight } from '../../theme/typography';
import { Button } from '../common/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors } = useThemeColors();

  return (
    <View style={styles.container}>
      {icon}
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xxl,
  },
  title: {
    marginTop: Spacing.md,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  action: {
    marginTop: Spacing.lg,
    minWidth: 160,
  },
});
