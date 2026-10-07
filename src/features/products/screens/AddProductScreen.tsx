import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, ChevronDown, ChevronLeft, Plus, X } from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { FormScrollView } from '../../../components/layout/FormScrollView';
import { Button } from '../../../components/common/Button';
import { BottomSheet } from '../../../components/common/BottomSheet';
import { ProductImagePicker, type PickerImage } from '../../../components/common/ProductImagePicker';
import { FieldLabel, CountedInput, SelectField, FlagCheckbox } from '../../../components/forms/ProductFormFields';
import { BrandSelectField } from '../../../components/forms/BrandSelectField';
import { useThemeColors } from '../../../store/themeStore';
import { useToast } from '../../../components/feedback/Toast';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import type { MainStackParamList } from '../../../navigation/routeConfig';
import { createProduct, type ProductGender, type ProductPayload, type ProductVariant } from '../products.api';
import { getOffers } from '../../deals/offers.api';
import { useProductTaxonomy } from '../useProductTaxonomy';
import { PricingBreakdown, discountedPrice } from '../PricingBreakdown';

type Colors = ReturnType<typeof useThemeColors>['colors'];

// Mirrors the admin panel's own product wizard (src/pages/products/
// ProductForm.tsx) step-for-step — Basics/Pricing/Inventory/Attributes/
// Offers/Media — so a seller's flow matches what an admin sees when
// editing the same product.
const STEPS = [
  { label: 'Basics', hint: 'Name it and place it in the catalog.' },
  { label: 'Pricing', hint: 'Set the MRP and your discount.' },
  { label: 'Inventory', hint: 'Sizes and how many you have of each.' },
  { label: 'Attributes', hint: 'Details shoppers filter by.' },
  { label: 'Offers', hint: 'Highlights, returns and deals.' },
  { label: 'Media', hint: 'Photos sell — add a few good ones.' },
];

const MAX_IMAGES = 8;

type AddProductNav = NativeStackNavigationProp<MainStackParamList, 'AddProduct'>;

interface VariantRow {
  size: string;
  color: string;
  sku: string;
  stock: string;
}

const emptyVariant = (): VariantRow => ({ size: '', color: '', sku: '', stock: '' });

