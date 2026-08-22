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
import { FontSize } from '../../../theme/typography';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas';
import { useResetPassword } from '../hooks/useAuthMutations';
import { ROUTES, type AuthStackParamList } from '../../../navigation/routeConfig';
import { ApiError } from '../../../types/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const { colors } = useThemeColors();
  const toast = useToast();
  const resetPassword = useResetPassword();

  const { control, handleSubmit } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: route.params?.token ?? '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = handleSubmit(values => {
    resetPassword.mutate(values, {
      onSuccess: () => {
        toast.show({ type: 'success', title: 'Password reset — sign in with your new password.' });
        navigation.navigate(ROUTES.LOGIN);
      },
      onError: error => {
        toast.show({
          type: 'error',
          title: 'Could not reset password',
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
          Paste the token from your reset email and choose a new password.
        </Text>

        <FormTextInput
          control={control}
          name="token"
          label="Reset token"
          autoCapitalize="none"
        />
        <FormTextInput control={control} name="newPassword" label="New password" secureTextEntry />
        <FormTextInput
          control={control}
          name="confirmNewPassword"
          label="Confirm new password"
          secureTextEntry
        />

        <Button
          label="Reset password"
          onPress={onSubmit}
          loading={resetPassword.isPending}
          style={styles.submit}
        />
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
