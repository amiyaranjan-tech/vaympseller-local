import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Check, ChevronLeft, ChevronRight, Info, Plus, Trash2, X } from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { BottomSheet } from '../../../components/common/BottomSheet';
import { ProductImagePicker, type PickerImage } from '../../../components/common/ProductImagePicker';
import { FieldLabel, CountedInput, SelectField, FlagCheckbox } from '../../../components/forms/ProductFormFields';
import { useThemeColors } from '../../../store/themeStore';
import { useToast } from '../../../components/feedback/Toast';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import { ROUTES, type MainStackParamList } from '../../../navigation/routeConfig';
import { createProduct, type ProductGender, type ProductPayload, type ProductVariant } from '../products.api';
import {
  BRAND_OPTIONS,
  GENDER_OPTIONS,
  CATEGORY_OPTIONS,
  SUBCATEGORY_OPTIONS,
  COLOR_OPTIONS,
  SEASON_OPTIONS,
} from '../productOptions';

// Mirrors the admin panel's own product wizard (src/pages/products/
// ProductForm.tsx) step-for-step — Basics/Pricing/Inventory/Attributes/
// Offers/Media — so a seller's flow matches what an admin sees when
// editing the same product. Notably: there is no "Simple vs Variable
// product type" concept anywhere in the real system (every product is
// just a name + a variants[] array), so that toggle doesn't exist here.
const STEPS = ['Basics', 'Pricing', 'Inventory', 'Attributes', 'Offers', 'Media'];

type AddProductNav = NativeStackNavigationProp<MainStackParamList, 'AddProduct'>;

interface VariantRow {
  size: string;
  color: string;
  sku: string;
  stock: string;
}

