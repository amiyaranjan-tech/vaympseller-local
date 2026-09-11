import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../../store/themeStore';
import { Spacing } from '../../theme/spacing';
import { FontSize, FontWeight } from '../../theme/typography';

interface StepProgressBarProps {
  /** 0-indexed current step. */
  step: number;
  total: number;
}

export function StepProgressBar({ step, total }: StepProgressBarProps) {
  const { colors } = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.accent }]}>
        Step {step + 1} of {total}
      </Text>
      <View style={styles.track}>
        {Array.from({ length: total }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              { backgroundColor: index <= step ? colors.accent : colors.border },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  track: {
    flexDirection: 'row',
    gap: Spacing.xs,
    width: 120,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});
