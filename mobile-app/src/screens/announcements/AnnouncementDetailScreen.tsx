import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Title, Paragraph, Button, Chip } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommunicationStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<CommunicationStackParamList, 'AnnouncementDetail'>;

function AnnouncementDetailScreen({ route, navigation }: Props) {
  const { announcement } = route.params;

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

  const handleMarkAsRead = () => {
    // TODO: Call API to mark as read
    console.log('Mark as read');
    navigation.goBack();
  };

  const isRead = announcement.readBy && announcement.readBy.length > 0;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Chip
              style={[
                styles.priorityChip,
                { backgroundColor: getPriorityColor(announcement.priority) },
              ]}
              textStyle={styles.priorityText}
            >
              {announcement.priority.toUpperCase()}
            </Chip>
          </View>
          <Title style={styles.title}>{announcement.title}</Title>
          <Paragraph style={styles.meta}>
            By {announcement.createdBy} • {new Date(announcement.createdAt).toLocaleDateString()}
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Paragraph style={styles.content}>{announcement.content}</Paragraph>
        </Card.Content>
      </Card>

      {!isRead && (
        <Card style={styles.card}>
          <Card.Content>
            <Button mode="contained" icon="check" onPress={handleMarkAsRead} style={styles.button}>
              Mark as Read
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  priorityChip: {
    height: 28,
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
  },
  meta: {
    color: '#666',
    fontSize: 14,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  button: {
    marginTop: 8,
  },
});

export default AnnouncementDetailScreen;
