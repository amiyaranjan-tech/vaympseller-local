import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Plus, X } from 'lucide-react-native';

import { useThemeColors } from '../../store/themeStore';
import { useToast } from '../feedback/Toast';
import { uploadImageToCloudinary } from '../../utils/cloudinaryUpload';
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

// Direct-to-Cloudinary upload (see utils/cloudinaryUpload.ts) — the
// backend never sees the file bytes, just hands back a signed upload URL.
// Local-only until Save/Save Changes actually persists the resulting
// `images` array on the product.
export function ProductImagePicker({ images, onChange, max = 6 }: ProductImagePickerProps) {
  const { colors } = useThemeColors();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);

  const handleAdd = async () => {
    if (uploading || images.length >= max) return;

    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 });
    if (result.didCancel || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      const uploaded = await uploadImageToCloudinary({
        uri: asset.uri!,
        name: asset.fileName ?? 'photo.jpg',
        type: asset.type ?? 'image/jpeg',
      });
      onChange([...images, uploaded]);
    } catch (error) {
      toast.show({
        type: 'error',
        title: "Couldn't upload image",
        message: error instanceof Error ? error.message : 'Something went wrong.',
      });
    } finally {
      setUploading(false);
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
          disabled={uploading}
          style={[styles.addTile, { borderColor: colors.accent, backgroundColor: colors.accent10 }]}
        >
          {uploading ? (
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
