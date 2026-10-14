import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlertTriangle, Check, Eye, Search } from 'lucide-react-native';

import { useThemeColors } from '../../store/themeStore';
import { Spacing, Radius } from '../../theme/spacing';
import { FontSize, FontWeight } from '../../theme/typography';
import { ROUTES, type MainStackParamList } from '../../navigation/routeConfig';
import { getProducts } from '../products/products.api';

const DEAL_LABEL: Record<string, string> = {
  bogo: 'Already in a BOGO deal',
  tier_amount: 'Already in a spend deal',
  tier_percentage: 'Already in a spend deal',
  free_shipping: 'Already in a free shipping deal',
};

// Seller-app version of admin's components/deals/ShopProductSelector:
// searchable multi-select of this shop's products with image, price/MRP/
// discount, category, stock and an existing-deal hint; the eye opens the
// full product. ponytail: first 50 matches only — search narrows the list.
export function ProductSelector({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const { colors } = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = useQuery({
    queryKey: ['seller-products', 'deal-picker', debounced],
    queryFn: () => getProducts({ limit: 50, search: debounced }),
  });
  const products = query.data?.items ?? [];
  const selected = new Set(selectedIds);
  const allSelected = products.length > 0 && products.every(p => selected.has(p._id));

  const toggle = (id: string) =>
    onChange(selected.has(id) ? selectedIds.filter(v => v !== id) : [...selectedIds, id]);
  const toggleAll = () => {
    const ids = new Set(products.map(p => p._id));
    onChange(allSelected ? selectedIds.filter(id => !ids.has(id)) : [...new Set([...selectedIds, ...ids])]);
  };

  const box = (checked: boolean) => [
    styles.checkbox,
    { borderColor: checked ? colors.accent : colors.inputBorder, backgroundColor: checked ? colors.accent : 'transparent' },
  ];

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <View style={[styles.search, { borderColor: colors.inputBorder }]}>
        <Search size={16} color={colors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search products..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.textPrimary }]}
        />
      </View>

      <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>{selectedIds.length} selected</Text>

      {query.isLoading ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>Loading products…</Text>
      ) : products.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          {debounced ? 'No products match.' : 'This shop has no products yet.'}
        </Text>
      ) : (
        <>
          <Pressable onPress={toggleAll} style={styles.allRow}>
            <View style={box(allSelected)}>{allSelected && <Check size={12} color={colors.textInverse} />}</View>
            <Text style={[styles.allLabel, { color: colors.textPrimary }]}>Select all loaded products</Text>
          </Pressable>

          {products.map(p => {
            const checked = selected.has(p._id);
            return (
              <Pressable
                key={p._id}
                onPress={() => toggle(p._id)}
                style={[styles.row, { borderColor: checked ? colors.accent : colors.border }]}
              >
                <View style={box(checked)}>{checked && <Check size={12} color={colors.textInverse} />}</View>
                <Image source={{ uri: p.images[0]?.url }} style={[styles.thumb, { backgroundColor: colors.border }]} />
                <View style={styles.info}>
                  <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{p.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: colors.textPrimary }]}>₹{p.finalPrice.toLocaleString('en-IN')}</Text>
                    {p.sellingPrice > p.finalPrice && (
                      <Text style={[styles.mrp, { color: colors.textSecondary }]}>₹{p.sellingPrice.toLocaleString('en-IN')}</Text>
                    )}
                    {p.discountPercent > 0 && (
                      <Text style={[styles.off, { color: p.isMassiveDeal ? colors.error : colors.success }]}>
                        {p.discountPercent}% OFF
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                    {[p.category, p.subcategory].filter(Boolean).join(' · ')} · Stock {p.totalStock}
                  </Text>
                  {p.dealType !== 'none' && DEAL_LABEL[p.dealType] && (
                    <View style={styles.dealHint}>
                      <AlertTriangle size={11} color={colors.warning} />
                      <Text style={[styles.meta, { color: colors.warning }]}>{DEAL_LABEL[p.dealType]}</Text>
                    </View>
                  )}
                </View>
                <Pressable
                  hitSlop={10}
                  onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId: p._id })}
                >
                  <Eye size={18} color={colors.textSecondary} />
                </Pressable>
              </Pressable>
            );
          })}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  search: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md },
  searchInput: { flex: 1, paddingVertical: Spacing.sm, fontSize: FontSize.sm },
  selectedCount: { fontSize: FontSize.xs },
  empty: { textAlign: 'center', paddingVertical: Spacing.lg, fontSize: FontSize.sm },
  allRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  allLabel: { fontSize: FontSize.sm },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm },
  thumb: { width: 52, height: 52, borderRadius: Radius.sm },
  info: { flex: 1, gap: 1 },
  name: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  price: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  mrp: { fontSize: FontSize.xs, textDecorationLine: 'line-through' },
  off: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  meta: { fontSize: FontSize.xs },
  dealHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
