import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  CreditCard,
  FileText,
  Hash,
  Landmark,
  Lock,
  Mail,
  Map,
  MapPin,
  Percent,
  Phone,
  ShieldCheck,
  Store,
  User,
} from 'lucide-react-native';

import { Screen } from '../../../components/layout/Screen';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { FormTextInput } from '../../../components/forms/FormTextInput';
import { useToast } from '../../../components/feedback/Toast';
import { useThemeColors } from '../../../store/themeStore';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import { registerSchema, type RegisterFormValues } from '../schemas';
import { useRegister } from '../hooks/useAuthMutations';
import { ROUTES, type AuthStackParamList } from '../../../navigation/routeConfig';
import { ApiError } from '../../../types/api';

type Colors = ReturnType<typeof useThemeColors>['colors'];
type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

function SectionHeader({
  icon,
  title,
  description,
  colors,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  colors: Colors;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: colors.accent10 }]}>{icon}</View>
      <View style={styles.sectionHeaderText}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

export function RegisterScreen({ navigation }: Props) {
  const { colors } = useThemeColors();
  const toast = useToast();
  const register = useRegister();

  const { control, handleSubmit } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      shopName: '',
      ownerName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      gstNumber: '',
      businessRegistration: '',
      bank: { accountName: '', accountNumber: '', ifsc: '', bankName: '' },
    },
  });

  const onSubmit = handleSubmit(values => {
    register.mutate(values, {
      onError: error => {
        toast.show({
          type: 'error',
          title: 'Registration failed',
          message: error instanceof ApiError ? error.message : 'Something went wrong.',
        });
      },
    });
  });

  const iconColor = colors.accent;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </Pressable>

        <Text style={[styles.title, { color: colors.textPrimary }]}>Create shop account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Fill in the details to get started with Vaymp
        </Text>

        <Card style={styles.card}>
          <SectionHeader
            icon={<Store size={20} color={iconColor} />}
            title="Shop details"
            description="Basic information about your shop"
            colors={colors}
          />
          <View style={styles.row}>
            <View style={styles.col}>
              <FormTextInput
                control={control}
                name="shopName"
                label="Shop name"
                required
                placeholder="Enter shop name"
                leftIcon={<Store size={18} color={colors.textLight} />}
              />
            </View>
            <View style={styles.col}>
              <FormTextInput
                control={control}
                name="ownerName"
                label="Owner name"
                required
                placeholder="Enter owner name"
                leftIcon={<User size={18} color={colors.textLight} />}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <FormTextInput
                control={control}
                name="email"
                label="Email"
                required
                placeholder="Enter email address"
                autoCapitalize="none"
                keyboardType="email-address"
                leftIcon={<Mail size={18} color={colors.textLight} />}
              />
            </View>
            <View style={styles.col}>
              <FormTextInput
                control={control}
                name="phone"
                label="Phone number"
                required
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                leftIcon={<Phone size={18} color={colors.textLight} />}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <FormTextInput
                control={control}
                name="password"
                label="Password"
                required
                placeholder="Enter password"
                secureTextEntry
                leftIcon={<Lock size={18} color={colors.textLight} />}
              />
            </View>
            <View style={styles.col}>
              <FormTextInput
                control={control}
                name="confirmPassword"
                label="Confirm password"
                required
                placeholder="Confirm password"
                secureTextEntry
                leftIcon={<Lock size={18} color={colors.textLight} />}
              />
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <SectionHeader
            icon={<MapPin size={20} color={iconColor} />}
            title="Address"
            description="Your business address"
            colors={colors}
          />
          <FormTextInput
            control={control}
            name="address"
            label="Address"
            required
            placeholder="Enter full address"
            leftIcon={<MapPin size={18} color={colors.textLight} />}
          />
          <View style={styles.row}>
            <View style={styles.col}>
              <FormTextInput
                control={control}
                name="city"
                label="City"
                required
                placeholder="Enter city"
                leftIcon={<Building2 size={18} color={colors.textLight} />}
              />
            </View>
            <View style={styles.col}>
              <FormTextInput
                control={control}
                name="state"
                label="State"
                required
                placeholder="Enter state"
                leftIcon={<Map size={18} color={colors.textLight} />}
              />
            </View>
            <View style={styles.col}>
              <FormTextInput
                control={control}
                name="postalCode"
                label="Postal code"
                required
                placeholder="Enter postal code"
                keyboardType="number-pad"
                leftIcon={<Hash size={18} color={colors.textLight} />}
              />
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <SectionHeader
            icon={<FileText size={20} color={iconColor} />}
            title="Business information"
            description="Tax and business registration details"
            colors={colors}
          />
          <View style={styles.row}>
            <View style={styles.col}>
              <FormTextInput
                control={control}
                name="gstNumber"
                label="GST number"
                placeholder="Enter GST number (optional)"
                autoCapitalize="characters"
                leftIcon={<Percent size={18} color={colors.textLight} />}
              />
            </View>
            <View style={styles.col}>
              <FormTextInput
                control={control}
                name="businessRegistration"
                label="Business registration number"
                placeholder="Enter registration number (optional)"
                leftIcon={<FileText size={18} color={colors.textLight} />}
              />
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <SectionHeader
            icon={<Landmark size={20} color={iconColor} />}
            title="Bank details"
            description="Add your bank account for secure payouts"
            colors={colors}
          />
          <View style={styles.row}>
            <View style={styles.col}>
              <FormTextInput
                control={control}
                name="bank.accountName"
                label="Account holder name"
                required
                placeholder="Enter account holder name"
                leftIcon={<User size={18} color={colors.textLight} />}
              />
            </View>
            <View style={styles.col}>
              <FormTextInput
                control={control}
                name="bank.accountNumber"
                label="Account number"
                required
                placeholder="Enter account number"
                keyboardType="number-pad"
                leftIcon={<CreditCard size={18} color={colors.textLight} />}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <FormTextInput
                control={control}
                name="bank.ifsc"
                label="IFSC code"
                required
                placeholder="Enter IFSC code"
                autoCapitalize="characters"
                leftIcon={<ShieldCheck size={18} color={colors.textLight} />}
              />
            </View>
            <View style={styles.col}>
              <FormTextInput
                control={control}
                name="bank.bankName"
                label="Bank name"
                required
                placeholder="Enter bank name"
                leftIcon={<Landmark size={18} color={colors.textLight} />}
              />
            </View>
          </View>
        </Card>

        <View style={[styles.safeBanner, { backgroundColor: colors.accent10 }]}>
          <View style={[styles.safeIcon, { backgroundColor: colors.accent }]}>
            <ShieldCheck size={20} color={colors.textInverse} />
          </View>
          <View style={styles.safeText}>
            <Text style={[styles.safeTitle, { color: colors.textPrimary }]}>
              Your data is safe with us
            </Text>
            <Text style={[styles.safeDescription, { color: colors.textSecondary }]}>
              We use industry standard security to protect your information.
            </Text>
          </View>
        </View>

        <Button
          label="Create account"
          onPress={onSubmit}
          loading={register.isPending}
          style={styles.submit}
          rightIcon={<ArrowRight size={18} color={colors.buttonPrimaryText} />}
        />

        <View style={styles.footer}>
          <Text style={{ color: colors.textSecondary }}>Already have an account? </Text>
          <Text
            style={{ color: colors.textLink, fontWeight: FontWeight.semibold }}
            onPress={() => navigation.navigate(ROUTES.LOGIN)}
          >
            Login
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: Spacing.lg,
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    marginTop: Spacing.xxs,
    fontSize: FontSize.sm,
  },
  card: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  sectionDescription: {
    marginTop: 1,
    fontSize: FontSize.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  col: {
    flex: 1,
  },
  safeBanner: {
    marginTop: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  safeIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  safeText: {
    flex: 1,
  },
  safeTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  safeDescription: {
    marginTop: 1,
    fontSize: FontSize.xs,
  },
  submit: {
    marginTop: Spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
});
