import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen } from '../../../components/layout/Screen';
import { Button } from '../../../components/common/Button';
import { FormTextInput } from '../../../components/forms/FormTextInput';
import { useToast } from '../../../components/feedback/Toast';
import { useThemeColors } from '../../../store/themeStore';
import { Spacing } from '../../../theme/spacing';
import { FontSize, FontWeight } from '../../../theme/typography';
import { loginSchema, type LoginFormValues } from '../schemas';
import { useLogin } from '../hooks/useAuthMutations';
import { ROUTES, type AuthStackParamList } from '../../../navigation/routeConfig';
import { ApiError } from '../../../types/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { colors } = useThemeColors();
  const toast = useToast();
  const login = useLogin();

  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(values => {
    login.mutate(values, {
      onError: error => {
        toast.show({
          type: 'error',
          title: 'Login failed',
          message: error instanceof ApiError ? error.message : 'Something went wrong.',
        });
      },
    });
  });

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to manage your shop.
        </Text>

        <View style={styles.form}>
          <FormTextInput
            control={control}
            name="email"
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <FormTextInput
            control={control}
            name="password"
            label="Password"
            secureTextEntry
            autoComplete="password"
          />

          <Button
            label="Sign in"
            onPress={onSubmit}
            loading={login.isPending}
            style={styles.submit}
          />

          <Button
            label="Forgot password?"
            variant="outline"
            onPress={() => navigation.navigate(ROUTES.FORGOT_PASSWORD)}
            style={styles.link}
          />
        </View>

        <View style={styles.footer}>
          <Text style={{ color: colors.textSecondary }}>New to Vaymp Seller? </Text>
          <Text
            style={{ color: colors.textLink, fontWeight: FontWeight.semibold }}
            onPress={() => navigation.navigate(ROUTES.REGISTER)}
          >
            Create a shop account
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxl,
  },
  form: {
    marginTop: Spacing.sm,
  },
  submit: {
    marginTop: Spacing.sm,
  },
  link: {
    marginTop: Spacing.sm,
    borderWidth: 0,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
});
