import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, IconButton, Badge } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { EmptyState, LoadingSpinner, ErrorMessage } from '../../components';
import { websocketService } from '../../utils/websocket';

export default function NotificationsScreen() {
  const { selectedBuildingId } = useAppStore();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Listen for real-time notifications
  useEffect(() => {
    const handleNewNotification = (notification: any) => {
      // Invalidate notifications query to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    websocketService.on('notification:new', handleNewNotification);

    return () => {
      websocketService.off('notification:new', handleNewNotification);
    };
  }, [queryClient]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', selectedBuildingId],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return {
        data: [
          {
            id: '1',
            type: 'announcement',
            title: 'New Announcement',
            message: 'Building maintenance scheduled for next week',
            read: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            type: 'invoice',
            title: 'Invoice Due',
            message: 'Your monthly invoice is due in 3 days',
            read: false,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: '3',
            type: 'maintenance',
            title: 'Maintenance Update',
            message: 'Your maintenance request has been completed',
            read: true,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          },
        ],
      };
    },
    enabled: !!selectedBuildingId,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      // TODO: Call API to mark notification as read
      console.log('Mark as read:', notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleNotificationPress = (notification: any) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    // TODO: Navigate to related screen based on notification type
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'bullhorn';
      case 'invoice':
        return 'file-document';
      case 'maintenance':
        return 'wrench';
      case 'meeting':
        return 'calendar';
      case 'poll':
        return 'poll';
      default:
        return 'bell';
    }
  };

  if (!selectedBuildingId) {
    return <EmptyState message="Please select a building first" />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading notifications..." />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load notifications" />;
  }

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.header}>
          <Text variant="titleMedium">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <Card
            style={[styles.card, !item.read && styles.unreadCard]}
            onPress={() => handleNotificationPress(item)}
          >
            <Card.Content>
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <IconButton
                    icon={getNotificationIcon(item.type)}
                    size={24}
                    iconColor={!item.read ? '#1976d2' : '#757575'}
                  />
                  {!item.read && <Badge style={styles.badge} size={8} />}
                </View>
                <View style={styles.content}>
                  <Text
                    variant="titleMedium"
                    style={[styles.title, !item.read && styles.unreadTitle]}
                  >
                    {item.title}
                  </Text>
                  <Text variant="bodyMedium" style={styles.message} numberOfLines={2}>
                    {item.message}
                  </Text>
                  <Text variant="bodySmall" style={styles.date}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState message="No notifications" icon="bell-outline" />
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
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  card: {
    margin: 8,
    marginHorizontal: 16,
  },
  unreadCard: {
    backgroundColor: '#e3f2fd',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 8,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#1976d2',
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  message: {
    color: '#666',
    marginBottom: 4,
  },
  date: {
    color: '#999',
  },
});
