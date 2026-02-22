import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, Searchbar, SegmentedButtons } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { apartmentsApi } from '@horizon-hcm/shared/src/api/buildings';
import type { MainNavigationProp } from '../../types/navigation';

interface ApartmentsScreenProps {
  navigation: MainNavigationProp;
}

export default function ApartmentsScreen({ navigation }: ApartmentsScreenProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['apartments', selectedBuildingId, statusFilter],
    queryFn: () =>
      apartmentsApi.getAll(selectedBuildingId!, {
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    enabled: !!selectedBuildingId,
  });

  const apartments = data?.data || [];
  const filteredApartments = apartments.filter((apt) =>
    apt.unitNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return '#4caf50';
      case 'vacant':
        return '#ff9800';
      case 'maintenance':
        return '#f44336';
      default:
        return '#757575';
    }
  };

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
          { value: 'occupied', label: 'Occupied' },
          { value: 'vacant', label: 'Vacant' },
        ]}
        style={styles.segmented}
      />

      <FlatList
        data={filteredApartments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('ApartmentDetail', { apartmentId: item.id })}
          >
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleLarge">Unit {item.unitNumber}</Text>
                <Chip
                  mode="flat"
                  style={{ backgroundColor: getStatusColor(item.status) }}
                  textStyle={{ color: '#fff' }}
                >
                  {item.status}
                </Chip>
              </View>
              <Text variant="bodyMedium" style={styles.floor}>
                Floor {item.floor}
              </Text>
              <Text variant="bodySmall" style={styles.size}>
                {item.size} sqm • {item.bedrooms} bed • {item.bathrooms} bath
              </Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge">No apartments found</Text>
          </View>
        }
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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
});
