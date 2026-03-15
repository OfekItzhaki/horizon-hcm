import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { List, Switch, Divider, useTheme } from 'react-native-paper';
import { useAppStore, useAuthStore } from '@horizon-hcm/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkBiometricCapabilities, getBiometricName } from '../../utils/biometric';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunicationStackParamList } from '../../types/navigation';
import { t } from '../../i18n';
import { useRTL } from '../../i18n/useRTL';

type Props = NativeStackScreenProps<CommunicationStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const paperTheme = useTheme();
  const { theme, setTheme, language, setLanguage } = useAppStore();
  const logout = useAuthStore((state) => state.logout);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometric');
  const { textAlign } = useRTL();

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
      const savedCredentials = await AsyncStorage.getItem('saved_credentials');
      if (!savedCredentials) {
        Alert.alert(
          t('settings.security'),
          t('auth.loginWithBiometric')
        );
        return;
      }
      await AsyncStorage.setItem('biometric_enabled', 'true');
      setBiometricEnabled(true);
    } else {
      Alert.alert(
        t('settings.biometricLogin'),
        t('settings.logoutConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
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
        <List.Subheader style={{ textAlign }}>{t('settings.appearance')}</List.Subheader>
        <List.Item
          title={t('settings.darkMode')}
          titleStyle={{ textAlign }}
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => <Switch value={isDarkMode} onValueChange={handleThemeToggle} />}
        />
        <Divider />
      </List.Section>

      <List.Section>
        <List.Subheader style={{ textAlign }}>{t('settings.language')}</List.Subheader>
        <List.Item
          title={t('settings.hebrew')}
          description="עברית (RTL)"
          titleStyle={{ textAlign }}
          left={(props) => <List.Icon {...props} icon="translate" />}
          right={() => <Switch value={isHebrew} onValueChange={handleLanguageToggle} />}
        />
        <Divider />
      </List.Section>

      <List.Section>
        <List.Subheader style={{ textAlign }}>{t('settings.security')}</List.Subheader>
        {biometricAvailable && (
          <>
            <List.Item
              title={`${biometricName} ${t('auth.login')}`}
              titleStyle={{ textAlign }}
              left={(props) => <List.Icon {...props} icon="fingerprint" />}
              right={() => <Switch value={biometricEnabled} onValueChange={handleBiometricToggle} />}
            />
            <Divider />
          </>
        )}
      </List.Section>

      <List.Section>
        <List.Subheader style={{ textAlign }}>{t('settings.notifications')}</List.Subheader>
        <List.Item
          title={t('settings.pushNotifications')}
          titleStyle={{ textAlign }}
          left={(props) => <List.Icon {...props} icon="bell" />}
          right={() => <Switch value={true} onValueChange={() => {}} />}
        />
        <List.Item
          title={t('settings.emailNotifications')}
          titleStyle={{ textAlign }}
          left={(props) => <List.Icon {...props} icon="email" />}
          right={() => <Switch value={true} onValueChange={() => {}} />}
        />
        <Divider />
      </List.Section>

      <List.Section>
        <List.Subheader style={{ textAlign }}>{t('settings.account')}</List.Subheader>
        <List.Item
          title={t('nav.profile')}
          titleStyle={{ textAlign }}
          left={(props) => <List.Icon {...props} icon="account" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Profile')}
        />
        <List.Item
          title={t('profile.changePassword')}
          titleStyle={{ textAlign }}
          left={(props) => <List.Icon {...props} icon="lock" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => {}}
        />
        <Divider />
      </List.Section>

      <List.Section>
        <List.Item
          title={t('auth.logout')}
          titleStyle={{ color: '#f44336', textAlign }}
          left={(props) => <List.Icon {...props} icon="logout" color="#f44336" />}
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
