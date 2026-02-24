import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Avatar, List, Divider, Button } from 'react-native-paper';
import { useAuthStore } from '@horizon-hcm/shared/src/store/auth.store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunicationStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<CommunicationStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text size={80} label={getInitials(user.name)} />
        <Text variant="headlineSmall" style={styles.name}>
          {user.name}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {user.email}
        </Text>
      </View>

      <Divider style={styles.divider} />

      <List.Section>
        <List.Subheader>Account Information</List.Subheader>
        <List.Item
          title="Phone"
          description={user.phone || 'Not provided'}
          left={(props) => <List.Icon {...props} icon="phone" />}
        />
        <List.Item
          title="Role"
          description={user.role.replace('_', ' ')}
          left={(props) => <List.Icon {...props} icon="account-badge" />}
        />
      </List.Section>

      <Divider style={styles.divider} />

      <View style={styles.actions}>
        <Button
          mode="outlined"
          style={styles.button}
          icon="pencil"
          onPress={() => navigation.navigate('ProfileEdit')}
        >
          Edit Profile
        </Button>
        <Button
          mode="outlined"
          style={styles.button}
          icon="lock-reset"
          onPress={() => navigation.navigate('ChangePassword')}
        >
          Change Password
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
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  name: {
    marginTop: 16,
  },
  email: {
    marginTop: 4,
    color: '#757575',
  },
  divider: {
    marginVertical: 8,
  },
  actions: {
    padding: 16,
  },
  button: {
    marginBottom: 12,
  },
});