// Compact size picker for a variant row — pick from the taxonomy's list,
// same as the admin panel's per-row size Combobox.
function VariantSizePicker({
  value,
  options,
  onSelect,
  colors,
}: {
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  colors: Colors;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.sizeField, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
      >
        <Text
          style={[styles.sizeValue, { color: value ? colors.textPrimary : colors.inputPlaceholder }]}
          numberOfLines={1}
        >
          {value || 'Size'}
        </Text>
        <ChevronDown size={16} color={colors.textLight} />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Size</Text>
        <ScrollView style={styles.sheetList} keyboardShouldPersistTaps="handled">
          {options.map(option => (
            <Pressable
              key={option}
              onPress={() => {
                onSelect(option);
                setOpen(false);
              }}
              style={[styles.sheetRow, { borderBottomColor: colors.divider }]}
            >
              <Text style={[styles.sheetRowLabel, { color: colors.textPrimary }]}>{option}</Text>
              {value === option && <Check size={18} color={colors.accent} />}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
    </>
  );
}

function PlainInput({
  value,
  onChangeText,
  placeholder,
  colors,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  colors: Colors;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.inputPlaceholder}
      style={[
        styles.plainInput,
        { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary },
      ]}
    />
  );
}

function ErrorText({ children, colors }: { children: string; colors: Colors }) {
  return <Text style={[styles.errorText, { color: colors.error }]}>{children}</Text>;
}

export function AddProductScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<AddProductNav>();
  const toast = useToast();

  const [step, setStep] = useState(0);

  // Basics
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [tags, setTags] = useState('');

  // Pricing — the seller types MRP and their discount %; the rest is a
  // read-only breakdown (see PricingBreakdown).
  const [sellingPrice, setSellingPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');

  // Inventory
  const [variants, setVariants] = useState<VariantRow[]>([emptyVariant()]);

  // Attributes
  const [color, setColor] = useState('');
  const [season, setSeason] = useState('All');
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [attributeSheetOpen, setAttributeSheetOpen] = useState(false);
  const [attrKey, setAttrKey] = useState('');
  const [attrValue, setAttrValue] = useState('');

  // Offers
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isLimitedStock, setIsLimitedStock] = useState(false);
  const [isReturnable, setIsReturnable] = useState(true);
  const [excludeFromShopDeals, setExcludeFromShopDeals] = useState(false);
  // Try & Buy is derived server-side from isReturnable; Inner Wear is never returnable.
  const isInnerWear = category === 'Inner Wear';

  // Media
  const [images, setImages] = useState<PickerImage[]>([]);
  const [video, setVideo] = useState('');

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const {
    genderOptions,
    categoryOptions,
    subcategoryOptions,
    colorOptions,
    seasonOptions,
    sizeOptions,
    brandOptions,
    refreshBrands,
  } = useProductTaxonomy(gender.toLowerCase(), category, subcategory);

  // The shop's running store-wide deals — the Offers step asks whether
  // this product takes part in them (same as the admin form).
  const offersQuery = useQuery({
    queryKey: ['seller-offers', 'store-wide'],
    queryFn: () => getOffers({ limit: 50 }),
  });
  const shopDeals = useMemo(() => {
    const now = Date.now();
    return (offersQuery.data?.items ?? []).filter(
      o =>
        o.scope === 'entire_shop' &&
        o.isEnabled &&
        (!o.startDate || new Date(o.startDate).getTime() <= now) &&
        (!o.endDate || new Date(o.endDate).getTime() >= now),
    );
  }, [offersQuery.data]);
  const includeLabel = `Include in ${shopDeals.map(o => o.title).join(', ')}`;

  const createMutation = useMutation({
    mutationFn: (payload: ProductPayload) => createProduct(payload),
    onError: (error: Error) => {
      toast.show({ type: 'error', title: "Couldn't create product", message: error.message });
    },
    onSuccess: () => {
      toast.show({ type: 'success', title: 'Product saved as draft' });
      navigation.goBack();
    },
  });

  const setGenderAndReset = (value: string) => {
    setGender(value);
    setCategory('');
    setSubcategory('');
  };

  const setCategoryAndReset = (value: string) => {
    setCategory(value);
    setSubcategory('');
  };

  const validateStep = (index: number): boolean => {
    const nextErrors: Record<string, boolean> = {};

    if (index === 0) {
      nextErrors.name = !name.trim();
      nextErrors.description = !description.trim();
      nextErrors.gender = !gender;
      nextErrors.category = !category;
      nextErrors.subcategory = !subcategory;
    } else if (index === 1) {
      nextErrors.sellingPrice = !(Number(sellingPrice) > 0);
      nextErrors.discountPercent =
        !discountPercent.trim() || !(Number(discountPercent) >= 0 && Number(discountPercent) <= 100);
    } else if (index === 2) {
      nextErrors.variants = variants.length === 0 || variants.some(v => !v.size.trim());
    }

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const goNext = () => {
    if (!validateStep(step)) {
      toast.show({ type: 'error', title: 'Fill in the required fields to continue' });
      return;
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const goBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  // Jumping ahead still validates every step in between.
  const goToStep = (target: number) => {
    if (target <= step) {
      setStep(target);
      return;
    }
    for (let i = step; i < target; i++) {
      if (!validateStep(i)) {
        setStep(i);
        return;
      }
    }
    setStep(target);
  };

  // Defaults the new row to the first size not already used by another
  // row, same as the admin form's addVariant.
  const addVariant = () =>
    setVariants(prev => {
      const nextSize = sizeOptions.find(
        option => !prev.some(v => v.size.toLowerCase() === option.toLowerCase()),
      );
      return [...prev, { ...emptyVariant(), size: nextSize ?? '' }];
    });
  const removeVariant = (index: number) => setVariants(prev => prev.filter((_, i) => i !== index));
  const updateVariant = (index: number, patch: Partial<VariantRow>) =>
    setVariants(prev => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  const addAttribute = () => {
    if (!attrKey.trim() || !attrValue.trim()) return;
    setAttributes(prev => ({ ...prev, [attrKey.trim()]: attrValue.trim() }));
    setAttrKey('');
    setAttrValue('');
    setAttributeSheetOpen(false);
  };

  const removeAttribute = (key: string) => {
    setAttributes(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = () => {
    for (const i of [0, 1, 2]) {
      if (!validateStep(i)) {
        setStep(i);
        toast.show({ type: 'error', title: 'Some required fields are missing' });
        return;
      }
    }

    const payloadVariants: ProductVariant[] = variants
      .filter(v => v.size.trim())
      .map(v => ({
        size: v.size.trim(),
        color: v.color.trim() || undefined,
        sku: v.sku.trim() || undefined,
        stock: Number(v.stock) || 0,
      }));

    createMutation.mutate({
      name,
      description,
      gender: (gender.toLowerCase() || undefined) as ProductGender | undefined,
      brand,
      category,
      subcategory,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      sellingPrice: Number(sellingPrice) || 0,
      sellerPrice: discountedPrice(sellingPrice, discountPercent),
      variants: payloadVariants,
      color,
      season,
      attributes,
      isFeatured,
      isTrending,
      isNewArrival,
      isLimitedStock,
      isReturnable: isReturnable && !isInnerWear,
      excludeFromShopDeals: shopDeals.length > 0 && excludeFromShopDeals,
      images,
      video: video.trim() || undefined,
    });
  };

  const isLast = step === STEPS.length - 1;

  return (
    // Bottom edge too — the footer is pinned to the bottom of the screen.
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} style={styles.headerIcon}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>New product</Text>
          <Text style={[styles.headerMeta, { color: colors.textSecondary }]}>
            Step {step + 1} of {STEPS.length}
          </Text>
        </View>
        <View style={styles.headerIcon} />
      </View>

      {/* Progress — one segment per step, tappable */}
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <Pressable key={s.label} onPress={() => goToStep(i)} hitSlop={8} style={styles.progressItem}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: i <= step ? colors.accent : colors.border },
              ]}
            />
            <Text
              style={[
                styles.progressLabel,
                {
                  color: i === step ? colors.textPrimary : colors.textLight,
                  fontWeight: i === step ? FontWeight.semibold : FontWeight.regular,
                },
              ]}
              numberOfLines={1}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FormScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>{STEPS[step].label}</Text>
        <Text style={[styles.stepHint, { color: colors.textSecondary }]}>{STEPS[step].hint}</Text>

        {step === 0 && (
          <View style={styles.fields}>
            <View>
              <FieldLabel label="Product name" required colors={colors} />
              <CountedInput value={name} onChangeText={setName} placeholder="e.g. Linen relaxed shirt" maxLength={120} colors={colors} />
              {errors.name && <ErrorText colors={colors}>Product name is required</ErrorText>}
            </View>

            <View>
              <FieldLabel label="Description" required colors={colors} />
              <CountedInput
                value={description}
                onChangeText={setDescription}
                placeholder="Fabric, fit, care — what a shopper should know"
                maxLength={2000}
                multiline
                colors={colors}
              />
              {errors.description && <ErrorText colors={colors}>Description is required</ErrorText>}
            </View>

            <View>
              <SelectField
                label="Gender"
                required
                placeholder="Select gender"
                value={gender}
                options={genderOptions}
                onSelect={setGenderAndReset}
                colors={colors}
              />
              {errors.gender && <ErrorText colors={colors}>Gender is required</ErrorText>}
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <SelectField
                  label="Category"
                  required
                  placeholder={gender ? 'Select' : 'Gender first'}
                  value={category}
                  options={categoryOptions}
                  onSelect={setCategoryAndReset}
                  colors={colors}
                />
              </View>
              <View style={styles.col}>
                <SelectField
                  label="Subcategory"
                  required
                  placeholder={category ? 'Select' : 'Category first'}
                  value={subcategory}
                  options={subcategoryOptions}
                  onSelect={setSubcategory}
                  colors={colors}
                />
              </View>
            </View>
            {(errors.category || errors.subcategory) && (
              <ErrorText colors={colors}>Category and subcategory are required</ErrorText>
            )}

            <BrandSelectField value={brand} options={brandOptions} onSelect={setBrand} onBrandAdded={refreshBrands} />

            <View>
              <FieldLabel label="Tags" colors={colors} />
              <PlainInput value={tags} onChangeText={setTags} placeholder="casual, summer, cotton" colors={colors} />
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.fields}>
            <View style={styles.row}>
              <View style={styles.col}>
                <FieldLabel label="MRP (Selling Price)" required colors={colors} />
                <CountedInput value={sellingPrice} onChangeText={setSellingPrice} placeholder="₹ 0" maxLength={10} keyboardType="number-pad" colors={colors} />
              </View>
              <View style={styles.col}>
                <FieldLabel label="Discount %" required colors={colors} />
                <CountedInput value={discountPercent} onChangeText={setDiscountPercent} placeholder="0" maxLength={3} keyboardType="number-pad" colors={colors} />
              </View>
            </View>
            {(errors.sellingPrice || errors.discountPercent) && (
              <ErrorText colors={colors}>Enter an MRP and a discount between 0 and 100%</ErrorText>
            )}

            <PricingBreakdown mrp={sellingPrice} discountPercent={discountPercent} colors={colors} />
          </View>
        )}

        {step === 2 && (
          <View style={styles.fields}>
            <View style={styles.listHeader}>
              <Text style={[styles.listHeaderLabel, { color: colors.textSecondary }]}>SIZE</Text>
              <Text style={[styles.listHeaderLabel, styles.listHeaderStock, { color: colors.textSecondary }]}>STOCK</Text>
            </View>

            {variants.map((variant, index) => (
              <View key={index} style={styles.variantRow}>
                <VariantSizePicker
                  value={variant.size}
                  options={sizeOptions}
                  onSelect={size => updateVariant(index, { size })}
                  colors={colors}
                />
                <TextInput
                  value={variant.stock}
                  onChangeText={text => updateVariant(index, { stock: text })}
                  placeholder="0"
                  keyboardType="number-pad"
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[
                    styles.stockInput,
                    { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary },
                  ]}
                />
                <Pressable
                  onPress={() => removeVariant(index)}
                  hitSlop={8}
                  disabled={variants.length === 1}
                  style={[styles.variantRemove, variants.length === 1 && styles.disabled]}
                >
                  <X size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
            ))}
            {errors.variants && <ErrorText colors={colors}>Add at least one size</ErrorText>}

            <Pressable onPress={addVariant} style={styles.textAction}>
              <Plus size={16} color={colors.accent} />
              <Text style={[styles.textActionLabel, { color: colors.accent }]}>Add size</Text>
            </Pressable>

            <View style={[styles.summaryRow, { borderTopColor: colors.divider }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total stock</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{totalStock}</Text>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.fields}>
            <View style={styles.row}>
              <View style={styles.col}>
                <SelectField label="Color" placeholder="Select" value={color} options={colorOptions} onSelect={setColor} colors={colors} />
              </View>
              <View style={styles.col}>
                <SelectField label="Season" placeholder="Select" value={season} options={seasonOptions} onSelect={setSeason} colors={colors} />
              </View>
            </View>

            <View>
              <FieldLabel label="More details" colors={colors} />
              {Object.keys(attributes).length > 0 && (
                <View style={styles.chipRow}>
                  {Object.entries(attributes).map(([key, val]) => (
                    <View key={key} style={[styles.chip, { borderColor: colors.border }]}>
                      <Text style={[styles.chipLabel, { color: colors.textPrimary }]}>
                        <Text style={{ color: colors.textSecondary }}>{key} </Text>
                        {val}
                      </Text>
                      <Pressable onPress={() => removeAttribute(key)} hitSlop={6}>
                        <X size={14} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
              <Pressable onPress={() => setAttributeSheetOpen(true)} style={styles.textAction}>
                <Plus size={16} color={colors.accent} />
                <Text style={[styles.textActionLabel, { color: colors.accent }]}>Add detail</Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.fields}>
            <View>
              <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>HIGHLIGHTS</Text>
              <FlagCheckbox title="Featured" description="Show in featured collections" checked={isFeatured} onToggle={() => setIsFeatured(v => !v)} colors={colors} />
              <FlagCheckbox title="Trending" description="Show in trending collections" checked={isTrending} onToggle={() => setIsTrending(v => !v)} colors={colors} />
              <FlagCheckbox title="New arrival" description="Show on the new arrivals shelf" checked={isNewArrival} onToggle={() => setIsNewArrival(v => !v)} colors={colors} />
              <FlagCheckbox title="Limited stock" description="Show a limited-stock badge" checked={isLimitedStock} onToggle={() => setIsLimitedStock(v => !v)} colors={colors} />
            </View>

            <View>
              <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>RETURNS</Text>
              <FlagCheckbox
                title="Returnable"
                description={
                  isInnerWear
                    ? "Inner Wear is always non-returnable, so it isn't Try & Buy."
                    : isReturnable
                      ? 'Returnable products are automatically Try & Buy.'
                      : "Non-returnable products aren't eligible for Try & Buy."
                }
                checked={isReturnable && !isInnerWear}
                disabled={isInnerWear}
                onToggle={() => setIsReturnable(v => !v)}
                colors={colors}
              />
            </View>

            <View>
              <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>DEALS</Text>
              {shopDeals.length > 0 ? (
                <>
                  <SelectField
                    label="Store-wide deal"
                    placeholder="Select"
                    value={excludeFromShopDeals ? 'No deal' : includeLabel}
                    options={[includeLabel, 'No deal']}
                    onSelect={v => setExcludeFromShopDeals(v === 'No deal')}
                    colors={colors}
                  />
                  <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                    {excludeFromShopDeals
                      ? 'This product stays out of the store-wide deal. You can add it to a different deal later from its Deals tab, or leave it without one.'
                      : 'Your store-wide deal is running — this product will be part of it.'}
                  </Text>
                </>
              ) : (
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                  Link this product to a deal (BOGO, tiered, free shipping) from its Deals tab after saving.
                </Text>
              )}
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={styles.fields}>
            <View>
              <View style={styles.labelRow}>
                <FieldLabel label="Photos" colors={colors} />
                <Text style={[styles.counter, { color: colors.textLight }]}>
                  {images.length}/{MAX_IMAGES}
                </Text>
              </View>
              <ProductImagePicker images={images} onChange={setImages} max={MAX_IMAGES} />
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Select several at once. The first photo is the cover.
              </Text>
            </View>

            <View>
              <FieldLabel label="Video URL (optional)" colors={colors} />
              <PlainInput value={video} onChangeText={setVideo} placeholder="https://…" colors={colors} />
            </View>
          </View>
        )}
      </FormScrollView>

      {/* Pinned footer */}
      <View style={[styles.footer, { borderTopColor: colors.divider, backgroundColor: colors.background }]}>
        <Button
          label={step === 0 ? 'Cancel' : 'Back'}
          variant="outline"
          onPress={goBack}
          style={styles.footerSecondary}
        />
        <Button
          label={isLast ? 'Save as draft' : 'Continue'}
          onPress={isLast ? handleSubmit : goNext}
          loading={isLast && createMutation.isPending}
          style={styles.footerPrimary}
        />
      </View>

      <BottomSheet visible={attributeSheetOpen} onClose={() => setAttributeSheetOpen(false)}>
        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Add detail</Text>
        <View style={styles.sheetField}>
          <FieldLabel label="Name" colors={colors} />
          <PlainInput value={attrKey} onChangeText={setAttrKey} placeholder="e.g. Material" colors={colors} />
        </View>
        <View style={styles.sheetField}>
          <FieldLabel label="Value" colors={colors} />
          <PlainInput value={attrValue} onChangeText={setAttrValue} placeholder="e.g. Cotton" colors={colors} />
        </View>
        <Button label="Add" onPress={addAttribute} style={styles.sheetButton} />
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  headerMeta: {
    marginTop: 1,
    fontSize: FontSize.xs,
  },
  progress: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  progressItem: {
    flex: 1,
  },
  progressBar: {
    height: 3,
    borderRadius: Radius.full,
  },
  progressLabel: {
    marginTop: Spacing.xs,
    fontSize: FontSize.xxs,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  stepTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
  stepHint: {
    marginTop: Spacing.xs,
    fontSize: FontSize.sm,
  },
  fields: {
    marginTop: Spacing.xxl,
    gap: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  col: {
    flex: 1,
  },
  plainInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
  },
  errorText: {
    marginTop: Spacing.xs,
    fontSize: FontSize.xs,
  },
  helperText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.xs,
    lineHeight: 17,
  },
  groupLabel: {
    marginBottom: Spacing.xs,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counter: {
    fontSize: FontSize.xs,
  },
  listHeader: {
    flexDirection: 'row',
    marginBottom: -Spacing.sm,
  },
  listHeaderLabel: {
    flex: 1,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 1,
  },
  listHeaderStock: {
    flex: 0,
    width: 96,
    marginRight: 36,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sizeField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  sizeValue: {
    flex: 1,
    fontSize: FontSize.md,
  },
  stockInput: {
    width: 96,
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  variantRemove: {
    width: 28,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.3,
  },
  textAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  textActionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.md,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
  },
  summaryValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  chipLabel: {
    fontSize: FontSize.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerSecondary: {
    flex: 1,
  },
  footerPrimary: {
    flex: 2,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },
  sheetList: {
    maxHeight: 360,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetRowLabel: {
    fontSize: FontSize.md,
  },
  sheetField: {
    marginBottom: Spacing.md,
  },
  sheetButton: {
    marginTop: Spacing.sm,
  },
});
