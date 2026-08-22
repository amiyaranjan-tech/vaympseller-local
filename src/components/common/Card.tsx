import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useThemeColors } from '../../store/themeStore';
import { Radius, Spacing } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  const { colors } = useThemeColors();

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
});
