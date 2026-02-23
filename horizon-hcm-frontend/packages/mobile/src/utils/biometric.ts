import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface BiometricCapabilities {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: string[];
}

export const checkBiometricCapabilities = async (): Promise<BiometricCapabilities> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    return {
      isAvailable: hasHardware && isEnrolled,
      hasHardware,
      isEnrolled,
      supportedTypes: supportedTypes.map((type) => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'Fingerprint';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'Iris';
          default:
            return 'Unknown';
        }
      }),
    };
  } catch (error) {
    return {
      isAvailable: false,
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
    };
  }
};

export const authenticateWithBiometrics = async (
  promptMessage: string = 'Authenticate to continue'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const capabilities = await checkBiometricCapabilities();

    if (!capabilities.isAvailable) {
      return {
        success: false,
        error: capabilities.hasHardware
          ? 'No biometric credentials enrolled'
          : 'Biometric authentication not available',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use passcode',
    });

    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication error',
    };
  }
};

export const getBiometricName = async (): Promise<string> => {
  const capabilities = await checkBiometricCapabilities();
  if (capabilities.supportedTypes.length > 0) {
    return capabilities.supportedTypes[0];
  }
  return 'Biometric';
};
