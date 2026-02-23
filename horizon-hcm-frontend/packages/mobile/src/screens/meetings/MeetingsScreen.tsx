import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Chip, FAB } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { meetingsApi } from '@horizon-hcm/shared';
import { useAppStore } from '@horizon-hcm/shared';
import { useAuthStore } from '@horizon-hcm/shared';
import { EmptyState, ErrorMessage, LoadingSpinner, StatusChip } from '../../components';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunicationStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<CommunicationStackParamList, 'MeetingsList'>;

export default function MeetingsScreen({ navigation }: Props) {
  const { selectedBuildingId } = useAppStore();
  const user = useAuthStore((state) => state.user);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['meetings', selectedBuildingId],
    queryFn: () => meetingsApi.getAll(selectedBuildingId!),
    enabled: !!selectedBuildingId,
  });

  const meetings = data?.data?.data || [];
  const canCreate = user?.role === 'committee_member' || user?.role === 'admin';

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getMeetingStatusColor = (status: number) => {
    // Meeting status is a number in the backend
    // 0 = scheduled, 1 = in_progress, 2 = completed, 3 = cancelled
    switch (status) {
      case 0:
        return '#2196f3';
      case 1:
        return '#ff9800';
      case 2:
        return '#4caf50';
      case 3:
        return '#9e9e9e';
      default:
        return '#757575';
    }
  };

  const getMeetingStatusText = (status: number) => {
    switch (status) {
      case 0:
        return 'scheduled';
      case 1:
        return 'in progress';
      case 2:
        return 'completed';
      case 3:
        return 'cancelled';
      default:
        return 'unknown';
    }
  };

  if (!selectedBuildingId) {
    return <EmptyState message="Please select a building first" />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading meetings..." />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load meetings" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={meetings}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('MeetingDetail', { meetingId: item.id })}
          >
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleMedium" style={styles.title}>
                  {item.title}
                </Text>
                <StatusChip
                  status={getMeetingStatusText(item.status)}
                  color={getMeetingStatusColor(item.status)}
                />
              </View>
              <Text variant="bodySmall" style={styles.date}>
                {new Date(item.scheduledAt).toLocaleString()}
              </Text>
              {item.location && (
                <Text variant="bodySmall" style={styles.location}>
                  📍 {item.location}
                </Text>
              )}
              <View style={styles.footer}>
                <Text variant="bodySmall" style={styles.attendees}>
                  {item.attendeeCount || 0} attendees
                </Text>
                {item.userRsvp && (
                  <Chip mode="flat" compact style={styles.rsvpChip}>
                    RSVP: {item.userRsvp}
                  </Chip>
                )}
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<EmptyState message="No meetings found" icon="calendar" />}
      />
      {canCreate && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('MeetingForm', {})}
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
  date: {
    color: '#666',
    marginTop: 4,
  },
  location: {
    color: '#666',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  attendees: {
    color: '#999',
  },
  rsvpChip: {
    backgroundColor: '#e3f2fd',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
