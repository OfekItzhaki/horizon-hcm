import React from 'react';
import { TextInput, HelperText, TextInputProps } from 'react-native-paper';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';

interface FormFieldProps<T extends FieldValues> extends Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'error'
> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  error?: string;
  rules?: object;
}

export default function FormField<T extends FieldValues>({
  control,
  name,
  label,
  error,
  rules,
  ...textInputProps
}: FormFieldProps<T>) {
  return (
    <>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label={label}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!error}
            mode="outlined"
            {...textInputProps}
          />
        )}
      />
      {error && <HelperText type="error">{error}</HelperText>}
    </>
  );
}
