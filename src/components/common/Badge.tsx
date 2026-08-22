import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../../store/themeStore';
import { Radius, Spacing } from '../../theme/spacing';
import { FontSize, FontWeight } from '../../theme/typography';
import { Colors } from '../../theme/color';

// One badge component, driven by a color-token pair, so every status enum
// in the app (product review, order fulfillment, seller verification,
// support ticket, offer state, payout) reuses this instead of a bespoke
// pill per feature. Feature modules define their own `label -> tone`
// mapping (e.g. features/products/statusTone.ts) and pass the resolved
// tone here.
export type BadgeTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

// Colors has one non-string token (chartPalette, an array) — narrow to
// only the string-valued keys so `colors[token]` below type-checks as a
// ColorValue instead of widening to the whole union.
type StringColorToken = {
  [K in keyof typeof Colors]: (typeof Colors)[K] extends string ? K : never;
}[keyof typeof Colors];

const TONE_KEYS: Record<
  BadgeTone,
  { fg: StringColorToken; bg: StringColorToken }
> = {
  neutral: { fg: 'neutral', bg: 'neutral10' },
  info: { fg: 'info', bg: 'info10' },
  success: { fg: 'success', bg: 'success10' },
  warning: { fg: 'warning', bg: 'warning10' },
  error: { fg: 'error', bg: 'error10' },
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const { colors } = useThemeColors();
  const keys = TONE_KEYS[tone];

  return (
    <View style={[styles.base, { backgroundColor: colors[keys.bg] }]}>
      <Text style={[styles.label, { color: colors[keys.fg] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
  },
  label: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
