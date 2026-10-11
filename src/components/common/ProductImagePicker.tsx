import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet } from 'react-native';
import { GestureDetector, ScrollView, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { launchImageLibrary } from 'react-native-image-picker';
import { Plus, X } from 'lucide-react-native';

import { uploadSellerImage } from '../../api/uploads.api';
import { useThemeColors } from '../../store/themeStore';
import { useToast } from '../feedback/Toast';
import { Spacing, Radius } from '../../theme/spacing';

export interface PickerImage {
  url: string;
  publicId: string;
  alt?: string;
}

interface ProductImagePickerProps {
  images: PickerImage[];
  onChange: (images: PickerImage[]) => void;
  max?: number;
}

const TILE = 84;
const STEP = TILE + Spacing.sm; // tile width + row gap

interface DraggableTileProps {
  index: number;
  count: number;
  onDragStart: () => void;
  onDrop: (from: number, to: number) => void;
  children: React.ReactNode;
}

// Long-press a tile, then drag sideways to move it; it lands on the slot nearest where it's let go.
function DraggableTile({ index, count, onDragStart, onDrop, children }: DraggableTileProps) {
  const tx = useSharedValue(0);
  const lifted = useSharedValue(0);

  const pan = usePanGesture({
    activateAfterLongPress: 250,
    onActivate: () => {
      'worklet';
      lifted.value = withSpring(1);
      scheduleOnRN(onDragStart);
    },
    onUpdate: e => {
      'worklet';
      tx.value = e.translationX;
    },
    onFinalize: () => {
      'worklet';
      const to = Math.max(0, Math.min(count - 1, index + Math.round(tx.value / STEP)));
      tx.value = 0;
      lifted.value = withSpring(0);
      scheduleOnRN(onDrop, index, to);
    },
  });

  const style = useAnimatedStyle(() => ({
    zIndex: lifted.value > 0 ? 1 : 0,
    opacity: 1 - lifted.value * 0.2,
    transform: [{ translateX: tx.value }, { scale: 1 + lifted.value * 0.08 }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.tile, style]}>{children}</Animated.View>
    </GestureDetector>
  );
}

export function ProductImagePicker({ images, onChange, max = 6 }: ProductImagePickerProps) {
  const { colors } = useThemeColors();
  const toast = useToast();
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleAdd = async () => {
    if (processing || images.length >= max) return;

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      // Several at once, up to the remaining slots.
      selectionLimit: max - images.length,
      maxWidth: 1280,
      maxHeight: 1280,
    });
    if (result.didCancel) return;

    const assets = (result.assets ?? []).filter(asset => asset.uri);
    if (assets.length === 0) {
      toast.show({ type: 'error', title: "Couldn't read that image" });
      return;
    }

    setProcessing(true);
    try {
      const results = await Promise.allSettled(
        assets.map((asset, i) =>
          uploadSellerImage({
            uri: asset.uri!,
            type: asset.type ?? 'image/jpeg',
            name: asset.fileName ?? `photo-${Date.now()}-${i}.jpg`,
          }),
        ),
      );
      const uploaded = results.flatMap(r => (r.status === 'fulfilled' ? [r.value] : []));
      if (uploaded.length > 0) onChange([...images, ...uploaded].slice(0, max));

      const failed = results.length - uploaded.length;
      if (failed > 0) {
        toast.show({ type: 'error', title: `${failed} image${failed > 1 ? 's' : ''} failed to upload` });
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleRemove = (publicId: string) => {
    onChange(images.filter(img => img.publicId !== publicId));
  };

  const handleDrop = (from: number, to: number) => {
    setDragging(false);
    if (from === to) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <ScrollView
      horizontal
      scrollEnabled={!dragging}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {images.map((img, i) => (
        <DraggableTile
          key={img.publicId || img.url}
          index={i}
          count={images.length}
          onDragStart={() => setDragging(true)}
          onDrop={handleDrop}
        >
          <Image source={{ uri: img.url }} style={styles.image} />
          <Pressable
            onPress={() => handleRemove(img.publicId)}
            hitSlop={8}
            style={[styles.removeButton, { backgroundColor: colors.error }]}
          >
            <X size={12} color={colors.textInverse} />
          </Pressable>
        </DraggableTile>
      ))}

      {images.length < max && (
        <Pressable
          onPress={handleAdd}
          disabled={processing}
          style={[styles.addTile, { borderColor: colors.accent, backgroundColor: colors.accent10 }]}
        >
          {processing ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Plus size={22} color={colors.accent} />
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.sm,
  },
  tile: {
    width: TILE,
    height: TILE,
  },
  image: {
    width: TILE,
    height: TILE,
    borderRadius: Radius.md,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    width: TILE,
    height: TILE,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
