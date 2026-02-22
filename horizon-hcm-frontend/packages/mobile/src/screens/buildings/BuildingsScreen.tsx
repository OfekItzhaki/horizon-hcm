import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Searchbar, FAB } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { buildingsApi } from '@horizon-hcm/shared/src/api/buildings';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BuildingsStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<BuildingsStackParamList, 'BuildingsList'>;

export default function BuildingsScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => buildingsApi.getAll(),
  });

  const buildings = data?.data || [];
  const filteredBuildings = buildings.filter((building) =>
    building.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search buildings"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredBuildings}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card
            style={[styles.card, item.id === selectedBuildingId && styles.selectedCard]}
            onPress={() => navigation.navigate('BuildingDetail', { building: item })}
          >
            <Card.Content>
              <Text variant="titleLarge">{item.name}</Text>
              <Text variant="bodyMedium" style={styles.address}>
                {typeof item.address === 'string' ? item.address : JSON.stringify(item.address)}
              </Text>
              <View style={styles.stats}>
                <Text variant="bodySmall">{item.apartmentCount || 0} Apartments</Text>
                <Text variant="bodySmall"> • </Text>
                <Text variant="bodySmall">{item.residentCount || 0} Residents</Text>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge">No buildings found</Text>
          </View>
        }
      />

      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('BuildingForm', {})} />
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
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  selectedCard: {
    borderColor: '#1976d2',
    borderWidth: 2,
  },
  address: {
    marginTop: 4,
    color: '#757575',
  },
  stats: {
    flexDirection: 'row',
    marginTop: 8,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1976d2',
  },
});
