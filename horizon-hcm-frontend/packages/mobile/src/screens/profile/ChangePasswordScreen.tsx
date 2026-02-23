import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { usersApi } from '@horizon-hcm/shared/src/api/users';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunicationStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<CommunicationStackParamList, 'ChangePassword'>;

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePasswordScreen({ navigation }: Props) {
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  const updateMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      usersApi.changePassword(data),
    onSuccess: () => {
      Alert.alert('Success', 'Password changed successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to change password');
    },
  });

  const onSubmit = (data: PasswordFormData) => {
    setError(null);
    updateMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text variant="bodyMedium" style={styles.description}>
          Enter your current password and choose a new password. Your new password must be at
          least 8 characters long.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <Controller
          control={control}
          name="currentPassword"
          rules={{ required: 'Current password is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Current Password"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.currentPassword}
              secureTextEntry
              disabled={updateMutation.isPending}
              style={styles.input}
            />
          )}
        />
        {errors.currentPassword && (
          <Text style={styles.errorText}>{errors.currentPassword.message}</Text>
        )}

        <Controller
          control={control}
          name="newPassword"
          rules={{
            required: 'New password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              message: 'Password must contain uppercase, lowercase, and number',
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="New Password"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.newPassword}
              secureTextEntry
              disabled={updateMutation.isPending}
              style={styles.input}
            />
          )}
        />
        {errors.newPassword && (
          <Text style={styles.errorText}>{errors.newPassword.message}</Text>
        )}

        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: 'Please confirm your password',
            validate: (value) => value === newPassword || 'Passwords do not match',
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Confirm New Password"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.confirmPassword}
              secureTextEntry
              disabled={updateMutation.isPending}
              style={styles.input}
            />
          )}
        />
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={updateMutation.isPending}
          disabled={updateMutation.isPending}
          style={styles.button}
        >
          Change Password
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          disabled={updateMutation.isPending}
          style={styles.button}
        >
          Cancel
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 16,
  },
  description: {
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 8,
  },
  error: {
    color: '#f44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
  },
});
