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
import {
  ROUTES,
  type AuthStackParamList,
} from '../../../navigation/routeConfig';
import { ApiError } from '../../../types/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { colors } = useThemeColors();
  const toast = useToast();
  const login = useLogin();

  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(values => {
    login.mutate(values, {
      onError: error => {
        toast.show({
          type: 'error',
          title: 'Login failed',
          message:
            error instanceof ApiError
              ? error.message
              : 'Something went wrong. Please try again.',
        });
      },
    });
  });

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.brandSection}>
          <View
            style={[
              styles.logoContainer,
              {
                backgroundColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.logoText,
                {
                  color: colors.background,
                },
              ]}
            >
              V
            </Text>
          </View>

          <View>
            <Text
              style={[
                styles.brandName,
                {
                  color: colors.textPrimary,
                },
              ]}
            >
              Vaymp
            </Text>

            <Text
              style={[
                styles.brandSubtitle,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              Seller Center
            </Text>
          </View>
        </View>

        {/* Welcome */}
        <View style={styles.hero}>
          <View
            style={[
              styles.welcomeBadge,
              {
                backgroundColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.welcomeBadgeText,
                {
                  color: colors.background,
                },
              ]}
            >
              SELLER PORTAL
            </Text>
          </View>

          <Text
            style={[
              styles.title,
              {
                color: colors.textPrimary,
              },
            ]}
          >
            Welcome back
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Sign in to manage your products, orders, earnings, and shop.
          </Text>
        </View>

        {/* Login Card */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.formTitle,
              {
                color: colors.textPrimary,
              },
            ]}
          >
            Sign in to your account
          </Text>

          <Text
            style={[
              styles.formDescription,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            Enter your seller account details below.
          </Text>

          <View style={styles.form}>
            <FormTextInput
              control={control}
              name="email"
              label="Email address"
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

            <View style={styles.forgotContainer}>
              <Text
                style={[
                  styles.forgotText,
                  {
                    color: colors.textLink,
                  },
                ]}
                onPress={() => navigation.navigate(ROUTES.FORGOT_PASSWORD)}
              >
                Forgot password?
              </Text>
            </View>

            <Button
              label="Sign in"
              onPress={onSubmit}
              loading={login.isPending}
              style={styles.submit}
            />
          </View>
        </View>

        {/* Benefits */}
        <View
          style={[
            styles.benefitsCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.benefitsTitle,
              {
                color: colors.textPrimary,
              },
            ]}
          >
            Manage your business in one place
          </Text>

          <Text
            style={[
              styles.benefitText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            • Manage products and inventory
          </Text>

          <Text
            style={[
              styles.benefitText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            • Track and fulfill orders
          </Text>

          <Text
            style={[
              styles.benefitText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            • Monitor earnings and payouts
          </Text>
        </View>

        {/* Register */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            New to Vaymp Seller?
          </Text>

          <Text
            style={[
              styles.registerText,
              {
                color: colors.textLink,
              },
            ]}
            onPress={() => navigation.navigate(ROUTES.REGISTER)}
          >
            Create your shop
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.huge,
  },

  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },

  logoText: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
  },

  brandName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },

  brandSubtitle: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },

  hero: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },

  welcomeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },

  welcomeBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },

  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },

  subtitle: {
    fontSize: FontSize.md,
    lineHeight: 23,
    marginTop: Spacing.sm,
    maxWidth: 340,
  },

  formCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: Spacing.lg,
  },

  formTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },

  formDescription: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },

  form: {
    marginTop: Spacing.xs,
  },

  forgotContainer: {
    alignItems: 'flex-end',
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
  },

  forgotText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  submit: {
    marginTop: Spacing.xs,
  },

  benefitsCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },

  benefitsTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.md,
  },

  benefitText: {
    fontSize: FontSize.sm,
    lineHeight: 24,
  },

  footer: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },

  footerText: {
    fontSize: FontSize.sm,
  },

  registerText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.xs,
  },
});
