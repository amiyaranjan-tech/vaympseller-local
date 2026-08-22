import React, { useState } from 'react';
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
import { FontSize } from '../../../theme/typography';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas';
import { useForgotPassword } from '../hooks/useAuthMutations';
import { ROUTES, type AuthStackParamList } from '../../../navigation/routeConfig';
import { ApiError } from '../../../types/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { colors } = useThemeColors();
  const toast = useToast();
  const forgotPassword = useForgotPassword();
  const [sent, setSent] = useState(false);

  const { control, handleSubmit } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(values => {
    forgotPassword.mutate(values, {
      onSuccess: () => setSent(true),
      onError: error => {
        toast.show({
          type: 'error',
          title: 'Could not send reset email',
          message: error instanceof ApiError ? error.message : 'Something went wrong.',
        });
      },
    });
  });

  return (
    <Screen>
      <AppHeader title="Reset password" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {sent
            ? "If that email is on a shop account, we've sent a reset link — open it, then paste the token here."
            : "Enter the email on your shop account and we'll send a reset link."}
        </Text>

        {!sent ? (
          <>
            <FormTextInput
              control={control}
              name="email"
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Button
              label="Send reset link"
              onPress={onSubmit}
              loading={forgotPassword.isPending}
              style={styles.submit}
            />
          </>
        ) : (
          <Button
            label="I have my reset token"
            onPress={() => navigation.navigate(ROUTES.RESET_PASSWORD)}
            style={styles.submit}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.xl,
  },
  subtitle: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xl,
  },
  submit: {
    marginTop: Spacing.sm,
  },
});
