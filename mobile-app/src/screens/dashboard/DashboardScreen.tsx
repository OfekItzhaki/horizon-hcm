import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Menu } from 'react-native-paper';
import { useAuthStore } from '@horizon-hcm/shared/src/store/auth.store';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { useQuery } from '@tanstack/react-query';
import { buildingsApi } from '@horizon-hcm/shared/src/api/buildings';

function DashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const { selectedBuildingId, setSelectedBuildingId } = useAppStore();
  const [buildingMenuVisible, setBuildingMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: buildingsData, refetch: refetchBuildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => buildingsApi.getAll(),
  });

  // Fetch dashboard stats
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats', selectedBuildingId],
    queryFn: async () => {
      if (!selectedBuildingId) return null;
      // Mock stats - replace with actual API call
      return {
        pendingInvoices: 3,
        pendingMaintenance: 5,
        upcomingMeetings: 2,
        unreadAnnouncements: 4,
      };
    },
    enabled: !!selectedBuildingId,
  });

  const buildings = buildingsData?.data || [];
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);
  const stats = statsData || {
    pendingInvoices: 0,
    pendingMaintenance: 0,
    upcomingMeetings: 0,
    unreadAnnouncements: 0,
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBuildings(), refetchStats()]);
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

      {selectedBuildingId && (
        <>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Quick Stats
              </Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium" style={styles.statNumber}>
                    {stats.pendingInvoices}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Pending Invoices
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium" style={styles.statNumber}>
                    {stats.pendingMaintenance}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Maintenance
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium" style={styles.statNumber}>
                    {stats.upcomingMeetings}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Meetings
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text variant="headlineMedium" style={styles.statNumber}>
                    {stats.unreadAnnouncements}
                  </Text>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Announcements
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Quick Actions
              </Text>
              <View style={styles.actionsGrid}>
                <Button
                  mode="contained"
                  icon="cash"
                  style={styles.actionButton}
                  onPress={() => {}}
                >
                  Pay Invoice
                </Button>
                <Button
                  mode="contained"
                  icon="wrench"
                  style={styles.actionButton}
                  onPress={() => {}}
                >
                  New Request
                </Button>
                <Button
                  mode="contained"
                  icon="bullhorn"
                  style={styles.actionButton}
                  onPress={() => {}}
                >
                  Announcements
                </Button>
                <Button
                  mode="contained"
                  icon="file-document"
                  style={styles.actionButton}
                  onPress={() => {}}
                >
                  Documents
                </Button>
              </View>
            </Card.Content>
          </Card>
        </>
      )}

      {!selectedBuildingId && buildings.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Please select a building to continue</Text>
          </Card.Content>
        </Card>
      )}
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
  sectionTitle: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  statNumber: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  statLabel: {
    marginTop: 4,
    color: '#666',
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
});

export default DashboardScreen;
