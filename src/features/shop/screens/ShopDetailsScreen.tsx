import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Building2,
  ChevronLeft,
  Clock3,
  Eye,
  IndianRupee,
  Landmark,
  MapPin,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
} from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { BottomSheet } from '../../../components/common/BottomSheet';
import { ProductImagePicker, type PickerImage } from '../../../components/common/ProductImagePicker';
import { FieldLabel, CountedInput, CardSectionHeader } from '../../../components/forms/ProductFormFields';
import { useThemeColors } from '../../../store/themeStore';
import { useToast } from '../../../components/feedback/Toast';
import { useAuthStore } from '../../../store/useAuthStore';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import type { MainStackParamList } from '../../../navigation/routeConfig';
import { updateShopProfile } from '../shop.api';
import type { SellerProfile, WorkingDay } from '../../../types/seller';

type Colors = ReturnType<typeof useThemeColors>['colors'];
type Nav = NativeStackNavigationProp<MainStackParamList, 'ShopDetails'>;
type Route = RouteProp<MainStackParamList, 'ShopDetails'>;

const WORKING_DAYS: WorkingDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SELLER_STATUS_LABEL: Record<SellerProfile['status'], string> = {
  pending: 'Pending',
  active: 'Active',
  suspended: 'Suspended',
  inactive: 'Inactive',
  rejected: 'Rejected',
};

