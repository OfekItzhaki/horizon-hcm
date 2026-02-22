import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { paymentsApi } from '@horizon-hcm/shared/src/api/financial';
import type { MainNavigationProp } from '../../types/navigation';

interface PaymentsScreenProps {
  navigation: MainNavigationProp;
}

export default function PaymentsScreen({ navigation }: PaymentsScreenProps) {
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payments', selectedBuildingId],
    queryFn: () => paymentsApi.getAll(selectedBuildingId!),
    enabled: !!selectedBuildingId,
  });

  const payments = data?.data || [];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'credit_card':
        return '#2196f3';
      case 'bank_transfer':
        return '#4caf50';
      case 'cash':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('PaymentDetail', { paymentId: item.id })}
          >
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleMedium">Payment #{item.transactionId}</Text>
                <Chip
                  mode="flat"
                  style={{ backgroundColor: getMethodColor(item.method) }}
                  textStyle={{ color: '#fff' }}
                >
                  {item.method.replace('_', ' ')}
                </Chip>
              </View>
              <Text variant="headlineSmall" style={styles.amount}>
                ${item.amount.toFixed(2)}
              </Text>
              <Text variant="bodySmall" style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge">No payments found</Text>
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
  card: {
    margin: 16,
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
    color: '#4caf50',
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
