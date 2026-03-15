import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Image, Alert } from 'react-native';
import { Card, Title, Paragraph, Chip, List, Divider, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunicationStackParamList } from '../../types/navigation';
import { maintenanceApi } from '@horizon-hcm/shared/src/api/maintenance';
import { useAuthStore } from '@horizon-hcm/shared/src/store/auth.store';

type Props = NativeStackScreenProps<CommunicationStackParamList, 'MaintenanceDetail'>;

export default function MaintenanceDetailScreen({ route, navigation }: Props) {
  const { request } = route.params;
  const [cancelling, setCancelling] = useState(false);
  const user = useAuthStore((state) => state.user);

  const handleCancel = async () => {
    Alert.alert('Cancel Request', 'Are you sure you want to cancel this request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            const buildingId = (user as any)?.buildingId;
            if (!buildingId) return;
            await maintenanceApi.updateStatus(request.id, 'cancelled');
            navigation.goBack();
          } catch (error) {
            console.error('Error cancelling request:', error);
            Alert.alert('Error', 'Failed to cancel request. Please try again.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'in_progress':
        return '#2196f3';
      case 'pending':
        return '#ff9800';
      case 'cancelled':
        return '#9e9e9e';
      default:
        return '#757575';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#f44336';
      case 'high':
        return '#ff9800';
      case 'normal':
        return '#2196f3';
      case 'low':
        return '#9e9e9e';
      default:
        return '#757575';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title style={styles.title}>{request.title}</Title>
            <View style={styles.chips}>
              <Chip
                style={[styles.chip, { backgroundColor: getStatusColor(request.status) }]}
                textStyle={styles.chipText}
              >
                {request.status.replace('_', ' ').toUpperCase()}
              </Chip>
              <Chip
                style={[styles.chip, { backgroundColor: getPriorityColor(request.priority) }]}
                textStyle={styles.chipText}
              >
                {request.priority.toUpperCase()}
              </Chip>
            </View>
          </View>
          <Paragraph style={styles.trackingNumber}>#{request.trackingNumber}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Details</Title>
          <Divider style={styles.divider} />
          <List.Item
            title="Category"
            description={request.category}
            left={(props) => <List.Icon {...props} icon="tag" />}
          />
          <List.Item
            title="Submitted"
            description={new Date(request.createdAt).toLocaleDateString()}
            left={(props) => <List.Icon {...props} icon="calendar" />}
          />
          {request.resolvedAt && (
            <List.Item
              title="Resolved"
              description={new Date(request.resolvedAt).toLocaleDateString()}
              left={(props) => <List.Icon {...props} icon="calendar-check" />}
            />
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Description</Title>
          <Divider style={styles.divider} />
          <Paragraph style={styles.description}>{request.description}</Paragraph>
        </Card.Content>
      </Card>

      {request.photos && request.photos.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Photos</Title>
            <Divider style={styles.divider} />
            <View style={styles.photoGrid}>
              {request.photos.map((photo: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {request.status === 'pending' && (
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="outlined"
              icon="close"
              onPress={handleCancel}
              loading={cancelling}
              disabled={cancelling}
              style={styles.button}
            >
              Cancel Request
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    height: 28,
  },
  chipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  trackingNumber: {
    color: '#666',
    fontSize: 14,
  },
  divider: {
    marginVertical: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  button: {
    marginTop: 8,
  },
});
