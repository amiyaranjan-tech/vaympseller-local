import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';

import { useThemeColors } from '../../store/themeStore';
import { Spacing } from '../../theme/spacing';

interface ImageCarouselProps {
  images: { url: string }[];
  width: number;
  height: number;
  fallback: React.ReactNode;
}

// Plain paging ScrollView + dot indicators — no external carousel
// library, this app has no swiper dependency installed and a handful of
// product photos doesn't need one.
export function ImageCarousel({ images, width, height, fallback }: ImageCarouselProps) {
  const { colors } = useThemeColors();
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return <View style={{ width, height }}>{fallback}</View>;
  }

  if (images.length === 1) {
    return <Image source={{ uri: images[0].url }} style={{ width, height }} />;
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  return (
    <View style={{ width, height }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={32}
      >
        {images.map((img, i) => (
          <Image key={`${img.url}-${i}`} source={{ uri: img.url }} style={{ width, height }} />
        ))}
      </ScrollView>

      <View style={styles.dots} pointerEvents="none">
        {images.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === index ? colors.textInverse : 'rgba(255,255,255,0.5)',
                width: i === index ? 14 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
