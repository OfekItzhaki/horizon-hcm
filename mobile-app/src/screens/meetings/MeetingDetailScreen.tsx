import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Chip, Divider } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi } from '@horizon-hcm/shared';
import { useAppStore } from '@horizon-hcm/shared';
import { LoadingSpinner, ErrorMessage, StatusChip } from '../../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CommunicationStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<CommunicationStackParamList, 'MeetingDetail'>;

export default function MeetingDetailScreen({ route }: Props) {
  const { meetingId } = route.params;
  const { selectedBuildingId } = useAppStore();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: async () => {
      const response = await meetingsApi.getById(selectedBuildingId!, meetingId);
      return response.data;
    },
    enabled: !!selectedBuildingId,
  });

  const rsvpMutation = useMutation({
    mutationFn: (response: 'attending' | 'not_attending' | 'maybe') =>
      meetingsApi.rsvp(selectedBuildingId!, meetingId, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      Alert.alert('Success', 'RSVP updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update RSVP');
    },
  });

  const handleRsvp = (response: 'attending' | 'not_attending' | 'maybe') => {
    rsvpMutation.mutate(response);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading meeting..." />;
  }

  if (error || !data) {
    return <ErrorMessage message="Failed to load meeting" />;
  }

  const meeting = data;

  const getMeetingStatusColor = (status: number) => {
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

  const canRsvp = meeting.status === 0; // 0 = scheduled

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              {meeting.title}
            </Text>
            <StatusChip
              status={getMeetingStatusText(meeting.status)}
              color={getMeetingStatusColor(meeting.status)}
            />
          </View>

          {meeting.description && (
            <Text variant="bodyMedium" style={styles.description}>
              {meeting.description}
            </Text>
          )}

          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              📅 Date & Time:
            </Text>
            <Text variant="bodyMedium">
              {new Date(meeting.scheduledAt).toLocaleString()}
            </Text>
          </View>

          {meeting.location && (
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                📍 Location:
              </Text>
              <Text variant="bodyMedium">{meeting.location}</Text>
            </View>
          )}

          {meeting.duration && (
            <View style={styles.infoRow}>
              <Text variant="bodyMedium" style={styles.label}>
                ⏱️ Duration:
              </Text>
              <Text variant="bodyMedium">{meeting.duration} minutes</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text variant="bodyMedium" style={styles.label}>
              👥 Attendees:
            </Text>
            <Text variant="bodyMedium">{meeting.attendeeCount || 0}</Text>
          </View>
        </Card.Content>
      </Card>

      {meeting.agenda && meeting.agenda.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Agenda
            </Text>
            {meeting.agenda && Array.isArray(meeting.agenda) && meeting.agenda.length > 0 && (
              meeting.agenda.map((item: string, index: number) => (
              <View key={index} style={styles.agendaItem}>
                <Text variant="bodyMedium">
                  {index + 1}. {item}
                </Text>
              </View>
            ))
            )}
          </Card.Content>
        </Card>
      )}

      {canRsvp && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Your RSVP
            </Text>
            {meeting.userRsvp && (
              <Chip mode="flat" style={styles.currentRsvp}>
                Current: {meeting.userRsvp}
              </Chip>
            )}
            <View style={styles.rsvpButtons}>
              <Button
                mode={meeting.userRsvp === 'attending' ? 'contained' : 'outlined'}
                onPress={() => handleRsvp('attending')}
                disabled={rsvpMutation.isPending}
                style={styles.rsvpButton}
              >
                Attending
              </Button>
              <Button
                mode={meeting.userRsvp === 'maybe' ? 'contained' : 'outlined'}
                onPress={() => handleRsvp('maybe')}
                disabled={rsvpMutation.isPending}
                style={styles.rsvpButton}
              >
                Maybe
              </Button>
              <Button
                mode={meeting.userRsvp === 'not_attending' ? 'contained' : 'outlined'}
                onPress={() => handleRsvp('not_attending')}
                disabled={rsvpMutation.isPending}
                style={styles.rsvpButton}
              >
                Not Attending
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {meeting.minutes && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Meeting Minutes
            </Text>
            <Text variant="bodyMedium">{meeting.minutes}</Text>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  description: {
    color: '#666',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 120,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  agendaItem: {
    marginBottom: 8,
  },
  currentRsvp: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    backgroundColor: '#e3f2fd',
  },
  rsvpButtons: {
    gap: 8,
  },
  rsvpButton: {
    marginBottom: 8,
  },
});
