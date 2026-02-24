import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { List, Switch, Divider, useTheme } from 'react-native-paper';
import { useAppStore, useAuthStore } from '@horizon-hcm/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkBiometricCapabilities, getBiometricName } from '../../utils/biometric';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunicationStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<CommunicationStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const paperTheme = useTheme();
  const { theme, setTheme, language, setLanguage } = useAppStore();
  const logout = useAuthStore((state) => state.logout);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometric');

  const isDarkMode = theme === 'dark';
  const isHebrew = language === 'he';

  useEffect(() => {
    checkBiometricSettings();
  }, []);

  const checkBiometricSettings = async () => {
    const capabilities = await checkBiometricCapabilities();
    setBiometricAvailable(capabilities.isAvailable);
    
    if (capabilities.isAvailable) {
      const name = await getBiometricName();
      setBiometricName(name);
      
      const enabled = await AsyncStorage.getItem('biometric_enabled');
      setBiometricEnabled(enabled === 'true');
    }
  };

  const handleBiometricToggle = async () => {
    if (!biometricEnabled) {
      // Enabling biometric
      const savedCredentials = await AsyncStorage.getItem('saved_credentials');
      if (!savedCredentials) {
        Alert.alert(
          'Setup Required',
          'Please login with your email and password first to enable biometric authentication.'
        );
        return;
      }
      await AsyncStorage.setItem('biometric_enabled', 'true');
      setBiometricEnabled(true);
    } else {
      // Disabling biometric
      Alert.alert(
        'Disable Biometric Login',
        'Are you sure you want to disable biometric login?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await AsyncStorage.setItem('biometric_enabled', 'false');
              setBiometricEnabled(false);
            },
          },
        ]
      );
    }
  };

  const handleThemeToggle = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const handleLanguageToggle = () => {
    setLanguage(isHebrew ? 'en' : 'he');
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <List.Item
          title="Dark Mode"
          description="Use dark theme"
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => <Switch value={isDarkMode} onValueChange={handleThemeToggle} />}
        />
        <Divider />
      </List.Section>

      <List.Section>
        <List.Subheader>Language</List.Subheader>
        <List.Item
          title="Hebrew"
          description="Use Hebrew language (RTL)"
          left={(props) => <List.Icon {...props} icon="translate" />}
          right={() => <Switch value={isHebrew} onValueChange={handleLanguageToggle} />}
        />
        <Divider />
      </List.Section>

      <List.Section>
        <List.Subheader>Security</List.Subheader>
        {biometricAvailable && (
          <>
            <List.Item
              title={`${biometricName} Login`}
              description={`Use ${biometricName} for quick login`}
              left={(props) => <List.Icon {...props} icon="fingerprint" />}
              right={() => <Switch value={biometricEnabled} onValueChange={handleBiometricToggle} />}
            />
            <Divider />
          </>
        )}
      </List.Section>

      <List.Section>
        <List.Subheader>Notifications</List.Subheader>
        <List.Item
          title="Push Notifications"
          description="Receive push notifications"
          left={(props) => <List.Icon {...props} icon="bell" />}
          right={() => <Switch value={true} onValueChange={() => {}} />}
        />
        <List.Item
          title="Email Notifications"
          description="Receive email notifications"
          left={(props) => <List.Icon {...props} icon="email" />}
          right={() => <Switch value={true} onValueChange={() => {}} />}
        />
        <Divider />
      </List.Section>

      <List.Section>
        <List.Subheader>Account</List.Subheader>
        <List.Item
          title="Profile"
          description="View and edit your profile"
          left={(props) => <List.Icon {...props} icon="account" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Profile')}
        />
        <List.Item
          title="Change Password"
          description="Update your password"
          left={(props) => <List.Icon {...props} icon="lock" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {}}
        />
        <Divider />
      </List.Section>

      <List.Section>
        <List.Item
          title="Logout"
          description="Sign out of your account"
          left={(props) => <List.Icon {...props} icon="logout" color="#f44336" />}
          titleStyle={{ color: '#f44336' }}
          onPress={handleLogout}
        />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
