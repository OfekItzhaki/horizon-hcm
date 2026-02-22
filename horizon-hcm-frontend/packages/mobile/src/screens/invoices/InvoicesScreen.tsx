import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, Searchbar, SegmentedButtons } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { invoicesApi } from '@horizon-hcm/shared/src/api/financial';
import type { MainNavigationProp } from '../../types/navigation';

interface InvoicesScreenProps {
  navigation: MainNavigationProp;
}

export default function InvoicesScreen({ navigation }: InvoicesScreenProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['invoices', selectedBuildingId, statusFilter],
    queryFn: () =>
      invoicesApi.getAll(selectedBuildingId!, {
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
    enabled: !!selectedBuildingId,
  });

  const invoices = data?.data || [];
  const filteredInvoices = invoices.filter((invoice) =>
    invoice.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      case 'overdue':
        return '#f44336';
      case 'cancelled':
        return '#757575';
      default:
        return '#757575';
    }
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search invoices"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <SegmentedButtons
        value={statusFilter}
        onValueChange={setStatusFilter}
        buttons={[
          { value: 'all', label: 'All' },
          { value: 'pending', label: 'Pending' },
          { value: 'paid', label: 'Paid' },
          { value: 'overdue', label: 'Overdue' },
        ]}
        style={styles.segmented}
      />

      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
          >
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleMedium">{item.description}</Text>
                <Chip
                  mode="flat"
                  style={{ backgroundColor: getStatusColor(item.status) }}
                  textStyle={{ color: '#fff' }}
                >
                  {item.status}
                </Chip>
              </View>
              <Text variant="headlineSmall" style={styles.amount}>
                ${item.amount.toFixed(2)}
              </Text>
              <Text variant="bodySmall" style={styles.date}>
                Due: {new Date(item.dueDate).toLocaleDateString()}
              </Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge">No invoices found</Text>
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
  amount: {
    marginTop: 8,
    color: '#1976d2',
  },
  date: {
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
