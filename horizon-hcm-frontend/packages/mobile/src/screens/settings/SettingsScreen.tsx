import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { List, Switch, Divider } from 'react-native-paper';
import { useAppStore, useAuthStore } from '@horizon-hcm/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunicationStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<CommunicationStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { theme, setTheme, language, setLanguage } = useAppStore();
  const logout = useAuthStore((state) => state.logout);

  const isDarkMode = theme === 'dark';
  const isHebrew = language === 'he';

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
    <ScrollView style={styles.container}>
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
    backgroundColor: '#fff',
  },
});
