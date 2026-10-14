import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, Zap } from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { AppHeader } from '../../../components/layout/AppHeader';
import { Card } from '../../../components/common/Card';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useThemeColors } from '../../../store/themeStore';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import { ROUTES, type MainStackParamList } from '../../../navigation/routeConfig';
import { getProducts } from '../../products/products.api';
import { OfferList, useSellerOffers } from '../DealsManager';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Tab = 'bogo' | 'tiered' | 'massive';

const TABS: { key: Tab; label: string }[] = [
  { key: 'bogo', label: 'BOGO' },
  { key: 'tiered', label: 'Spend & Tiered' },
  { key: 'massive', label: 'Massive' },
];

// Mirrors the backend's MASSIVE_DEAL_MIN_DISCOUNT_PERCENT — display only.
const MASSIVE_MIN_DISCOUNT = 50;

// Same three deal types as admin's pages/deals/Deals.tsx.
export function DealsScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<Tab>('bogo');
  const offersQuery = useSellerOffers();
  const offers = offersQuery.data?.items ?? [];

  return (
    <Screen>
      <AppHeader title="Deals" onBack={() => navigation.goBack()} />

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {TABS.map(t => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={styles.tab}>
              <Text style={[styles.tabLabel, { color: active ? colors.accent : colors.textSecondary }, active && styles.tabActive]}>
                {t.label}
              </Text>
              {active && <View style={[styles.underline, { backgroundColor: colors.accent }]} />}
            </Pressable>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'bogo' && (
          <OfferList
            offers={offers.filter(o => o.type === 'bogo')}
            loading={offersQuery.isLoading}
            emptyText="No BOGO offers yet. Buy/get quantities cover both classic BOGO (1/1) and Buy 2 Get 2."
            addButtons={[{ label: 'Create BOGO offer', kind: 'bogo' }]}
          />
        )}
        {tab === 'tiered' && (
          <OfferList
            offers={offers.filter(o => o.type !== 'bogo')}
            loading={offersQuery.isLoading}
            emptyText="No spend or tiered deals yet. Add several spend thresholds (e.g. ₹999 → ₹100 off, ₹1999 → ₹250 off) to build a tiered ladder."
            addButtons={[{ label: 'Add Buy X Amount Get X OFF', kind: 'tier' }]}
          />
        )}
        {tab === 'massive' && <MassiveDeals />}
      </ScrollView>
    </Screen>
  );
}

// Massive Deals has no setup — any product at >= 50% off qualifies
// automatically (backend constants/massiveDeal.js), same as admin's tab.
function MassiveDeals() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<Nav>();
  // ponytail: first 100 products, filtered client-side (seller product
  // list has no discount filter); add a minDiscount param if shops outgrow it.
  const query = useQuery({
    queryKey: ['seller-products', 'massive'],
    queryFn: () => getProducts({ limit: 100 }),
  });
  const products = (query.data?.items ?? []).filter(p => p.isMassiveDeal);

  return (
    <View style={styles.list}>
      <Card style={styles.massiveInfo}>
        <View style={styles.row}>
          <Zap size={18} color={colors.error} />
          <Text style={[styles.massiveTitle, { color: colors.textPrimary }]}>Massive Deals</Text>
        </View>
        <Text style={[styles.massiveTag, { color: colors.accent }]}>Automatic · {MASSIVE_MIN_DISCOUNT}% OFF & above</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          No setup required. Products with {MASSIVE_MIN_DISCOUNT}% or more discount automatically qualify and enter or
          leave this section as their pricing changes. Change a product's discount to add or remove it.
        </Text>
        {!query.isLoading && (
          <Text style={[styles.meta, { color: colors.textPrimary }]}>
            {products.length} product{products.length === 1 ? '' : 's'} currently qualify
          </Text>
        )}
      </Card>

      {query.isLoading ? (
        <Skeleton width="100%" height={96} radius={Radius.lg} />
      ) : (
        products.map(p => (
          <Pressable key={p._id} onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId: p._id })}>
            <Card style={styles.productCard}>
              <Image source={{ uri: p.images[0]?.url }} style={[styles.thumb, { backgroundColor: colors.border }]} />
              <View style={styles.flex}>
                <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>{p.name}</Text>
                <View style={styles.row}>
                  <Text style={[styles.price, { color: colors.textPrimary }]}>₹{p.finalPrice.toLocaleString('en-IN')}</Text>
                  <Text style={[styles.mrp, { color: colors.textSecondary }]}>₹{p.sellingPrice.toLocaleString('en-IN')}</Text>
                  <Text style={[styles.off, { color: colors.error }]}>{p.discountPercent}% OFF</Text>
                </View>
                <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                  {[p.brand, p.category, p.subcategory].filter(Boolean).join(' · ')}
                </Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  Stock {p.totalStock} · {p.variants.map(v => v.size).join(', ')}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.textSecondary} />
            </Card>
          </Pressable>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: Spacing.lg },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  tabLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  tabActive: { fontWeight: FontWeight.bold },
  underline: { position: 'absolute', bottom: -1, left: 12, right: 12, height: 2, borderRadius: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  list: { gap: Spacing.md, marginTop: Spacing.md },
  flex: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  massiveInfo: { gap: Spacing.xs },
  massiveTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  massiveTag: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  meta: { fontSize: FontSize.xs, lineHeight: 17 },
  productCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  thumb: { width: 72, height: 72, borderRadius: Radius.md },
  name: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  price: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  mrp: { fontSize: FontSize.xs, textDecorationLine: 'line-through' },
  off: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});
