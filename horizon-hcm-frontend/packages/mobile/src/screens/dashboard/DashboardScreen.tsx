import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { useAuthStore } from '@horizon-hcm/shared/src/store/auth.store';

export default function DashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Welcome, {user?.name}!</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Role: {user?.role.replace('_', ' ')}
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Quick Stats</Text>
          <Text variant="bodyMedium" style={styles.cardText}>
            This is a placeholder dashboard. More features coming soon!
          </Text>
        </Card.Content>
      </Card>

      <Button mode="outlined" onPress={logout} style={styles.logoutButton}>
        Logout
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#1976d2',
  },
  subtitle: {
    marginTop: 4,
    color: '#ffffff',
  },
  card: {
    margin: 16,
  },
  cardText: {
    marginTop: 8,
  },
  logoutButton: {
    margin: 16,
  },
});
