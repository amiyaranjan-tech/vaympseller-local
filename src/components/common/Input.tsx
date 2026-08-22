import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from 'react-native';

import { useThemeColors } from '../../store/themeStore';
import { Radius, Spacing } from '../../theme/spacing';
import { FontSize, FontWeight } from '../../theme/typography';

interface InputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Input({
  label,
  required,
  error,
  secureTextEntry,
  leftIcon,
  style,
  ...rest
}: InputProps) {
  const { colors } = useThemeColors();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
          {required ? <Text style={{ color: colors.error }}> *</Text> : null}
        </Text>
      ) : null}

      <View style={styles.inputRow}>
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          {...rest}
          secureTextEntry={secureTextEntry ? hidden : false}
          onFocus={e => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.inputPlaceholder}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              borderColor: error
                ? colors.error
                : focused
                  ? colors.inputBorderFocused
                  : colors.inputBorder,
              color: colors.textPrimary,
              paddingLeft: leftIcon ? 44 : Spacing.md,
              paddingRight: secureTextEntry ? 56 : Spacing.md,
            },
            style,
          ]}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            style={styles.toggle}
            onPress={() => setHidden(v => !v)}
            hitSlop={8}
          >
            <Text style={{ color: colors.textLink, fontSize: FontSize.xs }}>
              {hidden ? 'Show' : 'Hide'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  inputRow: {
    justifyContent: 'center',
  },
  input: {
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
  },
  toggle: {
    position: 'absolute',
    right: Spacing.md,
  },
  leftIcon: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 1,
  },
  error: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
});
