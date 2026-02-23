import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { paymentsApi } from '@horizon-hcm/shared/src/api/financial';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FinanceStackParamList } from '../../types/navigation';
import { StatusChip, EmptyState } from '../../components';
import { getPaymentMethodColor } from '../../utils';

type Props = NativeStackScreenProps<FinanceStackParamList, 'PaymentsList'>;

export default function PaymentsScreen({ navigation: _navigation }: Props) {
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payments', selectedBuildingId],
    queryFn: () => paymentsApi.getAll({ buildingId: selectedBuildingId }),
    enabled: !!selectedBuildingId,
  });

  const payments = data?.data || [];

  return (
    <View style={styles.container}>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleMedium">Payment #{item.transactionId}</Text>
                <StatusChip status={item.method} color={getPaymentMethodColor(item.method)} />
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
        ListEmptyComponent={<EmptyState message="No payments found" icon="credit-card" />}
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
});
