import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Searchbar, SegmentedButtons } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { apartmentsApi } from '@horizon-hcm/shared/src/api/buildings';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BuildingsStackParamList } from '../../types/navigation';
import { StatusChip, EmptyState } from '../../components';
import { getApartmentStatusColor } from '../../utils';

type Props = NativeStackScreenProps<BuildingsStackParamList, 'ApartmentsList'>;

export default function ApartmentsScreen({ navigation: _navigation }: Props) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['apartments', selectedBuildingId],
    queryFn: () => apartmentsApi.getByBuilding(selectedBuildingId!),
    enabled: !!selectedBuildingId,
  });

  const apartments = data?.data || [];
  const filteredApartments = apartments.filter((apt) => {
    const matchesSearch = apt.unitNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || apt.occupancyStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search apartments"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <SegmentedButtons
        value={statusFilter}
        onValueChange={setStatusFilter}
        buttons={[
          { value: 'all', label: 'All' },
          { value: 'vacant', label: 'Vacant' },
          { value: 'owner_occupied', label: 'Owner' },
          { value: 'tenant_occupied', label: 'Tenant' },
        ]}
        style={styles.segmented}
      />

      <FlatList
        data={filteredApartments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleLarge">Unit {item.unitNumber}</Text>
                <StatusChip status={item.occupancyStatus} getColor={getApartmentStatusColor} />
              </View>
              <Text variant="bodyMedium" style={styles.floor}>
                Floor {item.floor}
              </Text>
              <Text variant="bodySmall" style={styles.size}>
                {item.size} sqm
              </Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<EmptyState message="No apartments found" icon="office-building" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  segmented: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  floor: {
    marginTop: 4,
    color: '#757575',
  },
  size: {
    marginTop: 4,
    color: '#757575',
  },
});
