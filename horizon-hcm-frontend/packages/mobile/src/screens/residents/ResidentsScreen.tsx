import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Searchbar, Avatar } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { residentsApi } from '@horizon-hcm/shared/src/api/buildings';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BuildingsStackParamList } from '../../types/navigation';
import { StatusChip, EmptyState } from '../../components';
import { getResidentRoleColor } from '../../utils';

type Props = NativeStackScreenProps<BuildingsStackParamList, 'ResidentsList'>;

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function ResidentsScreen({ navigation: _navigation }: Props) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['residents', selectedBuildingId],
    queryFn: () => residentsApi.getByBuilding(selectedBuildingId!),
    enabled: !!selectedBuildingId,
  });

  const residents = data?.data || [];
  const filteredResidents = residents.filter(
    (resident) =>
      resident.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resident.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search residents"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredResidents}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.row}>
                <Avatar.Text size={48} label={getInitials(item.name)} />
                <View style={styles.info}>
                  <Text variant="titleMedium">{item.name}</Text>
                  <Text variant="bodySmall" style={styles.email}>
                    {item.email}
                  </Text>
                  <View style={styles.chips}>
                    <StatusChip status={item.role} getColor={getResidentRoleColor} />
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<EmptyState message="No residents found" icon="account-group" />}
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
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  email: {
    marginTop: 4,
    color: '#757575',
  },
  chips: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
