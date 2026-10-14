import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Mail, Phone, User } from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { AppHeader } from '../../../components/layout/AppHeader';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { ImageCarousel } from '../../../components/common/ImageCarousel';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useThemeColors } from '../../../store/themeStore';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import { ROUTES, type MainStackParamList } from '../../../navigation/routeConfig';
import { getProduct } from '../../products/products.api';
import { getInterestedCustomers } from '../interests.api';

type Nav = NativeStackNavigationProp<MainStackParamList, 'InterestedProductDetail'>;
type Route = RouteProp<MainStackParamList, 'InterestedProductDetail'>;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export function InterestedProductDetailScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<Nav>();
  const { productId } = useRoute<Route>().params;
  const { width } = useWindowDimensions();
  const imageWidth = width - Spacing.lg * 2;

  const productQuery = useQuery({
    queryKey: ['seller-products', 'detail', productId],
    queryFn: () => getProduct(productId),
  });
  const customersQuery = useQuery({
    queryKey: ['seller-interests', 'customers', productId],
    queryFn: () => getInterestedCustomers(productId),
  });

  const product = productQuery.data;
  const customers = customersQuery.data ?? [];

  const detailRows: [string, string | undefined][] = product
    ? [
        ['Brand', product.brand],
        ['Category', [product.category, product.subcategory].filter(Boolean).join(' › ')],
        ['Colour', product.color],
        ['Stock', `${product.totalStock} (${product.stockStatus.replace(/_/g, ' ')})`],
        ['Sizes', product.variants.map(v => `${v.size}: ${v.stock}`).join('   ')],
        ['Returnable', product.isReturnable ? 'Yes' : 'No'],
        ['Try & Buy', product.tryAndBuy ? 'Yes' : 'No'],
      ]
    : [];

  return (
    <Screen>
      <AppHeader title="Interested Customers" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        {productQuery.isLoading ? (
          <Skeleton width="100%" height={imageWidth} radius={Radius.lg} />
        ) : !product ? (
          <Text style={{ color: colors.textSecondary }}>Couldn't load this product.</Text>
        ) : (
          <>
            <View style={styles.imageWrap}>
              <ImageCarousel
                images={product.images}
                width={imageWidth}
                height={imageWidth * 1.12}
                fallback={<View style={{ flex: 1, backgroundColor: colors.border }} />}
              />
            </View>

            <View style={styles.titleRow}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{product.name}</Text>
              <Badge label={product.status} tone={product.status === 'published' ? 'success' : 'neutral'} />
            </View>

            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: colors.textPrimary }]}>
                ₹{product.finalPrice.toLocaleString('en-IN')}
              </Text>
              {product.sellingPrice > product.finalPrice && (
                <>
                  <Text style={[styles.mrp, { color: colors.textSecondary }]}>
                    ₹{product.sellingPrice.toLocaleString('en-IN')}
                  </Text>
                  <Text style={[styles.discount, { color: colors.success }]}>{product.discountPercent}% off</Text>
                </>
              )}
            </View>

            <Card style={styles.card}>
              {detailRows
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <View key={label} style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{value}</Text>
                  </View>
                ))}
              {!!product.description && (
                <Text style={[styles.description, { color: colors.textSecondary }]}>{product.description}</Text>
              )}
            </Card>

            <Button
              label="Open product"
              variant="outline"
              onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAILS, { productId })}
            />
          </>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Interested customers{customersQuery.data ? ` (${customers.length})` : ''}
        </Text>

        {customersQuery.isLoading ? (
          <Skeleton width="100%" height={96} radius={Radius.lg} />
        ) : customers.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>
            {customersQuery.isError ? "Couldn't load customers." : 'No interested customers.'}
          </Text>
        ) : (
          customers.map(row => (
            <Card key={row._id} style={styles.card}>
              <View style={styles.customerHead}>
                <User size={18} color={colors.accent} />
                <Text style={[styles.customerName, { color: colors.textPrimary }]}>
                  {row.customer.name || 'Customer'}
                </Text>
              </View>
              {!!row.customer.phone && (
                <Pressable style={styles.contactRow} onPress={() => void Linking.openURL(`tel:${row.customer.phone}`)}>
                  <Phone size={15} color={colors.accent} />
                  <Text style={[styles.contact, { color: colors.accent }]}>{row.customer.phone}</Text>
                </Pressable>
              )}
              {!!row.customer.email && (
                <Pressable style={styles.contactRow} onPress={() => void Linking.openURL(`mailto:${row.customer.email}`)}>
                  <Mail size={15} color={colors.accent} />
                  <Text style={[styles.contact, { color: colors.accent }]}>{row.customer.email}</Text>
                </Pressable>
              )}
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                Interested on {formatDate(row.interestedAt)}
                {row.priceAtInterest != null ? ` at ₹${row.priceAtInterest.toLocaleString('en-IN')}` : ''}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },
  imageWrap: { borderRadius: Radius.lg, overflow: 'hidden' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  name: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  price: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  mrp: { fontSize: FontSize.sm, textDecorationLine: 'line-through' },
  discount: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  card: { gap: Spacing.sm },
  detailRow: { flexDirection: 'row', gap: Spacing.md },
  detailLabel: { width: 90, fontSize: FontSize.sm },
  detailValue: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  description: { fontSize: FontSize.sm, lineHeight: 20, marginTop: Spacing.xs },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginTop: Spacing.md },
  customerHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  customerName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  contact: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  meta: { fontSize: FontSize.xs },
});
