import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { TextInput, HelperText, Menu } from 'react-native-paper';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: SelectOption[];
  error?: string;
  setValue: (name: Path<T>, value: string) => void;
  disabled?: boolean;
}

export default function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  error,
  setValue,
  disabled,
}: SelectFieldProps<T>) {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <Controller
        control={control}
        name={name}
        render={({ field: { value } }) => (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => !disabled && setMenuVisible(true)}>
                <TextInput
                  label={label}
                  value={value}
                  editable={false}
                  error={!!error}
                  mode="outlined"
                  disabled={disabled}
                  right={<TextInput.Icon icon="chevron-down" />}
                />
              </TouchableOpacity>
            }
          >
            {options.map((option) => (
              <Menu.Item
                key={option.value}
                onPress={() => {
                  setValue(name, option.value);
                  setMenuVisible(false);
                }}
                title={option.label}
              />
            ))}
          </Menu>
        )}
      />
      {error && <HelperText type="error">{error}</HelperText>}
    </>
  );
}
