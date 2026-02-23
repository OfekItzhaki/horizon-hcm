import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, IconButton, Card, Text, Avatar } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@horizon-hcm/shared/src/api/communication';
import { useAppStore } from '@horizon-hcm/shared/src/store/app.store';
import { useAuthStore } from '@horizon-hcm/shared/src/store/auth.store';
import { EmptyState, LoadingSpinner, ErrorMessage } from '../../components';
import { websocketService } from '../../utils/websocket';

export default function ChatScreen() {
  const { selectedBuildingId } = useAppStore();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['messages', selectedBuildingId],
    queryFn: () => messagesApi.getAll(selectedBuildingId!),
    enabled: !!selectedBuildingId,
    refetchInterval: 5000, // Poll every 5 seconds as fallback
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      messagesApi.send(selectedBuildingId!, {
        recipientId: 'building', // Send to building channel
        content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessage('');
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  // Listen for real-time messages
  useEffect(() => {
    const handleNewMessage = (newMessage: any) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    websocketService.on('message:new', handleNewMessage);

    return () => {
      websocketService.off('message:new', handleNewMessage);
    };
  }, [queryClient]);

  const messages = data?.data?.data || [];

  const handleSend = () => {
    if (message.trim().length === 0) return;
    if (message.length > 2000) {
      alert('Message is too long (max 2000 characters)');
      return;
    }
    sendMutation.mutate(message.trim());
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwnMessage = item.senderId === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isOwnMessage && (
          <Avatar.Text
            size={32}
            label={item.senderName?.charAt(0) || 'U'}
            style={styles.avatar}
          />
        )}
        <Card
          style={[styles.messageCard, isOwnMessage ? styles.ownMessage : styles.otherMessage]}
        >
          <Card.Content style={styles.messageContent}>
            {!isOwnMessage && (
              <Text variant="labelSmall" style={styles.senderName}>
                {item.senderName}
              </Text>
            )}
            <Text variant="bodyMedium" style={styles.messageText}>
              {item.content}
            </Text>
            <Text variant="labelSmall" style={styles.timestamp}>
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Card.Content>
        </Card>
        {isOwnMessage && (
          <Avatar.Text
            size={32}
            label={user?.name?.charAt(0) || 'M'}
            style={styles.avatar}
          />
        )}
      </View>
    );
  };

  if (!selectedBuildingId) {
    return <EmptyState message="Please select a building first" />;
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading messages..." />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load messages" />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <EmptyState message="No messages yet. Start the conversation!" icon="message" />
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={2000}
          style={styles.input}
          right={
            <TextInput.Affix
              text={`${message.length}/2000`}
              textStyle={styles.charCount}
            />
          }
        />
        <IconButton
          icon="send"
          mode="contained"
          size={24}
          onPress={handleSend}
          disabled={message.trim().length === 0 || sendMutation.isPending}
          loading={sendMutation.isPending}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messageList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    marginHorizontal: 8,
  },
  messageCard: {
    maxWidth: '70%',
  },
  ownMessage: {
    backgroundColor: '#1976d2',
  },
  otherMessage: {
    backgroundColor: '#fff',
  },
  messageContent: {
    padding: 8,
  },
  senderName: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#666',
  },
  messageText: {
    marginBottom: 4,
  },
  timestamp: {
    color: '#999',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: 8,
    maxHeight: 100,
  },
  charCount: {
    fontSize: 10,
    color: '#999',
  },
});
