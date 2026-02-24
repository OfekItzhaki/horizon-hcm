import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import MessageIcon from '@mui/icons-material/Message';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import BuildIcon from '@mui/icons-material/Build';
import EventIcon from '@mui/icons-material/Event';
import PollIcon from '@mui/icons-material/Poll';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@horizon-hcm/shared';

interface NotificationPanelProps {
  onClose: () => void;
}

const notificationIcons: Record<string, React.ReactNode> = {
  announcement: <AnnouncementIcon fontSize="small" />,
  message: <MessageIcon fontSize="small" />,
  invoice: <ReceiptIcon fontSize="small" />,
  payment: <PaymentIcon fontSize="small" />,
  maintenance: <BuildIcon fontSize="small" />,
  meeting: <EventIcon fontSize="small" />,
  poll: <PollIcon fontSize="small" />,
  system: <InfoIcon fontSize="small" />,
};

const notificationRoutes: Record<string, (id: string) => string> = {
  announcement: (_id) => `/announcements`,
  message: (_id) => `/messages`,
  invoice: (id) => `/invoices/${id}`,
  payment: (_id) => `/payments`,
  maintenance: (id) => `/maintenance/${id}`,
  meeting: (id) => `/meetings/${id}`,
  poll: (id) => `/polls/${id}`,
};

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications({ limit: 10 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }

    // Navigate to related content
    if (notification.relatedEntityType && notification.relatedEntityId) {
      const routeFn = notificationRoutes[notification.relatedEntityType];
      if (routeFn) {
        navigate(routeFn(notification.relatedEntityId));
        onClose();
      }
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <Box sx={{ width: 400, maxHeight: 600, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6">Notifications</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Actions */}
      {data && data.unreadCount > 0 && (
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Button
            size="small"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
            fullWidth
          >
            Mark all as read
          </Button>
        </Box>
      )}

      {/* Notifications List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress size={32} />
          </Box>
        ) : !data || data.data.length === 0 ? (
          <Box p={4} textAlign="center">
            <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {data.data.map((notification, index) => (
              <Box key={notification.id}>
                {index > 0 && <Divider />}
                <ListItem
                  disablePadding
                  sx={{
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  }}
                >
                  <ListItemButton onClick={() => handleNotificationClick(notification)}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {notificationIcons[notification.type] || <InfoIcon fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontWeight={notification.read ? 400 : 600}>
                            {notification.title}
                          </Typography>
                          {!notification.read && (
                            <Chip label="New" size="small" color="primary" sx={{ height: 20 }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </Typography>
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Box>

      {/* Footer */}
      {data && data.total > 10 && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
          <Button
            size="small"
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
          >
            View all notifications ({data.total})
          </Button>
        </Box>
      )}
    </Box>
  );
}
