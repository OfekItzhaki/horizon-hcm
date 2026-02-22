import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useAuthStore } from '@horizon-hcm/shared/src/store/auth.store';
import { authApi } from '@horizon-hcm/shared/src/api/auth';
import {
  checkBiometricCapabilities,
  authenticateWithBiometrics,
  getBiometricName,
} from '../../utils/biometric';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthNavigationProp } from '../../types/navigation';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginScreenProps {
  navigation: AuthNavigationProp;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometric');
  const login = useAuthStore((state) => state.login);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    checkBiometricSupport();
    attemptBiometricLogin();
  }, []);

  const checkBiometricSupport = async () => {
    const capabilities = await checkBiometricCapabilities();
    setBiometricAvailable(capabilities.isAvailable);
    if (capabilities.isAvailable) {
      const name = await getBiometricName();
      setBiometricName(name);
    }
  };

  const attemptBiometricLogin = async () => {
    try {
      const biometricEnabled = await AsyncStorage.getItem('biometric_enabled');
      const savedCredentials = await AsyncStorage.getItem('saved_credentials');

      if (biometricEnabled === 'true' && savedCredentials) {
        const result = await authenticateWithBiometrics('Login with biometrics');
        if (result.success) {
          const credentials = JSON.parse(savedCredentials);
          await performLogin(credentials.email, credentials.password);
        }
      }
    } catch (err) {
      // Silent fail - user can login manually
    }
  };

  const performLogin = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const loginResponse = await authApi.login({
        email,
        password,
      });
      const tokens = loginResponse.data;

      const userResponse = await authApi.getCurrentUser();
      const user = userResponse.data;

      login(user, tokens.accessToken, tokens.refreshToken);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      await performLogin(data.email, data.password);

      // Offer to enable biometric login
      if (biometricAvailable) {
        const biometricEnabled = await AsyncStorage.getItem('biometric_enabled');
        if (biometricEnabled !== 'true') {
          Alert.alert(
            'Enable Biometric Login',
            `Would you like to use ${biometricName} for faster login?`,
            [
              { text: 'Not Now', style: 'cancel' },
              {
                text: 'Enable',
                onPress: async () => {
                  await AsyncStorage.setItem('biometric_enabled', 'true');
                  await AsyncStorage.setItem('saved_credentials', JSON.stringify(data));
                },
              },
            ]
          );
        }
      }
    } catch (err) {
      // Error already handled in performLogin
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const savedCredentials = await AsyncStorage.getItem('saved_credentials');
      if (!savedCredentials) {
        Alert.alert(
          'Error',
          'No saved credentials found. Please login with email and password first.'
        );
        return;
      }

      const result = await authenticateWithBiometrics('Login with biometrics');
      if (result.success) {
        const credentials = JSON.parse(savedCredentials);
        await performLogin(credentials.email, credentials.password);
      } else {
        Alert.alert('Authentication Failed', result.error || 'Please try again');
      }
    } catch (err) {
      Alert.alert('Error', 'Biometric login failed');
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.surface} elevation={2}>
        <Text variant="headlineMedium" style={styles.title}>
          Horizon HCM
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Sign in to continue
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

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
          name="password"
          rules={{ required: 'Password is required' }}
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

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
        >
          Sign In
        </Button>

        {biometricAvailable && (
          <Button
            mode="outlined"
            onPress={handleBiometricLogin}
            disabled={isLoading}
            icon="fingerprint"
            style={styles.biometricButton}
          >
            Login with {biometricName}
          </Button>
        )}

        <Button
          mode="text"
          onPress={() => navigation.navigate('ForgotPassword')}
          disabled={isLoading}
          style={styles.linkButton}
        >
          Forgot Password?
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Register')}
          disabled={isLoading}
          style={styles.linkButton}
        >
          Don&apos;t have an account? Sign Up
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  surface: {
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
  biometricButton: {
    marginTop: 8,
  },
  linkButton: {
    marginTop: 8,
  },
});
