import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, FAB, SegmentedButtons } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { maintenanceApi } from '@horizon-hcm/shared/src/api/maintenance';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunicationStackParamList } from '../../types/navigation';
import { EmptyState } from '../../components';
import { getMaintenanceStatusColor, getPriorityColor } from '../../utils';

type Props = NativeStackScreenProps<CommunicationStackParamList, 'MaintenanceList'>;

export default function MaintenanceScreen({ navigation }: Props) {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['maintenance', selectedBuildingId, statusFilter],
    queryFn: () =>
      maintenanceApi.getAll(selectedBuildingId!, {
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    enabled: !!selectedBuildingId,
  });

  const requests = data?.data || [];

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={statusFilter}
        onValueChange={setStatusFilter}
        buttons={[
          { value: 'all', label: 'All' },
          { value: 'pending', label: 'Pending' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
        ]}
        style={styles.segmented}
      />

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('MaintenanceDetail', { request: item })}
          >
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleMedium" style={styles.title}>
                  {item.title}
                </Text>
                <Chip
                  mode="flat"
                  style={{ backgroundColor: getMaintenanceStatusColor(item.status) }}
                  textStyle={{ color: '#fff' }}
                >
                  {item.status.replace('_', ' ')}
                </Chip>
              </View>
              <Text variant="bodyMedium" numberOfLines={2} style={styles.description}>
                {item.description}
              </Text>
              <View style={styles.footer}>
                <Chip
                  mode="outlined"
                  style={{ borderColor: getPriorityColor(item.priority) }}
                  textStyle={{ color: getPriorityColor(item.priority) }}
                >
                  {item.priority}
                </Chip>
                <Text variant="bodySmall" style={styles.tracking}>
                  #{item.trackingNumber}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<EmptyState message="No maintenance requests found" />}
      />

      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('MaintenanceForm')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  segmented: {
    margin: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  description: {
    marginTop: 4,
    color: '#424242',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  tracking: {
    color: '#757575',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1976d2',
  },
});
