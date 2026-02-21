import { useState } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Divider,
  ListItemIcon,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAppStore, useNotificationStore } from '../store';
import { useLogout } from '../hooks/useLogout';

export function Header() {
  const navigate = useNavigate();
  const logout = useLogout();
  const user = useAuthStore((state) => state.user);
  const { theme, setTheme, selectedBuildingId, setSelectedBuilding } = useAppStore();
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleProfileClick = () => {
    handleUserMenuClose();
    navigate('/settings');
  };

  const handleSettingsClick = () => {
    handleUserMenuClose();
    navigate('/settings');
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
      {/* Building Selector - Placeholder for now */}
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Building</InputLabel>
        <Select
          value={selectedBuildingId || ''}
          label="Building"
          onChange={(e) => setSelectedBuilding(e.target.value)}
          disabled
        >
          <MenuItem value="">
            <em>Select Building</em>
          </MenuItem>
        </Select>
      </FormControl>

      <Box sx={{ flexGrow: 1 }} />

      {/* Theme Toggle */}
      <IconButton onClick={handleThemeToggle} color="inherit">
        {theme === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>

      {/* Notifications */}
      <IconButton color="inherit" onClick={handleNotificationOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* Notification Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, minWidth: 300 }}>
          <Typography variant="subtitle2" gutterBottom>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No new notifications
          </Typography>
        </Box>
      </Menu>

      {/* User Menu */}
      <IconButton onClick={handleUserMenuOpen} color="inherit">
        <Avatar sx={{ width: 32, height: 32 }}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Avatar>
      </IconButton>

      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2">{user?.name || 'User'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email || ''}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleSettingsClick}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}
