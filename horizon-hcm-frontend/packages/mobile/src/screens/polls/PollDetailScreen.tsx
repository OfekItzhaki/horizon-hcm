import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, RadioButton, ProgressBar } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pollsApi } from '@horizon-hcm/shared';
import { useAppStore } from '@horizon-hcm/shared';
import { LoadingSpinner, ErrorMessage } from '../../components';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CommunicationStackParamList } from '../../types/navigation';
import type { PollOption } from '@horizon-hcm/shared/src/types';

type Props = NativeStackScreenProps<CommunicationStackParamList, 'PollDetail'>;

export default function PollDetailScreen({ route }: Props) {
  const { pollId } = route.params;
  const { selectedBuildingId } = useAppStore();
  const queryClient = useQueryClient();
  const [selectedOption, setSelectedOption] = useState<string>('');

  const { data: poll, isLoading, error } = useQuery({
    queryKey: ['poll', pollId],
    queryFn: async () => {
      const response = await pollsApi.getById(selectedBuildingId!, pollId);
      return response.data;
    },
    enabled: !!selectedBuildingId,
  });

  const voteMutation = useMutation({
    mutationFn: (optionIds: string[]) => pollsApi.vote(selectedBuildingId!, pollId, { optionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poll', pollId] });
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    },
  });

  const handleVote = () => {
    if (selectedOption) {
      voteMutation.mutate([selectedOption]);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading poll..." />;
  }

  if (error || !poll) {
    return <ErrorMessage message="Failed to load poll" />;
  }

  const totalVotes = poll.totalVotes || 0;
  const hasVoted = poll.userVote !== null;
  const isActive = poll.status === 'active';
  const canVote = isActive && !hasVoted;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.question}>
            {poll.question}
          </Text>
          {poll.description && (
            <Text variant="bodyMedium" style={styles.description}>
              {poll.description}
            </Text>
          )}
          <View style={styles.meta}>
            <Text variant="bodySmall" style={styles.metaText}>
              Status: {poll.status}
            </Text>
            <Text variant="bodySmall" style={styles.metaText}>
              Total votes: {totalVotes}
            </Text>
            {poll.endsAt && (
              <Text variant="bodySmall" style={styles.metaText}>
                Ends: {new Date(poll.endsAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {canVote ? 'Cast Your Vote' : 'Results'}
          </Text>

          {canVote ? (
            <RadioButton.Group
              onValueChange={setSelectedOption}
              value={selectedOption}
            >
              {poll.options.map((option: PollOption) => (
                <View key={option.id} style={styles.option}>
                  <RadioButton.Item
                    label={option.text}
                    value={option.id}
                    style={styles.radioItem}
                  />
                </View>
              ))}
            </RadioButton.Group>
          ) : (
            poll.options.map((option: PollOption) => {
              const votes = option.votes || 0;
              const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
              const isUserVote = poll.userVote === option.id;

              return (
                <View key={option.id} style={styles.resultOption}>
                  <View style={styles.resultHeader}>
                    <Text variant="bodyMedium" style={styles.optionText}>
                      {option.text}
                      {isUserVote && ' ✓'}
                    </Text>
                    <Text variant="bodySmall" style={styles.percentage}>
                      {percentage.toFixed(1)}%
                    </Text>
                  </View>
                  <ProgressBar
                    progress={percentage / 100}
                    color="#2196f3"
                    style={styles.progressBar}
                  />
                  <Text variant="bodySmall" style={styles.voteCount}>
                    {votes} {votes === 1 ? 'vote' : 'votes'}
                  </Text>
                </View>
              );
            })
          )}

          {canVote && (
            <Button
              mode="contained"
              onPress={handleVote}
              disabled={!selectedOption || voteMutation.isPending}
              loading={voteMutation.isPending}
              style={styles.voteButton}
            >
              Submit Vote
            </Button>
          )}

          {hasVoted && !isActive && (
            <Text variant="bodySmall" style={styles.closedMessage}>
              This poll is closed. Thank you for voting!
            </Text>
          )}
        </Card.Content>
      </Card>
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
  question: {
    marginBottom: 8,
  },
  description: {
    color: '#666',
    marginBottom: 16,
  },
  meta: {
    gap: 4,
  },
  metaText: {
    color: '#999',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  option: {
    marginBottom: 8,
  },
  radioItem: {
    paddingLeft: 0,
  },
  resultOption: {
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  optionText: {
    flex: 1,
  },
  percentage: {
    fontWeight: 'bold',
    color: '#2196f3',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  voteCount: {
    color: '#999',
  },
  voteButton: {
    marginTop: 16,
  },
  closedMessage: {
    marginTop: 16,
    textAlign: 'center',
    color: '#999',
  },
});