function formatINR(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// A read-only preview of roughly what an admin sees on the Sellers
// detail page (vaympadmin-local's SellerDetails.tsx) — same fields this
// app already has cached on `seller`, just laid out the way the admin
// panel shows them, so a seller can sanity-check what admin review sees
// without needing actual admin access.
function AdminPreviewSheet({
  visible,
  onClose,
  seller,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  seller: SellerProfile;
  colors: Colors;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.previewBanner}>
          <Eye size={14} color={colors.textSecondary} />
          <Text style={[styles.previewBannerText, { color: colors.textSecondary }]}>
            This is a preview — it doesn't reflect anything you haven't saved yet.
          </Text>
        </View>

        {seller.cover?.url && (
          <Image source={{ uri: seller.cover.url }} style={styles.previewCover} />
        )}

        <View style={styles.previewHeaderRow}>
          {seller.logo?.url ? (
            <Image source={{ uri: seller.logo.url }} style={styles.previewLogo} />
          ) : (
            <View style={[styles.previewLogo, styles.previewLogoFallback, { backgroundColor: colors.grey100 }]}>
              <Store size={22} color={colors.textLight} />
            </View>
          )}
          <View style={styles.previewHeaderText}>
            <Text style={[styles.previewShopName, { color: colors.textPrimary }]} numberOfLines={1}>
              {seller.shopName}
            </Text>
            <Text style={[styles.previewMeta, { color: colors.textSecondary }]} numberOfLines={1}>
              {seller.ownerName} · {seller.city}
            </Text>
          </View>
        </View>

        <View style={styles.previewBadgeRow}>
          <Badge
            label={SELLER_STATUS_LABEL[seller.status]}
            tone={seller.status === 'active' ? 'success' : seller.status === 'pending' ? 'warning' : 'error'}
          />
          {seller.isVerified && (
            <View style={styles.previewVerified}>
              <ShieldCheck size={13} color={colors.info} />
              <Text style={[styles.previewVerifiedLabel, { color: colors.info }]}>Verified</Text>
            </View>
          )}
          <Badge label={seller.shopStatus.replace('_', ' ')} tone="neutral" />
        </View>

        <Text style={[styles.previewContact, { color: colors.textSecondary }]}>
          {seller.email} · {seller.phone} · {seller.workingHours.open} - {seller.workingHours.close}
        </Text>

        <View style={styles.previewStatGrid}>
          <PreviewStat icon={<IndianRupee size={16} color={colors.success} />} label="Revenue" value={formatINR(seller.revenue)} colors={colors} />
          <PreviewStat icon={<ShoppingBag size={16} color={colors.info} />} label="Orders" value={String(seller.orders)} colors={colors} />
          <PreviewStat icon={<Package size={16} color={colors.warning} />} label="Products" value={String(seller.products)} colors={colors} />
          <PreviewStat icon={<IndianRupee size={16} color={colors.success} />} label="Commission" value={formatINR(seller.commission)} colors={colors} />
          <PreviewStat icon={<Package size={16} color={colors.warning} />} label="Returns" value={String(seller.returns)} colors={colors} />
          <PreviewStat icon={<IndianRupee size={16} color={colors.error} />} label="Refunds" value={formatINR(seller.refunds)} colors={colors} />
        </View>

        <View style={[styles.previewLifecycle, { borderTopColor: colors.divider }]}>
          <PreviewLifecycleRow label="Created" date={seller.createdAt} colors={colors} />
          {seller.verifiedAt && <PreviewLifecycleRow label="Verified" date={seller.verifiedAt} colors={colors} />}
          <PreviewLifecycleRow label="Last updated" date={seller.updatedAt} colors={colors} />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

function PreviewStat({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colors: Colors;
}) {
  return (
    <View style={[styles.previewStat, { backgroundColor: colors.grey50 }]}>
      {icon}
      <Text style={[styles.previewStatValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.previewStatLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function PreviewLifecycleRow({ label, date, colors }: { label: string; date: string; colors: Colors }) {
  return (
    <View style={styles.previewLifecycleRow}>
      <Text style={[styles.previewLifecycleLabel, { color: colors.textPrimary }]}>{label}</Text>
      <Text style={[styles.previewLifecycleValue, { color: colors.textSecondary }]}>{formatDate(date)}</Text>
    </View>
  );
}

export function ShopDetailsScreen() {
  const { colors } = useThemeColors();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const toast = useToast();
  const seller = useAuthStore(state => state.seller);
  const updateSeller = useAuthStore(state => state.updateSeller);

  const [shopName, setShopName] = useState(seller?.shopName ?? '');
  const [ownerName, setOwnerName] = useState(seller?.ownerName ?? '');
  const [phone, setPhone] = useState(seller?.phone ?? '');
  const [address, setAddress] = useState(seller?.address ?? '');
  const [city, setCity] = useState(seller?.city ?? '');
  const [state, setState] = useState(seller?.state ?? '');
  const [postalCode, setPostalCode] = useState(seller?.postalCode ?? '');
  const [description, setDescription] = useState(seller?.description ?? '');
  const [logoPickerOpen, setLogoPickerOpen] = useState(Boolean(params?.openBranding));
  const [adminPreviewOpen, setAdminPreviewOpen] = useState(false);
  const [logo, setLogo] = useState<PickerImage[]>(seller?.logo?.url ? [seller.logo] : []);
  const [cover, setCover] = useState<PickerImage[]>(seller?.cover?.url ? [seller.cover] : []);
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>(seller?.workingDays ?? []);
  const [openTime, setOpenTime] = useState(seller?.workingHours?.open ?? '');
  const [closeTime, setCloseTime] = useState(seller?.workingHours?.close ?? '');
  const [accountName, setAccountName] = useState(seller?.bank?.accountName ?? '');
  const [accountNumber, setAccountNumber] = useState(seller?.bank?.accountNumber ?? '');
  const [ifsc, setIfsc] = useState(seller?.bank?.ifsc ?? '');
  const [bankName, setBankName] = useState(seller?.bank?.bankName ?? '');

  const wasRejected = seller?.status === 'rejected';

  const toggleDay = (day: WorkingDay) => {
    setWorkingDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]));
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      updateShopProfile({
        shopName,
        ownerName,
        phone,
        address,
        city,
        state,
        postalCode,
        description,
        logo: logo[0] ? { url: logo[0].url, publicId: logo[0].publicId } : undefined,
        cover: cover[0] ? { url: cover[0].url, publicId: cover[0].publicId } : undefined,
        workingDays,
        workingHours: openTime && closeTime ? { open: openTime, close: closeTime } : undefined,
        bank:
          accountName && accountNumber && ifsc && bankName
            ? { accountName, accountNumber, ifsc, bankName }
            : undefined,
      }),
    onSuccess: updated => {
      updateSeller(updated);
      toast.show({
        type: 'success',
        title: 'Shop details updated',
        message: wasRejected ? 'Resubmitted for admin review.' : undefined,
      });
      navigation.goBack();
    },
    onError: (error: Error) => {
      toast.show({ type: 'error', title: "Couldn't save changes", message: error.message });
    },
  });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <ChevronLeft size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Shop Details</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Edit your shop profile
            </Text>
          </View>
          <Pressable
            onPress={() => setAdminPreviewOpen(true)}
            style={[styles.adminViewButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Eye size={14} color={colors.textPrimary} />
            <Text style={[styles.adminViewButtonLabel, { color: colors.textPrimary }]}>Admin View</Text>
          </Pressable>
        </View>

        {wasRejected && (
          <View style={[styles.reviewNote, { backgroundColor: colors.info10 }]}>
            <Text style={[styles.reviewNoteText, { color: colors.info }]}>
              Your shop registration was rejected. Saving changes here resubmits it for admin
              review.
            </Text>
          </View>
        )}

        <View style={styles.heroWrap}>
          <Pressable onPress={() => setLogoPickerOpen(true)} style={styles.heroLogoWrap}>
            {logo[0]?.url ? (
              <Image source={{ uri: logo[0].url }} style={styles.heroLogo} />
            ) : (
              <View style={[styles.heroLogo, styles.heroLogoFallback, { backgroundColor: colors.grey100 }]}>
                <Store size={28} color={colors.textLight} />
              </View>
            )}
            <View style={[styles.heroLogoEdit, { backgroundColor: colors.accent, borderColor: colors.background }]}>
              <Building2 size={12} color={colors.textInverse} />
            </View>
          </Pressable>
          <Text style={[styles.heroName, { color: colors.textPrimary }]} numberOfLines={1}>
            {shopName || 'Your shop'}
          </Text>
          <Text style={[styles.heroHint, { color: colors.textSecondary }]}>
            Tap the logo to change it
          </Text>
        </View>

        {logoPickerOpen && (
          <Card style={styles.section}>
            <CardSectionHeader
              icon={<Store size={20} color={colors.accent} />}
              title="Branding"
              description="Your shop's logo and cover image"
              colors={colors}
            />
            <FieldLabel label="Logo" colors={colors} />
            <ProductImagePicker images={logo} onChange={setLogo} max={1} />
            <View style={{ height: Spacing.lg }} />
            <FieldLabel label="Cover Image" colors={colors} />
            <ProductImagePicker images={cover} onChange={setCover} max={1} />
          </Card>
        )}

        <Card style={styles.section}>
          <CardSectionHeader
            icon={<Store size={20} color={colors.accent} />}
            title="Shop Information"
            description="Basic details customers see about your shop"
            colors={colors}
          />
          <FieldLabel label="Shop Name" required colors={colors} />
          <CountedInput value={shopName} onChangeText={setShopName} placeholder="Enter shop name" maxLength={80} colors={colors} />

          <FieldLabel label="Owner Name" required colors={colors} />
          <CountedInput value={ownerName} onChangeText={setOwnerName} placeholder="Enter owner name" maxLength={80} colors={colors} />

          <FieldLabel label="Phone" required colors={colors} />
          <CountedInput value={phone} onChangeText={setPhone} placeholder="Enter phone number" maxLength={15} keyboardType="number-pad" colors={colors} />

          <FieldLabel label="Description" colors={colors} />
          <CountedInput
            value={description}
            onChangeText={setDescription}
            placeholder="Tell customers about your shop"
            maxLength={500}
            multiline
            colors={colors}
          />
        </Card>

        <Card style={styles.section}>
          <CardSectionHeader
            icon={<MapPin size={20} color={colors.accent} />}
            title="Address"
            description="Where your shop is located"
            colors={colors}
          />
          <FieldLabel label="Address" required colors={colors} />
          <CountedInput value={address} onChangeText={setAddress} placeholder="Enter full address" maxLength={200} colors={colors} />

          <View style={styles.row}>
            <View style={styles.col}>
              <FieldLabel label="City" required colors={colors} />
              <CountedInput value={city} onChangeText={setCity} placeholder="City" maxLength={60} colors={colors} />
            </View>
            <View style={styles.col}>
              <FieldLabel label="State" colors={colors} />
              <CountedInput value={state} onChangeText={setState} placeholder="State" maxLength={60} colors={colors} />
            </View>
          </View>
          <FieldLabel label="Postal Code" colors={colors} />
          <CountedInput value={postalCode} onChangeText={setPostalCode} placeholder="Postal code" maxLength={10} keyboardType="number-pad" colors={colors} />
        </Card>

        <Card style={styles.section}>
          <CardSectionHeader
            icon={<Clock3 size={20} color={colors.accent} />}
            title="Working Hours"
            description="When customers can expect you to be open"
            colors={colors}
          />
          <View style={styles.dayRow}>
            {WORKING_DAYS.map(day => {
              const selected = workingDays.includes(day);
              return (
                <Pressable
                  key={day}
                  onPress={() => toggleDay(day)}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: selected ? colors.accent : colors.card,
                      borderColor: selected ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.dayChipLabel, { color: selected ? colors.textInverse : colors.textSecondary }]}>
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <FieldLabel label="Opens at" colors={colors} />
              <CountedInput value={openTime} onChangeText={setOpenTime} placeholder="09:00" maxLength={5} colors={colors} />
            </View>
            <View style={styles.col}>
              <FieldLabel label="Closes at" colors={colors} />
              <CountedInput value={closeTime} onChangeText={setCloseTime} placeholder="21:00" maxLength={5} colors={colors} />
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <CardSectionHeader
            icon={<Landmark size={20} color={colors.accent} />}
            title="Bank Details"
            description="Where your payouts are sent"
            colors={colors}
          />
          <FieldLabel label="Account Holder Name" colors={colors} />
          <CountedInput value={accountName} onChangeText={setAccountName} placeholder="Enter account holder name" maxLength={80} colors={colors} />

          <FieldLabel label="Account Number" colors={colors} />
          <CountedInput value={accountNumber} onChangeText={setAccountNumber} placeholder="Enter account number" maxLength={20} keyboardType="number-pad" colors={colors} />

          <View style={styles.row}>
            <View style={styles.col}>
              <FieldLabel label="IFSC Code" colors={colors} />
              <CountedInput value={ifsc} onChangeText={setIfsc} placeholder="IFSC code" maxLength={11} colors={colors} />
            </View>
            <View style={styles.col}>
              <FieldLabel label="Bank Name" colors={colors} />
              <CountedInput value={bankName} onChangeText={setBankName} placeholder="Bank name" maxLength={80} colors={colors} />
            </View>
          </View>
        </Card>

        <View style={styles.footer}>
          <Button label="Cancel" variant="outline" onPress={() => navigation.goBack()} style={styles.footerButton} />
          <Button
            label={wasRejected ? 'Save & Resubmit' : 'Save Changes'}
            onPress={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            style={styles.footerButton}
          />
        </View>
      </ScrollView>

      {seller && (
        <AdminPreviewSheet
          visible={adminPreviewOpen}
          onClose={() => setAdminPreviewOpen(false)}
          seller={seller}
          colors={colors}
        />
      )}
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
  adminViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 32,
  },
  adminViewButtonLabel: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.semibold,
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
  reviewNote: {
    marginTop: Spacing.lg,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  reviewNoteText: {
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  heroWrap: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  heroLogoWrap: {
    width: 88,
    height: 88,
  },
  heroLogo: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
  },
  heroLogoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogoEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    marginTop: Spacing.md,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  heroHint: {
    marginTop: 2,
    fontSize: FontSize.xs,
  },
  section: {
    marginTop: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  col: {
    flex: 1,
  },
  dayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dayChip: {
    width: 44,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  footer: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  footerButton: {
    flex: 1,
  },
  previewScroll: {
    maxHeight: 560,
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  previewBannerText: {
    flex: 1,
    fontSize: FontSize.xxs,
  },
  previewCover: {
    width: '100%',
    height: 100,
    borderRadius: Radius.md,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  previewLogo: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
  },
  previewLogoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  previewShopName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  previewMeta: {
    marginTop: 1,
    fontSize: FontSize.xs,
  },
  previewBadgeRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  previewVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  previewVerifiedLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  previewContact: {
    marginTop: Spacing.sm,
    fontSize: FontSize.xs,
  },
  previewStatGrid: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  previewStat: {
    width: '31%',
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  previewStatValue: {
    marginTop: Spacing.xs,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  previewStatLabel: {
    fontSize: FontSize.xxxs,
  },
  previewLifecycle: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  previewLifecycleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  previewLifecycleLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  previewLifecycleValue: {
    fontSize: FontSize.xs,
  },
});
