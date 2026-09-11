import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Plus, X } from 'lucide-react-native';

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

// ponytail: no Cloudinary for now — the picked photo is base64-encoded
// on-device into a `data:` URI and stored directly in the product's own
// `images[].url` (Mongo document, no separate upload/CDN step). Simple
// and always works, but every image now lives inline in the product
// document: MongoDB caps a document at 16MB, and Express's JSON body
// limit here is 10mb (server.js), so this doesn't scale to many/large
// photos. maxWidth/maxHeight below keeps each photo small enough that a
// handful comfortably fit either limit. Swap back to real Cloudinary
// upload (see git history for utils/cloudinaryUpload.ts) once that
// matters.
export function ProductImagePicker({ images, onChange, max = 6 }: ProductImagePickerProps) {
  const { colors } = useThemeColors();
  const toast = useToast();
  const [processing, setProcessing] = useState(false);

  const handleAdd = async () => {
    if (processing || images.length >= max) return;

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
      includeBase64: true,
      maxWidth: 1280,
      maxHeight: 1280,
    });
    if (result.didCancel) return;

    const asset = result.assets?.[0];
    if (!asset?.base64) {
      toast.show({ type: 'error', title: "Couldn't read that image" });
      return;
    }

    setProcessing(true);
    try {
      const mimeType = asset.type ?? 'image/jpeg';
      onChange([
        ...images,
        {
          url: `data:${mimeType};base64,${asset.base64}`,
          publicId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
      ]);
    } finally {
      setProcessing(false);
    }
  };

  const handleRemove = (publicId: string) => {
    onChange(images.filter(img => img.publicId !== publicId));
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {images.map(img => (
        <View key={img.publicId || img.url} style={styles.tile}>
          <Image source={{ uri: img.url }} style={styles.image} />
          <Pressable
            onPress={() => handleRemove(img.publicId)}
            hitSlop={8}
            style={[styles.removeButton, { backgroundColor: colors.error }]}
          >
            <X size={12} color={colors.textInverse} />
          </Pressable>
        </View>
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
