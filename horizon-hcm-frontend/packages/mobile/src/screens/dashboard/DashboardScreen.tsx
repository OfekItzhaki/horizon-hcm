import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Menu } from 'react-native-paper';
import { useAuthStore } from '@horizon-hcm/shared/src/store/auth.store';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { useQuery } from '@tanstack/react-query';
import { buildingsApi } from '@horizon-hcm/shared/src/api/buildings';

export default function DashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { selectedBuildingId, setSelectedBuildingId } = useAppStore();
  const [buildingMenuVisible, setBuildingMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: buildingsData, refetch: refetchBuildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => buildingsApi.getAll(),
  });

  const buildings = buildingsData?.data || [];
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchBuildings();
    setRefreshing(false);
  };

  const handleBuildingSelect = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setBuildingMenuVisible(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text variant="headlineMedium" style={styles.headerText}>
            Welcome, {user?.name}!
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Role: {user?.role.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {buildings.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.buildingSelector}>
              <Text variant="titleMedium">Current Building</Text>
              <Menu
                visible={buildingMenuVisible}
                onDismiss={() => setBuildingMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setBuildingMenuVisible(true)}
                    icon="office-building"
                  >
                    {selectedBuilding?.name || 'Select Building'}
                  </Button>
                }
              >
                {buildings.map((building) => (
                  <Menu.Item
                    key={building.id}
                    onPress={() => handleBuildingSelect(building.id)}
                    title={building.name}
                  />
                ))}
              </Menu>
            </View>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Quick Stats</Text>
          <Text variant="bodyMedium" style={styles.cardText}>
            {selectedBuilding
              ? `Managing ${selectedBuilding.name}`
              : 'Select a building to view stats'}
          </Text>
        </Card.Content>
      </Card>

      {user?.role === 'committee_member' && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Committee Dashboard</Text>
            <Text variant="bodySmall" style={styles.cardText}>
              • Pending maintenance requests
            </Text>
            <Text variant="bodySmall" style={styles.cardText}>
              • Upcoming meetings
            </Text>
            <Text variant="bodySmall" style={styles.cardText}>
              • Recent announcements
            </Text>
          </Card.Content>
        </Card>
      )}

      {(user?.role === 'owner' || user?.role === 'tenant') && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Resident Dashboard</Text>
            <Text variant="bodySmall" style={styles.cardText}>
              • Payment status
            </Text>
            <Text variant="bodySmall" style={styles.cardText}>
              • Announcements
            </Text>
            <Text variant="bodySmall" style={styles.cardText}>
              • Maintenance requests
            </Text>
          </Card.Content>
        </Card>
      )}

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
  headerText: {
    color: '#ffffff',
  },
  subtitle: {
    marginTop: 4,
    color: '#ffffff',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  buildingSelector: {
    gap: 8,
  },
  cardText: {
    marginTop: 8,
  },
  logoutButton: {
    margin: 16,
  },
});
