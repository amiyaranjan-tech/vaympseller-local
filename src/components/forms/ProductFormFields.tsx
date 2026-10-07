import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, ChevronDown, Info, Plus, Search } from 'lucide-react-native';

import { BottomSheet } from '../common/BottomSheet';
import { useThemeColors } from '../../store/themeStore';
import { Spacing, Radius } from '../../theme/spacing';
import { FontSize, FontWeight } from '../../theme/typography';

type Colors = ReturnType<typeof useThemeColors>['colors'];

// Shared field primitives for the product create/edit forms
// (AddProductScreen, ProductDetailsScreen) — pulled out once a second
// screen needed the same label/counted-input/select/checkbox shapes.

// Icon + title + description row that opens a Card section — matches
// RegisterScreen's own (still-local) SectionHeader; pulled out here once
// ShopDetailsScreen needed the same shape.
export function CardSectionHeader({
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
    <View style={styles.cardSectionHeader}>
      <View style={[styles.cardSectionIcon, { backgroundColor: colors.accent10 }]}>{icon}</View>
      <View style={styles.cardSectionHeaderText}>
        <Text style={[styles.cardSectionTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.cardSectionDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

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

// Option list in a bottom sheet — searchable, and with `onCreate` an
// "Add" row for a value that isn't in the list yet (same as the admin
// form's create-able Comboboxes). Shared by SelectField and
// AddProductScreen's per-variant size picker.
export function OptionSheet({
  visible,
  onClose,
  title,
  value,
  options,
  onSelect,
  onCreate,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  onCreate?: (value: string) => Promise<unknown>;
  colors: Colors;
}) {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const q = query.trim();
  const filtered = q ? options.filter(o => o.toLowerCase().includes(q.toLowerCase())) : options;
  const canCreate = !!onCreate && !!q && !options.some(o => o.toLowerCase() === q.toLowerCase());
  const showSearch = !!onCreate || options.length > 8;

  const close = () => {
    setQuery('');
    onClose();
  };

  const pick = (option: string) => {
    onSelect(option);
    close();
  };

  const create = async () => {
    if (!onCreate) return;
    setCreating(true);
    try {
      await onCreate(q);
      pick(q);
    } catch {
      // The caller's onCreate shows its own error.
    } finally {
      setCreating(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={close}>
      <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{title}</Text>
      {showSearch && (
        <View style={[styles.searchField, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
          <Search size={16} color={colors.textLight} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={onCreate ? 'Search or add new' : 'Search'}
            placeholderTextColor={colors.inputPlaceholder}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            autoCorrect={false}
          />
        </View>
      )}
      <ScrollView style={styles.sheetList} keyboardShouldPersistTaps="handled">
        {canCreate && (
          <Pressable onPress={create} disabled={creating} style={styles.sheetRow}>
            <View style={styles.addRow}>
              {creating ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Plus size={18} color={colors.accent} />
              )}
              <Text style={[styles.sheetRowLabel, { color: colors.accent }]}>Add "{q}"</Text>
            </View>
          </Pressable>
        )}
        {filtered.map(option => (
          <Pressable key={option} onPress={() => pick(option)} style={styles.sheetRow}>
            <Text style={[styles.sheetRowLabel, { color: colors.textPrimary }]}>{option}</Text>
            {value === option && <Check size={18} color={colors.accent} />}
          </Pressable>
        ))}
        {filtered.length === 0 && !canCreate && (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {options.length === 0 ? 'Nothing to choose yet' : 'No matches'}
          </Text>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

export function SelectField({
  label,
  required,
  placeholder,
  value,
  options,
  onSelect,
  onCreate,
  colors,
}: {
  label: string;
  required?: boolean;
  placeholder: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  onCreate?: (value: string) => Promise<unknown>;
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

      <OptionSheet
        visible={open}
        onClose={() => setOpen(false)}
        title={label}
        value={value}
        options={options}
        onSelect={onSelect}
        onCreate={onCreate}
        colors={colors}
      />
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
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  cardSectionIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardSectionHeaderText: {
    flex: 1,
  },
  cardSectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  cardSectionDescription: {
    marginTop: 1,
    fontSize: FontSize.xs,
  },
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
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: {
    paddingVertical: Spacing.lg,
    textAlign: 'center',
    fontSize: FontSize.sm,
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
