import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, SegmentedButtons } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { announcementsApi } from '@horizon-hcm/shared/src/api/communication';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunicationStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<CommunicationStackParamList, 'AnnouncementsList'>;

export default function AnnouncementsScreen({ navigation }: Props) {
  const [priorityFilter, setPriorityFilter] = React.useState('all');
  const selectedBuildingId = useAppStore((state) => state.selectedBuildingId);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['announcements', selectedBuildingId, priorityFilter],
    queryFn: () =>
      announcementsApi.getAll(selectedBuildingId!, {
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
      }),
    enabled: !!selectedBuildingId,
  });

  const announcements = data?.data || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#f44336';
      case 'normal':
        return '#2196f3';
      case 'low':
        return '#757575';
      default:
        return '#757575';
    }
  };

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={priorityFilter}
        onValueChange={setPriorityFilter}
        buttons={[
          { value: 'all', label: 'All' },
          { value: 'urgent', label: 'Urgent' },
          { value: 'normal', label: 'Normal' },
          { value: 'low', label: 'Low' },
        ]}
        style={styles.segmented}
      />

      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('AnnouncementDetail', { announcement: item })}
          >
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleMedium" style={styles.title}>
                  {item.title}
                </Text>
                <Chip
                  mode="flat"
                  style={{ backgroundColor: getPriorityColor(item.priority) }}
                  textStyle={{ color: '#fff' }}
                >
                  {item.priority}
                </Chip>
              </View>
              <Text variant="bodyMedium" numberOfLines={2} style={styles.content}>
                {item.content}
              </Text>
              <Text variant="bodySmall" style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
              {item.requiresConfirmation && (
                <Chip mode="outlined" style={styles.confirmChip}>
                  Requires Confirmation
                </Chip>
              )}
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="bodyLarge">No announcements found</Text>
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
  content: {
    marginTop: 4,
    color: '#424242',
  },
  date: {
    marginTop: 8,
    color: '#757575',
  },
  confirmChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
});
