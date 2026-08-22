import React from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { Input } from '../common/Input';
import type { TextInputProps } from 'react-native';

interface FormTextInputProps<TFieldValues extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
}

// Thin RHF Controller wrapper around the plain Input — screens that don't
// use React Hook Form (rare in this app) use Input directly instead.
export function FormTextInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  ...rest
}: FormTextInputProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState }) => (
        <Input
          {...rest}
          label={label}
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
          onBlur={onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
