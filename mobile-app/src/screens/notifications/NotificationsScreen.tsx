import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, IconButton, Badge } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@horizon-hcm/shared';
import { EmptyState, LoadingSpinner, ErrorMessage } from '../../components';

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mobile-notifications'],
    queryFn: async () => {
      const res = await notificationsApi.getAll({ limit: 50 });
      return res.data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mobile-notifications'] }),
  });

  const notifications: any[] = (data as any)?.data ?? (Array.isArray(data) ? data : []);
  const unreadCount = notifications.filter((n) => !n.read_at && !n.is_read).length;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handlePress = (notification: any) => {
    const isRead = notification.read_at || notification.is_read;
    if (!isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'announcement': return 'bullhorn';
      case 'invoice': return 'file-document';
      case 'maintenance': return 'wrench';
      case 'meeting': return 'calendar';
      case 'poll': return 'poll';
      default: return 'bell';
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading notifications..." />;
  if (error) return <ErrorMessage message="Failed to load notifications" />;

  return (
    <View style={styles.container}>
      {unreadCount > 0 && (
        <View style={styles.header}>
          <Text variant="titleMedium">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</Text>
        </View>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const isRead = item.read_at || item.is_read;
          return (
            <Card style={[styles.card, !isRead && styles.unreadCard]} onPress={() => handlePress(item)}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <IconButton icon={getIcon(item.type)} size={24} iconColor={!isRead ? '#1976d2' : '#757575'} />
                    {!isRead && <Badge style={styles.badge} size={8} />}
                  </View>
                  <View style={styles.content}>
                    <Text variant="titleMedium" style={[styles.title, !isRead && styles.unreadTitle]}>
                      {item.title}
                    </Text>
                    <Text variant="bodyMedium" style={styles.message} numberOfLines={2}>
                      {item.body || item.message}
                    </Text>
                    <Text variant="bodySmall" style={styles.date}>
                      {new Date(item.created_at || item.createdAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          );
        }}
        ListEmptyComponent={<EmptyState message="No notifications" icon="bell-outline" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  card: { margin: 8, marginHorizontal: 16 },
  unreadCard: { backgroundColor: '#e3f2fd' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  iconContainer: { position: 'relative', marginRight: 8 },
  badge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#1976d2' },
  content: { flex: 1 },
  title: { marginBottom: 4 },
  unreadTitle: { fontWeight: 'bold' },
  message: { color: '#666', marginBottom: 4 },
  date: { color: '#999' },
});
