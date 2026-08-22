import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, ChevronDown, Info } from 'lucide-react-native';

import { BottomSheet } from '../common/BottomSheet';
import { useThemeColors } from '../../store/themeStore';
import { Spacing, Radius } from '../../theme/spacing';
import { FontSize, FontWeight } from '../../theme/typography';

type Colors = ReturnType<typeof useThemeColors>['colors'];

// Shared field primitives for the product create/edit forms
// (AddProductScreen, ProductDetailsScreen) — pulled out once a second
// screen needed the same label/counted-input/select/checkbox shapes.

export function FieldLabel({
  label,
  required,
  colors,
}: {
  label: string;
  required?: boolean;
  colors: Colors;
}) {
  return (
    <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
      {label}
      {required ? <Text style={{ color: colors.error }}> *</Text> : null}
    </Text>
  );
}

export function CountedInput({
  value,
  onChangeText,
  placeholder,
  maxLength,
  multiline,
  keyboardType,
  colors,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  maxLength: number;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  colors: Colors;
}) {
  return (
    <View
      style={[
        styles.countedField,
        multiline && styles.countedFieldMultiline,
        { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inputPlaceholder}
        maxLength={maxLength}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[
          styles.countedInput,
          multiline && styles.countedInputMultiline,
          { color: colors.textPrimary },
        ]}
      />
      <Text style={[styles.counter, { color: colors.textLight }]}>
        {value.length}/{maxLength}
      </Text>
    </View>
  );
}

export function SelectField({
  label,
  required,
  placeholder,
  value,
  options,
  onSelect,
  colors,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  colors: Colors;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.selectContainer}>
      <FieldLabel label={label} required={required} colors={colors} />
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.selectField,
          { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
        ]}
      >
        <Text
          style={[
            styles.selectValue,
            { color: value ? colors.textPrimary : colors.inputPlaceholder },
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color={colors.textLight} />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{label}</Text>
        <ScrollView style={styles.sheetList}>
          {options.map(option => (
            <Pressable
              key={option}
              onPress={() => {
                onSelect(option);
                setOpen(false);
              }}
              style={styles.sheetRow}
            >
              <Text style={[styles.sheetRowLabel, { color: colors.textPrimary }]}>{option}</Text>
              {value === option && <Check size={18} color={colors.accent} />}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

export function FlagCheckbox({
  title,
  description,
  checked,
  disabled,
  onToggle,
  colors,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  colors: Colors;
}) {
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      style={[styles.flagRow, disabled && styles.flagRowDisabled]}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: checked ? colors.accent : colors.inputBorder,
            backgroundColor: checked ? colors.accent : 'transparent',
          },
        ]}
      >
        {checked && <Check size={14} color={colors.textInverse} />}
      </View>
      <View style={styles.flagContent}>
        <Text style={[styles.flagTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.flagDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Info size={16} color={colors.textLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  countedField: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  countedFieldMultiline: {
    minHeight: 120,
    alignItems: 'flex-end',
  },
  countedInput: {
    flex: 1,
    width: '100%',
    paddingHorizontal: Spacing.md,
    paddingRight: 56,
    fontSize: FontSize.md,
  },
  countedInputMultiline: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    textAlignVertical: 'top',
  },
  counter: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.sm,
    fontSize: FontSize.xxs,
  },
  selectContainer: {
    marginBottom: Spacing.lg,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  selectValue: {
    flex: 1,
    fontSize: FontSize.md,
    marginRight: Spacing.sm,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  sheetList: {
    maxHeight: 360,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  sheetRowLabel: {
    fontSize: FontSize.md,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  flagRowDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  flagContent: {
    flex: 1,
  },
  flagTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  flagDescription: {
    marginTop: 1,
    fontSize: FontSize.xs,
  },
});
