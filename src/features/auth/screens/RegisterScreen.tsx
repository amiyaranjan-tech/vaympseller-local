import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../../../components/layout/Screen';
import { AppHeader } from '../../../components/layout/AppHeader';
import { Button } from '../../../components/common/Button';
import { FormTextInput } from '../../../components/forms/FormTextInput';
import { useToast } from '../../../components/feedback/Toast';
import { useThemeColors } from '../../../store/themeStore';
import { Spacing } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import { registerSchema, type RegisterFormValues } from '../schemas';
import { useRegister } from '../hooks/useAuthMutations';
import type { AuthStackParamList } from '../../../navigation/routeConfig';
import { ApiError } from '../../../types/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

// Single scrollable form, not a multi-step stepper — the seller-auth
// contract's register payload is flat enough (no branching/conditional
// sections) that a stepper would just be extra navigation state for the
// same 15 fields. Revisit if the real form grows document uploads/OTP
// verification steps.
function SectionLabel({ children }: { children: string }) {
  const { colors } = useThemeColors();
  return (
    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{children}</Text>
  );
}

export function RegisterScreen({ navigation }: Props) {
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

  return (
    <Screen>
      <AppHeader title="Create shop account" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <SectionLabel>Shop details</SectionLabel>
        <FormTextInput control={control} name="shopName" label="Shop name" />
        <FormTextInput control={control} name="ownerName" label="Owner name" />
        <FormTextInput
          control={control}
          name="email"
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <FormTextInput
          control={control}
          name="phone"
          label="Phone"
          keyboardType="phone-pad"
        />
        <FormTextInput control={control} name="password" label="Password" secureTextEntry />
        <FormTextInput
          control={control}
          name="confirmPassword"
          label="Confirm password"
          secureTextEntry
        />

        <SectionLabel>Address</SectionLabel>
        <FormTextInput control={control} name="address" label="Address" />
        <FormTextInput control={control} name="city" label="City" />
        <FormTextInput control={control} name="state" label="State" />
        <FormTextInput control={control} name="postalCode" label="Postal code" />

        <SectionLabel>Business</SectionLabel>
        <FormTextInput control={control} name="gstNumber" label="GST number" autoCapitalize="characters" />
        <FormTextInput
          control={control}
          name="businessRegistration"
          label="Business registration number"
        />

        <SectionLabel>Bank details (for payouts)</SectionLabel>
        <FormTextInput control={control} name="bank.accountName" label="Account holder name" />
        <FormTextInput control={control} name="bank.accountNumber" label="Account number" keyboardType="number-pad" />
        <FormTextInput control={control} name="bank.ifsc" label="IFSC code" autoCapitalize="characters" />
        <FormTextInput control={control} name="bank.bankName" label="Bank name" />

        <Button
          label="Create account"
          onPress={onSubmit}
          loading={register.isPending}
          style={styles.submit}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.huge,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  submit: {
    marginTop: Spacing.xl,
  },
});
