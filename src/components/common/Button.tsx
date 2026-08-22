import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useThemeColors } from '../../store/themeStore';
import { Radius, Spacing } from '../../theme/spacing';
import { FontSize, FontWeight } from '../../theme/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  leftIcon,
  rightIcon,
}: ButtonProps) {
  const { colors } = useThemeColors();
  const isDisabled = disabled || loading;

  const backgrounds: Record<ButtonVariant, string> = {
    primary: colors.buttonPrimaryBg,
    secondary: colors.buttonSecondaryBg,
    outline: 'transparent',
    danger: colors.buttonDangerBg,
  };

  const textColors: Record<ButtonVariant, string> = {
    primary: colors.buttonPrimaryText,
    secondary: colors.buttonSecondaryText,
    outline: colors.primary,
    danger: colors.buttonDangerText,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isDisabled
            ? colors.buttonDisabledBg
            : backgrounds[variant],
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.border,
          opacity: pressed && !isDisabled ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={isDisabled ? colors.buttonDisabledText : textColors[variant]}
        />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              styles.label,
              leftIcon ? styles.labelWithIcon : null,
              rightIcon ? styles.labelWithIcon : null,
              {
                color: isDisabled
                  ? colors.buttonDisabledText
                  : textColors[variant],
              },
            ]}
          >
            {label}
          </Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  labelWithIcon: {
    marginLeft: Spacing.sm,
  },
});
