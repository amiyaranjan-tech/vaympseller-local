import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useThemeColors } from '../../store/themeStore';
import { Radius } from '../../theme/spacing';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

// Single shimmer primitive — feature screens compose several of these into
// a skeleton layout that mirrors their real content shape.
export function Skeleton({
  width = '100%',
  height = 16,
  radius = Radius.sm,
  style,
}: SkeletonProps) {
  const { colors } = useThemeColors();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.skeletonBase,
          opacity,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
