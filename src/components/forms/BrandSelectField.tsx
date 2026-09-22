import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Check, ChevronDown, Plus } from 'lucide-react-native';

import { BottomSheet } from '../common/BottomSheet';
import { Button } from '../common/Button';
import { useToast } from '../feedback/Toast';
import { useThemeColors } from '../../store/themeStore';
import { Spacing, Radius } from '../../theme/spacing';
import { FontSize, FontWeight } from '../../theme/typography';
import { createBrand } from '../../features/products/taxonomy.api';
import { uploadSellerImage, type UploadedImage } from '../../api/uploads.api';

type Colors = ReturnType<typeof useThemeColors>['colors'];

interface BrandSelectFieldProps {
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  // Lets the picker's list include a brand just added elsewhere without
  // waiting for the parent's own next fetch.
  onBrandAdded?: () => void;
}

export function BrandSelectField({ value, options, onSelect, onBrandAdded }: BrandSelectFieldProps) {
  const { colors } = useThemeColors();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');

  const filtered = options.filter(option =>
    option.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const exactMatch = options.some(
    option => option.toLowerCase() === search.trim().toLowerCase(),
  );

  const openAddBrand = (prefill: string) => {
    setNewBrandName(prefill);
    setPickerOpen(false);
    setAddOpen(true);
  };

  const handleCreated = (name: string) => {
    setSearch('');
    onSelect(name);
    onBrandAdded?.();
  };

  return (
    <View style={styles.selectContainer}>
      <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Brand</Text>
      <Pressable
        onPress={() => setPickerOpen(true)}
        style={[styles.selectField, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
      >
        <Text
          style={[styles.selectValue, { color: value ? colors.textPrimary : colors.inputPlaceholder }]}
          numberOfLines={1}
        >
          {value || 'Select brand'}
        </Text>
        <ChevronDown size={18} color={colors.textLight} />
      </Pressable>

      <BottomSheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Brand</Text>

        <View style={[styles.searchField, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search or add a new brand"
            placeholderTextColor={colors.inputPlaceholder}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>

        <ScrollView style={styles.sheetList}>
          {filtered.map(option => (
            <Pressable
              key={option}
              onPress={() => {
                onSelect(option);
                setSearch('');
                setPickerOpen(false);
              }}
              style={styles.sheetRow}
            >
              <Text style={[styles.sheetRowLabel, { color: colors.textPrimary }]}>{option}</Text>
              {value === option && <Check size={18} color={colors.accent} />}
            </Pressable>
          ))}

          {!!search.trim() && !exactMatch && (
            <Pressable
              onPress={() => openAddBrand(search.trim())}
              style={[styles.addRow, { borderColor: colors.accent }]}
            >
              <Plus size={16} color={colors.accent} />
              <Text style={[styles.addRowLabel, { color: colors.accent }]}>
                Add &quot;{search.trim()}&quot; as a new brand
              </Text>
            </Pressable>
          )}
        </ScrollView>

        <Pressable onPress={() => openAddBrand('')} style={styles.addNewLink}>
          <Plus size={14} color={colors.accent} />
          <Text style={[styles.addNewLinkLabel, { color: colors.accent }]}>Add a new brand</Text>
        </Pressable>
      </BottomSheet>

      <AddBrandSheet
        visible={addOpen}
        initialName={newBrandName}
        colors={colors}
        onClose={() => setAddOpen(false)}
        onCreated={handleCreated}
      />
    </View>
  );
}

function AddBrandSheet({
  visible,
  initialName,
  colors,
  onClose,
  onCreated,
}: {
  visible: boolean;
  initialName: string;
  colors: Colors;
  onClose: () => void;
  onCreated: (name: string) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(initialName);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  // BottomSheet stays mounted across opens — resync local state whenever
  // it's (re)opened with a different prefill instead of only on first mount.
  React.useEffect(() => {
    if (visible) {
      setName(initialName);
      setImage(null);
    }
  }, [visible, initialName]);

  const pickLogo = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 });
    if (result.didCancel) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) {
      toast.show({ type: 'error', title: "Couldn't read that image" });
      return;
    }

    setUploadingLogo(true);
    try {
      setImage(
        await uploadSellerImage({
          uri: asset.uri,
          type: asset.type ?? 'image/jpeg',
          name: asset.fileName ?? `brand-logo-${Date.now()}.jpg`,
        }),
      );
    } catch {
      toast.show({ type: 'error', title: 'Logo upload failed' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.show({ type: 'error', title: 'Brand name is required' });
      return;
    }

    setSaving(true);
    try {
      const brand = await createBrand(name.trim(), image ?? undefined);
      toast.show({ type: 'success', title: 'Brand added' });
      onCreated(brand.value);
      onClose();
    } catch (error) {
      toast.show({
        type: 'error',
        title: "Couldn't add brand",
        message: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Add a new brand</Text>

      <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Brand name</Text>
      <View style={[styles.searchField, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Urban Loom"
          placeholderTextColor={colors.inputPlaceholder}
          style={[styles.searchInput, { color: colors.textPrimary }]}
        />
      </View>

      <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Logo (optional)</Text>
      <Pressable
        onPress={pickLogo}
        style={[styles.logoTile, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
      >
        {uploadingLogo ? (
          <ActivityIndicator color={colors.accent} />
        ) : image ? (
          <Image source={{ uri: image.url }} style={styles.logoImage} />
        ) : (
          <Plus size={20} color={colors.textLight} />
        )}
      </Pressable>

      <Button
        label="Add brand"
        onPress={handleSave}
        loading={saving}
        disabled={uploadingLogo}
        style={styles.saveButton}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  selectContainer: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  selectValue: {
    flex: 1,
    fontSize: FontSize.md,
    marginRight: Spacing.sm,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  searchField: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  searchInput: {
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
  },
  sheetList: {
    maxHeight: 300,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  sheetRowLabel: {
    fontSize: FontSize.md,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderTopWidth: 1,
    paddingVertical: Spacing.md,
  },
  addRowLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    flexShrink: 1,
  },
  addNewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  addNewLinkLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  logoTile: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  saveButton: {
    marginTop: Spacing.xs,
  },
});
