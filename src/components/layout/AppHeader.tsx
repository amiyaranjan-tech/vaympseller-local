import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../../store/themeStore';
import { Spacing } from '../../theme/spacing';
import { FontSize, FontWeight } from '../../theme/typography';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

// Plain chevron/text back control — no icon library in this app (see
// react-native-svg note in Phase 1 spec), so a "<" glyph stands in rather
// than pulling in vector-icons for one arrow.
export function AppHeader({ title, onBack, right }: AppHeaderProps) {
  const { colors } = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.navBackground, borderBottomColor: colors.navBorder },
      ]}
    >
      <View style={styles.side}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
            <Text style={[styles.backGlyph, { color: colors.navIconActive }]}>‹</Text>
          </Pressable>
        ) : null}
      </View>

      <Text
        style={[styles.title, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={[styles.side, styles.rightSide]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
  },
  side: {
    width: 48,
    justifyContent: 'center',
  },
  rightSide: {
    alignItems: 'flex-end',
  },
  backButton: {
    padding: Spacing.xs,
    alignSelf: 'flex-start',
  },
  backGlyph: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.semibold,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
  },
});
