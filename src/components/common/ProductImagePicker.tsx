import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
      maxWidth: 1280,
      maxHeight: 1280,
    });
    if (result.didCancel) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) {
      toast.show({ type: 'error', title: "Couldn't read that image" });
      return;
    }

    setProcessing(true);
    try {
      const uploaded = await uploadSellerImage({
        uri: asset.uri,
        type: asset.type ?? 'image/jpeg',
        name: asset.fileName ?? `photo-${Date.now()}.jpg`,
      });
      onChange([...images, uploaded]);
    } catch {
      toast.show({ type: 'error', title: 'Image upload failed' });
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
