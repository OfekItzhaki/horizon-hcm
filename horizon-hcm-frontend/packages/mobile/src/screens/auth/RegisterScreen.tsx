import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { authApi } from '@horizon-hcm/shared/src/api/auth';
import type { AuthNavigationProp } from '../../types/navigation';

interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface RegisterScreenProps {
  navigation: AuthNavigationProp;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      setIsLoading(true);

      await authApi.register({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });

      navigation.navigate('Login');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.surface} elevation={2}>
        <Text variant="headlineMedium" style={styles.title}>
          Create Account
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Sign up to get started
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <Controller
          control={control}
          name="name"
          rules={{ required: 'Name is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Full Name"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.name}
              disabled={isLoading}
              style={styles.input}
            />
          )}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Email"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              disabled={isLoading}
              style={styles.input}
            />
          )}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

        <Controller
          control={control}
          name="phone"
          rules={{ required: 'Phone is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Phone"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.phone}
              keyboardType="phone-pad"
              disabled={isLoading}
              style={styles.input}
            />
          )}
        />
        {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}

        <Controller
          control={control}
          name="password"
          rules={{
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Password"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.password}
              secureTextEntry
              disabled={isLoading}
              style={styles.input}
            />
          )}
        />
        {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

        <Controller
          control={control}
          name="confirmPassword"
          rules={{
            required: 'Please confirm your password',
            validate: (value) => value === password || 'Passwords do not match',
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Confirm Password"
              mode="outlined"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={!!errors.confirmPassword}
              secureTextEntry
              disabled={isLoading}
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
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
        >
          Sign Up
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Login')}
          disabled={isLoading}
          style={styles.linkButton}
        >
          Already have an account? Sign In
        </Button>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  surface: {
    margin: 16,
    marginTop: 40,
    padding: 24,
    borderRadius: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#757575',
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
  linkButton: {
    marginTop: 8,
  },
});
