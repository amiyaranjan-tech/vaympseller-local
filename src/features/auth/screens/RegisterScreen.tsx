import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { StepProgressBar } from '../../../components/common/StepProgressBar';
import { FormTextInput } from '../../../components/forms/FormTextInput';
import { useToast } from '../../../components/feedback/Toast';
import { useThemeColors } from '../../../store/themeStore';
import { Spacing, Radius } from '../../../theme/spacing';
import { FontSize, FontWeight, LineHeight } from '../../../theme/typography';
import { registerSchema, type RegisterFormValues } from '../schemas';
import { useRegister } from '../hooks/useAuthMutations';
import { ROUTES, type AuthStackParamList } from '../../../navigation/routeConfig';
import { ApiError } from '../../../types/api';

type Colors = ReturnType<typeof useThemeColors>['colors'];
type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const TOTAL_STEPS = 3;

// Which fields belong to each step — validated (via RHF's trigger) before
// letting the customer move to the next one, same "don't let a step 1
// mistake surface as a step 3 error" reasoning a real multi-step form
// needs. 'bank' triggers its whole nested subtree in one go.
const STEP_FIELDS: (keyof RegisterFormValues)[][] = [
  ['shopName', 'ownerName', 'email', 'phone', 'password', 'confirmPassword'],
  ['address', 'city', 'state', 'postalCode'],
  ['gstNumber', 'businessRegistration', 'bank'],
];

function SectionHeader({
  index,
  icon,
  title,
  description,
  colors,
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  colors: Colors;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionBadge, { backgroundColor: colors.accent }]}>
        <Text style={[styles.sectionBadgeText, { color: colors.textInverse }]}>{index}</Text>
      </View>
      <View style={styles.sectionHeaderText}>
        <View style={styles.sectionTitleRow}>
          {icon}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
        </View>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

