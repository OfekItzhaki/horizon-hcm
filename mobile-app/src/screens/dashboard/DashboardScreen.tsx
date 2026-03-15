import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, Menu } from 'react-native-paper';
import { useAuthStore } from '@horizon-hcm/shared/src/store/auth.store';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { useQuery } from '@tanstack/react-query';
import { buildingsApi, invoicesApi, maintenanceApi, meetingsApi, announcementsApi } from '@horizon-hcm/shared';

function DashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const { selectedBuildingId, setSelectedBuildingId } = useAppStore();
  const [buildingMenuVisible, setBuildingMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: buildingsData, refetch: refetchBuildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const res = await buildingsApi.getAll();
      const payload = res.data as any;
      return Array.isArray(payload) ? payload : (payload?.data ?? []);
    },
  });

  const { data: invoicesData, refetch: refetchInvoices } = useQuery({
    queryKey: ['dashboard-invoices', selectedBuildingId],
    queryFn: () => invoicesApi.getAll({ buildingId: selectedBuildingId, status: 'pending', limit: 1 }),
    enabled: !!selectedBuildingId,
  });

  const { data: maintenanceData, refetch: refetchMaintenance } = useQuery({
    queryKey: ['dashboard-maintenance', selectedBuildingId],
    queryFn: () => maintenanceApi.getAll(selectedBuildingId!, { status: 'open', limit: 1 }),
    enabled: !!selectedBuildingId,
  });

  const { data: meetingsData, refetch: refetchMeetings } = useQuery({
    queryKey: ['dashboard-meetings', selectedBuildingId],
    queryFn: () => meetingsApi.getAll(selectedBuildingId!, { status: 'scheduled', limit: 1 }),
    enabled: !!selectedBuildingId,
  });

  const { data: announcementsData, refetch: refetchAnnouncements } = useQuery({
    queryKey: ['dashboard-announcements', selectedBuildingId],
    queryFn: () => announcementsApi.getAll(selectedBuildingId!, { limit: 1 }),
    enabled: !!selectedBuildingId,
  });

  const buildings: any[] = buildingsData ?? [];
  const selectedBuilding = buildings.find((b: any) => b.id === selectedBuildingId);

  const pendingInvoices = (invoicesData?.data as any)?.total ?? (Array.isArray(invoicesData?.data) ? invoicesData.data.length : 0);
  const pendingMaintenance = (maintenanceData?.data as any)?.total ?? (Array.isArray(maintenanceData?.data) ? maintenanceData.data.length : 0);
  const upcomingMeetings = (meetingsData?.data as any)?.total ?? (Array.isArray(meetingsData?.data) ? meetingsData.data.length : 0);
  const unreadAnnouncements = (announcementsData?.data as any)?.total ?? (Array.isArray(announcementsData?.data) ? announcementsData.data.length : 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBuildings(), refetchInvoices(), refetchMaintenance(), refetchMeetings(), refetchAnnouncements()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerText}>
          Welcome, {user?.name}!
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Role: {user?.role?.replace('_', ' ')}
        </Text>
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
                  <Button mode="outlined" onPress={() => setBuildingMenuVisible(true)} icon="office-building">
                    {(selectedBuilding as any)?.name || (selectedBuilding as any)?.address_line || 'Select Building'}
                  </Button>
                }
              >
                {buildings.map((building: any) => (
                  <Menu.Item
                    key={building.id}
                    onPress={() => { setSelectedBuildingId(building.id); setBuildingMenuVisible(false); }}
                    title={building.name || building.address_line}
                  />
                ))}
              </Menu>
            </View>
          </Card.Content>
        </Card>
      )}

      {selectedBuildingId && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>Quick Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>{pendingInvoices}</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Pending Invoices</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>{pendingMaintenance}</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Maintenance</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>{upcomingMeetings}</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Meetings</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="headlineMedium" style={styles.statNumber}>{unreadAnnouncements}</Text>
                <Text variant="bodySmall" style={styles.statLabel}>Announcements</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 16, backgroundColor: '#1976d2' },
  headerText: { color: '#ffffff' },
  subtitle: { marginTop: 4, color: '#ffffff' },
  card: { margin: 16, marginBottom: 8 },
  buildingSelector: { gap: 8 },
  sectionTitle: { marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  statItem: { flex: 1, minWidth: '45%', alignItems: 'center', padding: 16, backgroundColor: '#e3f2fd', borderRadius: 8 },
  statNumber: { color: '#1976d2', fontWeight: 'bold' },
  statLabel: { marginTop: 4, color: '#666', textAlign: 'center' },
});

export default DashboardScreen;
