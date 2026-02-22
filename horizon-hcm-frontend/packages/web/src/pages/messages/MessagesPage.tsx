import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@horizon-hcm/shared/src/api/communication';
import type { Message } from '@horizon-hcm/shared/src/types/communication';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store/app.store';
import { useWebSocketStore } from '../../store/websocket.store';

const MAX_MESSAGE_LENGTH = 2000;

export default function MessagesPage() {
  const selectedBuildingId = useAppStore((state: any) => state.selectedBuildingId);
  const { socket, connected } = useWebSocketStore();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messageText, setMessageText] = useState('');
  const [page, setPage] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const limit = 50;

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.messages.list(selectedBuildingId || '', { page, limit }),
    queryFn: () => messagesApi.getAll(selectedBuildingId || '', { page, limit }),
    enabled: !!selectedBuildingId,
    select: (response) => response.data,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: { recipientId: string; content: string }) =>
      messagesApi.send(selectedBuildingId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
      setMessageText('');
      scrollToBottom();
    },
  });

  // WebSocket listeners
  useEffect(() => {
    if (!socket || !connected) return;

    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
      scrollToBottom();
    };

    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      setIsTyping(data.isTyping);
    };

    socket.on('message:new', handleNewMessage);
    socket.on('user:typing', handleTyping);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('user:typing', handleTyping);
    };
  }, [socket, connected, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [data]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || messageText.length > MAX_MESSAGE_LENGTH) return;

    // For now, send to a default recipient (this should be selected from a list)
    const recipientId = 'default-recipient-id';

    sendMessageMutation.mutate({
      recipientId,
      content: messageText.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (socket && connected) {
      socket.emit('user:typing', { isTyping: true });

      // Clear typing indicator after 2 seconds
      setTimeout(() => {
        socket.emit('user:typing', { isTyping: false });
      }, 2000);
    }
  };

  if (!selectedBuildingId) {
    return (
      <Box p={3}>
        <Alert severity="info">Please select a building to view messages.</Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load messages. Please try again.</Alert>
      </Box>
    );
  }

  const messages = data?.data || [];

  return (
    <Box p={3} display="flex" flexDirection="column" height="calc(100vh - 100px)">
      <Typography variant="h4" mb={3}>
        Messages
      </Typography>

      {!connected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Not connected to real-time messaging. Messages may be delayed.
        </Alert>
      )}

      {/* Messages Container */}
      <Paper
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Messages List */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                No messages yet. Start a conversation!
              </Typography>
            </Box>
          ) : (
            messages.map((message: Message) => (
              <Box key={message.id} display="flex" gap={1} alignItems="flex-start">
                <Avatar sx={{ width: 32, height: 32 }}>
                  {message.senderName?.charAt(0) || 'U'}
                </Avatar>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="subtitle2">{message.senderName || 'Unknown'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(message.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Paper
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.default',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    <Typography variant="body2">{message.content}</Typography>
                  </Paper>
                </Box>
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>

        <Divider />

        {/* Typing Indicator */}
        {isTyping && (
          <Box px={2} py={1}>
            <Typography variant="caption" color="text.secondary">
              Someone is typing...
            </Typography>
          </Box>
        )}

        {/* Message Input */}
        <Box p={2} display="flex" gap={1} alignItems="flex-end">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            disabled={sendMessageMutation.isPending}
            helperText={`${messageText.length}/${MAX_MESSAGE_LENGTH}`}
            error={messageText.length > MAX_MESSAGE_LENGTH}
          />
          <IconButton color="primary" disabled>
            <AttachFileIcon />
          </IconButton>
          <IconButton color="primary" disabled>
            <EmojiIcon />
          </IconButton>
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={
              !messageText.trim() ||
              messageText.length > MAX_MESSAGE_LENGTH ||
              sendMessageMutation.isPending
            }
          >
            {sendMessageMutation.isPending ? <CircularProgress size={24} /> : <SendIcon />}
          </IconButton>
        </Box>
      </Paper>

      {/* Load More */}
      {messages.length >= limit && (
        <Box textAlign="center" mt={2}>
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer' }}
            onClick={() => setPage(page + 1)}
          >
            Load more messages
          </Typography>
        </Box>
      )}
    </Box>
  );
}