export function RegisterScreen({ navigation }: Props) {
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const register = useRegister();
  const [step, setStep] = React.useState(0);

  const { control, handleSubmit, trigger } = useForm<RegisterFormValues>({
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

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep(current => current + 1);
  };

  const goBack = () => {
    if (step === 0) {
      navigation.goBack();
      return;
    }
    setStep(current => current - 1);
  };

  const iconColor = colors.accent;
  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <Screen>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, styles.contentWithFixedBar]}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={Spacing.xxl}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable
            onPress={goBack}
            hitSlop={12}
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <ChevronLeft size={22} color={colors.textPrimary} />
          </Pressable>

          <StepProgressBar step={step} total={TOTAL_STEPS} />
        </View>

        {step === 0 && (
          <>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Create your{'\n'}
              <Text style={{ color: colors.accent }}>shop account</Text>
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Start selling with Vaymp. It only takes a few minutes.
            </Text>
          </>
        )}

        {step === 0 && (
          <Card style={styles.card}>
            <SectionHeader
              index={1}
              icon={<Store size={18} color={iconColor} style={styles.sectionIcon} />}
              title="Shop details"
              description="Basic information about your shop"
              colors={colors}
            />
            <FormTextInput
              control={control}
              name="shopName"
              label="Shop name"
              required
              placeholder="Enter shop name"
              leftIcon={<Store size={18} color={colors.textLight} />}
            />
            <FormTextInput
              control={control}
              name="ownerName"
              label="Owner name"
              required
              placeholder="Enter owner name"
              leftIcon={<User size={18} color={colors.textLight} />}
            />
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
            <FormTextInput
              control={control}
              name="phone"
              label="Phone number"
              required
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              leftIcon={<Phone size={18} color={colors.textLight} />}
            />
            <FormTextInput
              control={control}
              name="password"
              label="Password"
              required
              placeholder="Enter password"
              secureTextEntry
              leftIcon={<Lock size={18} color={colors.textLight} />}
            />
            <FormTextInput
              control={control}
              name="confirmPassword"
              label="Confirm password"
              required
              placeholder="Confirm password"
              secureTextEntry
              leftIcon={<Lock size={18} color={colors.textLight} />}
            />
          </Card>
        )}

        {step === 1 && (
          <Card style={styles.card}>
            <SectionHeader
              index={2}
              icon={<MapPin size={18} color={iconColor} style={styles.sectionIcon} />}
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
            <FormTextInput
              control={control}
              name="city"
              label="City"
              required
              placeholder="Enter city"
              leftIcon={<Building2 size={18} color={colors.textLight} />}
            />
            <FormTextInput
              control={control}
              name="state"
              label="State"
              required
              placeholder="Enter state"
              leftIcon={<Map size={18} color={colors.textLight} />}
            />
            <FormTextInput
              control={control}
              name="postalCode"
              label="Postal code"
              required
              placeholder="Enter postal code"
              keyboardType="number-pad"
              leftIcon={<Hash size={18} color={colors.textLight} />}
            />
          </Card>
        )}

        {isLastStep && (
          <>
            <Card style={styles.card}>
              <SectionHeader
                index={3}
                icon={<FileText size={18} color={iconColor} style={styles.sectionIcon} />}
                title="Business information"
                description="Tax and business registration details"
                colors={colors}
              />
              <FormTextInput
                control={control}
                name="gstNumber"
                label="GST number"
                required
                placeholder="Enter GST number"
                autoCapitalize="characters"
                maxLength={15}
                leftIcon={<Percent size={18} color={colors.textLight} />}
              />
              <FormTextInput
                control={control}
                name="businessRegistration"
                label="Business registration number"
                required
                placeholder="Enter registration number"
                leftIcon={<FileText size={18} color={colors.textLight} />}
              />
            </Card>

            <Card style={styles.card}>
              <SectionHeader
                index={4}
                icon={<Landmark size={18} color={iconColor} style={styles.sectionIcon} />}
                title="Bank details"
                description="Add your bank account for secure payouts"
                colors={colors}
              />
              <FormTextInput
                control={control}
                name="bank.accountName"
                label="Account holder name"
                required
                placeholder="Enter account holder name"
                leftIcon={<User size={18} color={colors.textLight} />}
              />
              <FormTextInput
                control={control}
                name="bank.accountNumber"
                label="Account number"
                required
                placeholder="Enter account number"
                keyboardType="number-pad"
                leftIcon={<CreditCard size={18} color={colors.textLight} />}
              />
              <FormTextInput
                control={control}
                name="bank.ifsc"
                label="IFSC code"
                required
                placeholder="Enter IFSC code"
                autoCapitalize="characters"
                leftIcon={<ShieldCheck size={18} color={colors.textLight} />}
              />
              <FormTextInput
                control={control}
                name="bank.bankName"
                label="Bank name"
                required
                placeholder="Enter bank name"
                leftIcon={<Landmark size={18} color={colors.textLight} />}
              />
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

            <View style={styles.footer}>
              <Text style={{ color: colors.textSecondary }}>Already have an account? </Text>
              <Text
                style={{ color: colors.textLink, fontWeight: FontWeight.semibold }}
                onPress={() => navigation.navigate(ROUTES.LOGIN)}
              >
                Login
              </Text>
            </View>
          </>
        )}

      </KeyboardAwareScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + Spacing.md,
          },
        ]}
      >
        {isLastStep ? (
          <Button
            label="Create account"
            onPress={onSubmit}
            loading={register.isPending}
            rightIcon={<ArrowRight size={18} color={colors.buttonPrimaryText} />}
          />
        ) : (
          <Button
            label="Continue"
            onPress={() => void goNext()}
            rightIcon={<ArrowRight size={18} color={colors.buttonPrimaryText} />}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  contentWithFixedBar: {
    // Room for the fixed Continue bar below so the last field isn't
    // hidden behind it.
    paddingBottom: Spacing.giant + Spacing.xxxl,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
    lineHeight: LineHeight.xxxl,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
  },
  card: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  sectionBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sectionBadgeText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionIcon: {
    marginRight: 2,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  sectionDescription: {
    marginTop: 1,
    fontSize: FontSize.xs,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
});