const emptyVariant = (): VariantRow => ({ size: '', color: '', sku: '', stock: '' });

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

  // Pricing
  const [sellingPrice, setSellingPrice] = useState('999');
  const [costPrice, setCostPrice] = useState('500');
  const [discountPercent, setDiscountPercent] = useState('0');

  // Inventory
  const [variants, setVariants] = useState<VariantRow[]>([emptyVariant()]);

  // Attributes
  const [color, setColor] = useState('');
  const [season, setSeason] = useState('All');
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [attributeSheetOpen, setAttributeSheetOpen] = useState(false);
  const [attrKey, setAttrKey] = useState('');
  const [attrValue, setAttrValue] = useState('');

  // Offers (flags)
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isLimitedStock, setIsLimitedStock] = useState(false);
  const [isBogo, setIsBogo] = useState(false);
  const [isReturnable, setIsReturnable] = useState(true);
  const [tryAndBuy, setTryAndBuy] = useState(false);

  // Media
  const [images, setImages] = useState<PickerImage[]>([]);
  const [video, setVideo] = useState('');

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const finalPrice = Math.max(
    0,
    Math.floor((Number(sellingPrice) || 0) * (1 - (Number(discountPercent) || 0) / 100)),
  );

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
      nextErrors.sellingPrice = !sellingPrice.trim();
      nextErrors.costPrice = !costPrice.trim();
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

  const addVariant = () => setVariants(prev => [...prev, emptyVariant()]);
  const removeVariant = (index: number) =>
    setVariants(prev => prev.filter((_, i) => i !== index));
  const updateVariant = (index: number, patch: Partial<VariantRow>) =>
    setVariants(prev => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));

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
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      toast.show({ type: 'error', title: 'Some required fields are missing — check earlier steps' });
      return;
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
      costPrice: Number(costPrice) || 0,
      discountPercent: Number(discountPercent) || 0,
      variants: payloadVariants,
      color,
      season,
      attributes,
      isFeatured,
      isTrending,
      isNewArrival,
      isLimitedStock,
      isBogo,
      isReturnable,
      tryAndBuy,
      images,
      video: video.trim() || undefined,
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            onPress={goBack}
            hitSlop={12}
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <ChevronLeft size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Add Product</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {STEPS.length} focused steps to publish a listing
            </Text>
          </View>
          <View style={styles.backButton} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepper}>
          {STEPS.map((label, index) => {
            const isActive = index === step;
            const isDone = index < step;
            return (
              <Pressable
                key={label}
                onPress={() => setStep(index)}
                style={[
                  styles.stepPill,
                  {
                    borderColor: isActive ? colors.accent : isDone ? `${colors.accent}40` : colors.border,
                    backgroundColor: isActive ? colors.accent : isDone ? colors.accent10 : 'transparent',
                  },
                ]}
              >
                {isDone ? (
                  <Check size={13} color={colors.accent} />
                ) : (
                  <View
                    style={[
                      styles.stepPillNumber,
                      { backgroundColor: isActive ? colors.textInverse : colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepPillNumberLabel,
                        { color: isActive ? colors.accent : colors.textSecondary },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.stepPillLabel,
                    { color: isActive ? colors.textInverse : isDone ? colors.accent : colors.textSecondary },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Card style={styles.section}>
          {step === 0 && (
            <>
              <FieldLabel label="Product Name" required colors={colors} />
              <CountedInput value={name} onChangeText={setName} placeholder="Enter product name" maxLength={120} colors={colors} />
              {errors.name && <Text style={[styles.errorText, { color: colors.error }]}>Product name is required</Text>}

              <FieldLabel label="Description" required colors={colors} />
              <CountedInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your product in detail"
                maxLength={2000}
                multiline
                colors={colors}
              />
              {errors.description && (
                <Text style={[styles.errorText, { color: colors.error }]}>Description is required</Text>
              )}

              <View style={styles.row}>
                <View style={styles.col}>
                  <SelectField
                    label="Gender"
                    required
                    placeholder="Select gender"
                    value={gender}
                    options={GENDER_OPTIONS}
                    onSelect={setGenderAndReset}
                    colors={colors}
                  />
                </View>
                <View style={styles.col}>
                  <SelectField
                    label="Brand"
                    placeholder="Select brand"
                    value={brand}
                    options={BRAND_OPTIONS}
                    onSelect={setBrand}
                    colors={colors}
                  />
                </View>
              </View>
              {errors.gender && <Text style={[styles.errorText, { color: colors.error }]}>Gender is required</Text>}

              <View style={styles.row}>
                <View style={styles.col}>
                  <SelectField
                    label="Category"
                    required
                    placeholder="Select category"
                    value={category}
                    options={CATEGORY_OPTIONS}
                    onSelect={setCategoryAndReset}
                    colors={colors}
                  />
                </View>
                <View style={styles.col}>
                  <SelectField
                    label="Subcategory"
                    required
                    placeholder="Select subcategory"
                    value={subcategory}
                    options={SUBCATEGORY_OPTIONS}
                    onSelect={setSubcategory}
                    colors={colors}
                  />
                </View>
              </View>
              {(errors.category || errors.subcategory) && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  Category and subcategory are required
                </Text>
              )}

              <FieldLabel label="Tags" colors={colors} />
              <View style={[styles.tagsField, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                <TextInput
                  value={tags}
                  onChangeText={setTags}
                  placeholder="Add tags (e.g. casual, summer)"
                  placeholderTextColor={colors.inputPlaceholder}
                  style={[styles.tagsInput, { color: colors.textPrimary }]}
                />
              </View>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pricing</Text>
              <View style={styles.row}>
                <View style={styles.col}>
                  <FieldLabel label="Selling Price" required colors={colors} />
                  <CountedInput value={sellingPrice} onChangeText={setSellingPrice} placeholder="0" maxLength={10} keyboardType="number-pad" colors={colors} />
                </View>
                <View style={styles.col}>
                  <FieldLabel label="Cost Price" required colors={colors} />
                  <CountedInput value={costPrice} onChangeText={setCostPrice} placeholder="0" maxLength={10} keyboardType="number-pad" colors={colors} />
                </View>
              </View>
              {(errors.sellingPrice || errors.costPrice) && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  Selling price and cost price are required
                </Text>
              )}
              <FieldLabel label="Discount %" colors={colors} />
              <CountedInput value={discountPercent} onChangeText={setDiscountPercent} placeholder="0" maxLength={3} keyboardType="number-pad" colors={colors} />

              <View style={[styles.finalPriceRow, { backgroundColor: colors.grey100 }]}>
                <Text style={[styles.finalPriceLabel, { color: colors.textSecondary }]}>
                  Final price after discount
                </Text>
                <Text style={[styles.finalPriceValue, { color: colors.textPrimary }]}>
                  ₹{finalPrice.toLocaleString('en-IN')}
                </Text>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Variants (size, stock)</Text>
              {variants.map((variant, index) => (
                <View key={index} style={styles.variantRow}>
                  <TextInput
                    value={variant.size}
                    onChangeText={text => updateVariant(index, { size: text })}
                    placeholder="Size"
                    placeholderTextColor={colors.inputPlaceholder}
                    style={[
                      styles.variantSizeInput,
                      { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary },
                    ]}
                  />
                  <TextInput
                    value={variant.stock}
                    onChangeText={text => updateVariant(index, { stock: text })}
                    placeholder="Stock"
                    keyboardType="number-pad"
                    placeholderTextColor={colors.inputPlaceholder}
                    style={[
                      styles.variantStockInput,
                      { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary },
                    ]}
                  />
                  <Pressable onPress={() => removeVariant(index)} hitSlop={8} style={styles.variantRemove}>
                    <Trash2 size={18} color={colors.error} />
                  </Pressable>
                </View>
              ))}
              {errors.variants && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  Add at least one variant with a size
                </Text>
              )}
              <Pressable onPress={addVariant} style={[styles.addVariantButton, { borderColor: colors.accent }]}>
                <Plus size={16} color={colors.accent} />
                <Text style={[styles.addVariantLabel, { color: colors.accent }]}>Add variant</Text>
              </Pressable>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Attributes</Text>
              <View style={styles.row}>
                <View style={styles.col}>
                  <SelectField label="Color" placeholder="Select color" value={color} options={COLOR_OPTIONS} onSelect={setColor} colors={colors} />
                </View>
                <View style={styles.col}>
                  <SelectField label="Season" placeholder="Select season" value={season} options={SEASON_OPTIONS} onSelect={setSeason} colors={colors} />
                </View>
              </View>

              <FieldLabel label="Attributes" colors={colors} />
              <Pressable
                onPress={() => setAttributeSheetOpen(true)}
                style={[styles.addAttributesButton, { borderColor: colors.accent }]}
              >
                <Plus size={16} color={colors.accent} />
                <Text style={[styles.addAttributesLabel, { color: colors.accent }]}>Add Attributes</Text>
              </Pressable>
              {Object.keys(attributes).length > 0 && (
                <View style={styles.chipRow}>
                  {Object.entries(attributes).map(([key, val]) => (
                    <View key={key} style={[styles.chip, { backgroundColor: colors.accent10, borderColor: colors.accent }]}>
                      <Text style={[styles.chipLabel, { color: colors.accent }]}>{key}: {val}</Text>
                      <Pressable onPress={() => removeAttribute(key)} hitSlop={6}>
                        <X size={14} color={colors.accent} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Offers &amp; Highlights</Text>
              <FlagCheckbox title="Featured" description="Show in featured collections" checked={isFeatured} onToggle={() => setIsFeatured(v => !v)} colors={colors} />
              <FlagCheckbox title="Trending" description="Show in trending collections" checked={isTrending} onToggle={() => setIsTrending(v => !v)} colors={colors} />
              <FlagCheckbox title="New Arrival" description="Show in the new arrivals shelf" checked={isNewArrival} onToggle={() => setIsNewArrival(v => !v)} colors={colors} />
              <FlagCheckbox title="Limited Stock" description="Show a limited-stock urgency badge" checked={isLimitedStock} onToggle={() => setIsLimitedStock(v => !v)} colors={colors} />
              <FlagCheckbox title="Buy One Get One" description="Marks this product as BOGO-eligible" checked={isBogo} onToggle={() => setIsBogo(v => !v)} colors={colors} />

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <FlagCheckbox
                title="Returnable"
                description="Customers can return this product"
                checked={isReturnable}
                onToggle={() => {
                  const next = !isReturnable;
                  setIsReturnable(next);
                  if (!next) setTryAndBuy(false);
                }}
                colors={colors}
              />
              <FlagCheckbox
                title="Try & Buy"
                description="Allow customers to try this product before buying"
                checked={tryAndBuy}
                disabled={!isReturnable}
                onToggle={() => setTryAndBuy(v => !v)}
                colors={colors}
              />

              <View style={[styles.infoBanner, { backgroundColor: colors.info10 }]}>
                <Info size={16} color={colors.info} />
                <Text style={[styles.infoBannerText, { color: colors.info }]}>
                  Deal type (BOGO/Tiered/Free Shipping) is set by linking this product to a Deal
                  from its Deals tab, not here.
                </Text>
              </View>
            </>
          )}

          {step === 5 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Media</Text>
              <FieldLabel label="Product Images" colors={colors} />
              <ProductImagePicker images={images} onChange={setImages} />

              <View style={{ marginTop: Spacing.lg }}>
                <FieldLabel label="Video URL (optional)" colors={colors} />
                <View style={[styles.tagsField, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                  <TextInput
                    value={video}
                    onChangeText={setVideo}
                    placeholder="https://…"
                    placeholderTextColor={colors.inputPlaceholder}
                    style={[styles.tagsInput, { color: colors.textPrimary }]}
                  />
                </View>
              </View>
            </>
          )}
        </Card>

        <View style={styles.footer}>
          <Button label={step === 0 ? 'Cancel' : 'Back'} variant="outline" onPress={goBack} style={styles.footerButton} />
          {step < STEPS.length - 1 ? (
            <Button
              label="Next"
              onPress={goNext}
              style={styles.footerButton}
              rightIcon={<ChevronRight size={18} color={colors.buttonPrimaryText} />}
            />
          ) : (
            <Button
              label="Save as Draft"
              onPress={handleSubmit}
              loading={createMutation.isPending}
              style={styles.footerButton}
            />
          )}
        </View>
      </ScrollView>

      <BottomSheet visible={attributeSheetOpen} onClose={() => setAttributeSheetOpen(false)}>
        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Add Attribute</Text>
        <View style={styles.attributeSheetField}>
          <FieldLabel label="Attribute name" colors={colors} />
          <View style={[styles.tagsField, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
            <TextInput
              value={attrKey}
              onChangeText={setAttrKey}
              placeholder="e.g. Material"
              placeholderTextColor={colors.inputPlaceholder}
              style={[styles.tagsInput, { color: colors.textPrimary }]}
            />
          </View>
        </View>
        <View style={styles.attributeSheetField}>
          <FieldLabel label="Attribute value" colors={colors} />
          <View style={[styles.tagsField, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
            <TextInput
              value={attrValue}
              onChangeText={setAttrValue}
              placeholder="e.g. Cotton"
              placeholderTextColor={colors.inputPlaceholder}
              style={[styles.tagsInput, { color: colors.textPrimary }]}
            />
          </View>
        </View>
        <Button label="Add" onPress={addAttribute} style={styles.attributeAddButton} />
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    marginTop: 2,
    fontSize: FontSize.xs,
  },
  stepper: {
    marginTop: Spacing.lg,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.sm,
  },
  stepPillNumber: {
    width: 16,
    height: 16,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPillNumberLabel: {
    fontSize: FontSize.xxxs,
    fontWeight: FontWeight.bold,
  },
  stepPillLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  col: {
    flex: 1,
  },
  errorText: {
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
    fontSize: FontSize.xs,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  tagsField: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  tagsInput: {
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
  },
  finalPriceRow: {
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  finalPriceLabel: {
    fontSize: FontSize.sm,
  },
  finalPriceValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  variantSizeInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
  },
  variantStockInput: {
    width: 90,
    height: 44,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
  },
  variantRemove: {
    padding: Spacing.xs,
  },
  addVariantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  addVariantLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  addAttributesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  addAttributesLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
  },
  chipLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.md,
  },
  infoBanner: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  infoBannerText: {
    flex: 1,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  footer: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  footerButton: {
    flex: 1,
  },
  attributeSheetField: {
    marginBottom: Spacing.sm,
  },
  attributeAddButton: {
    marginTop: Spacing.sm,
  },
});
