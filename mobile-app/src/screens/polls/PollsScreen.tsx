import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Chip, FAB } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { pollsApi } from '@horizon-hcm/shared';
import { useAppStore } from '@horizon-hcm/shared';
import { useAuthStore } from '@horizon-hcm/shared';
import { EmptyState, ErrorMessage, LoadingSpinner } from '../../components';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunicationStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<CommunicationStackParamList, 'PollsList'>;

export default function PollsScreen({ navigation }: Props) {
  const { selectedBuildingId } = useAppStore();
  const user = useAuthStore((state) => state.user);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['polls', selectedBuildingId],
    queryFn: () => pollsApi.getAll(selectedBuildingId!),
    enabled: !!selectedBuildingId,
  });

  const polls = data?.data?.data || [];
  const canCreate = user?.role === 'committee_member' || user?.role === 'admin';

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getPollStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'closed':
        return '#9e9e9e';
      case 'draft':
        return '#ff9800';
      default:
        return '#757575';
    }
  };

  if (!selectedBuildingId) {
    return <EmptyState message="Please select a building first" />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading polls..." />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load polls" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={polls}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('PollDetail', { pollId: item.id })}
          >
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleMedium" style={styles.title}>
                  {item.question}
                </Text>
                <Chip
                  mode="flat"
                  style={{ backgroundColor: getPollStatusColor(item.status) }}
                  textStyle={{ color: '#fff' }}
                >
                  {item.status}
                </Chip>
              </View>
              <Text variant="bodySmall" style={styles.subtitle}>
                {item.options.length} options • {item.totalVotes || 0} votes
              </Text>
              {item.endsAt && (
                <Text variant="bodySmall" style={styles.date}>
                  Ends: {new Date(item.endsAt).toLocaleDateString()}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<EmptyState message="No polls found" icon="poll" />}
      />
      {canCreate && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('PollForm', {})}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 8,
    marginHorizontal: 16,
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
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  date: {
    color: '#999',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
