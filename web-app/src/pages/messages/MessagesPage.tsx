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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@horizon-hcm/shared/src/api/communication';
import { residentsApi } from '@horizon-hcm/shared/src/api/buildings';
import { queryKeys } from '../../lib/query-keys';
import { useAppStore } from '../../store/app.store';
import { useAuthStore } from '../../store/auth.store';

const MAX_MESSAGE_LENGTH = 2000;

export default function MessagesPage() {
  const selectedBuildingId = useAppStore((state: any) => state.selectedBuildingId);
  const currentUser = useAuthStore((state: any) => state.user);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messageText, setMessageText] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [selectedRecipientName, setSelectedRecipientName] = useState<string>('');
  const limit = 50;

  // Fetch building residents to pick a recipient
  const { data: residentsData } = useQuery({
    queryKey: ['residents', selectedBuildingId],
    queryFn: () => residentsApi.getByBuilding(selectedBuildingId!),
    enabled: !!selectedBuildingId,
    select: (res) => {
      const body = res.data as any;
      const list = Array.isArray(body) ? body : (body?.data ?? []);
      // Filter out current user by auth UUID
      return list.filter((r: any) => r.user_id !== currentUser?.id);
    },
  });

  const residents = residentsData || [];

  useEffect(() => {
    if (residents.length > 0 && !selectedRecipientId) {
      const first = residents[0] as any;
      // user_id is the auth UUID used in messages table
      setSelectedRecipientId(first.user_id || first.id);
      setSelectedRecipientName(first.full_name || first.name || 'Resident');
    }
  }, [residents, selectedRecipientId]);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.messages.list(selectedBuildingId || '', { page: 1, limit }),
    queryFn: () => messagesApi.getAll(selectedBuildingId || '', { page: 1, limit }),
    enabled: !!selectedBuildingId,
    refetchInterval: 5000, // poll every 5s since WebSocket may not be connected
    select: (response) => {
      const body = response.data as any;
      const all: any[] = Array.isArray(body) ? body : (body?.data ?? []);
      // Filter to conversation with selected recipient
      if (!selectedRecipientId) return all;
      return all.filter(
        (m: any) =>
          m.sender_id === selectedRecipientId ||
          m.recipient_id === selectedRecipientId
      );
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      messagesApi.send(selectedBuildingId!, {
        recipientId: selectedRecipientId!,
        content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
      setMessageText('');
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data]);

  const handleSend = () => {
    if (!messageText.trim() || messageText.length > MAX_MESSAGE_LENGTH || !selectedRecipientId) return;
    sendMessageMutation.mutate(messageText.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!selectedBuildingId) {
    return (
      <Box p={3}>
        <Alert severity="info">Please select a building to view messages.</Alert>
      </Box>
    );
  }

  const messages: any[] = data || [];

  return (
    <Box p={3} display="flex" gap={2} height="calc(100vh - 100px)">
      {/* Contacts sidebar */}
      <Paper sx={{ width: 240, flexShrink: 0, overflow: 'auto' }}>
        <Typography variant="subtitle2" sx={{ p: 2, pb: 1 }}>
          Residents
        </Typography>
        <Divider />
        {residents.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            No other residents
          </Typography>
        ) : (
          <List dense disablePadding>
            {residents.map((r: any) => {
              const rid = r.user_id || r.id;
              const name = r.full_name || r.name || 'Resident';
              return (
                <ListItem key={rid} disablePadding>
                  <ListItemButton
                    selected={selectedRecipientId === rid}
                    onClick={() => {
                      setSelectedRecipientId(rid);
                      setSelectedRecipientName(name);
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>{name.charAt(0).toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={name} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>

      {/* Chat area */}
      <Box flex={1} display="flex" flexDirection="column">
        <Typography variant="h5" mb={2}>
          {selectedRecipientName ? `Chat with ${selectedRecipientName}` : 'Messages'}
        </Typography>

        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages list */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {isLoading ? (
              <Box display="flex" justifyContent="center" pt={4}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">Failed to load messages.</Alert>
            ) : messages.length === 0 ? (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  No messages yet. Say hello!
                </Typography>
              </Box>
            ) : (
              messages.map((message: any) => {
                const isOwn =
                  message.sender_id === currentUser?.id ||
                  message.sender_id === currentUser?.profileId;
                const ts = message.createdAt || message.created_at;
                const timeStr = ts
                  ? (() => {
                      const d = new Date(ts);
                      const now = new Date();
                      return d.toDateString() === now.toDateString()
                        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
                            ' ' +
                            d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    })()
                  : '';

                return (
                  <Box
                    key={message.id}
                    display="flex"
                    flexDirection={isOwn ? 'row-reverse' : 'row'}
                    gap={1}
                    alignItems="flex-start"
                  >
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {(message.senderName || 'U').charAt(0).toUpperCase()}
                    </Avatar>
                    <Box maxWidth="70%">
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        mb={0.5}
                        flexDirection={isOwn ? 'row-reverse' : 'row'}
                      >
                        <Typography variant="caption" fontWeight="bold">
                          {isOwn ? 'You' : message.senderName || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {timeStr}
                        </Typography>
                      </Box>
                      <Paper
                        sx={{
                          p: 1.5,
                          bgcolor: isOwn ? 'primary.main' : 'background.default',
                          color: isOwn ? 'primary.contrastText' : 'text.primary',
                          borderRadius: 2,
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        <Typography variant="body2">{message.content}</Typography>
                      </Paper>
                    </Box>
                  </Box>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Divider />

          {/* Input */}
          <Box p={2} display="flex" gap={1} alignItems="flex-end">
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder={selectedRecipientId ? `Message ${selectedRecipientName}...` : 'Select a recipient first'}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendMessageMutation.isPending || !selectedRecipientId}
              helperText={`${messageText.length}/${MAX_MESSAGE_LENGTH}`}
              error={messageText.length > MAX_MESSAGE_LENGTH}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={
                !messageText.trim() ||
                messageText.length > MAX_MESSAGE_LENGTH ||
                sendMessageMutation.isPending ||
                !selectedRecipientId
              }
            >
              {sendMessageMutation.isPending ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
