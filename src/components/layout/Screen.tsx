import React from 'react';
import { StatusBar, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useThemeColors } from '../../store/themeStore';
import { DarkColors } from '../../theme/darkColor';

interface ScreenProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  scrollable?: false;
}

// Themed safe-area wrapper every screen renders into — background always
// comes from the resolved palette, so a screen never has to know it's
// light vs dark.
export function Screen({ children, edges = ['top', 'left', 'right'], style }: ScreenProps) {
  const { colors } = useThemeColors();
  // `mode` can be 'system', so resolve the actual bar style off which
  // palette object won (identity check — colors is always one of the two
  // module singletons), not off the raw mode string.
  const isDark = colors === DarkColors;

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.base, { backgroundColor: colors.background }, style]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
