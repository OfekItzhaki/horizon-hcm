import { useMemo } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import ChatIcon from '@mui/icons-material/Chat';
import PollIcon from '@mui/icons-material/Poll';
import BuildIcon from '@mui/icons-material/Build';
import EventIcon from '@mui/icons-material/Event';
import FolderIcon from '@mui/icons-material/Folder';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuthStore } from '../store';
import { USER_ROLES } from '@horizon-hcm/shared';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: <DashboardIcon />,
        roles: [
          USER_ROLES.SYSTEM_ADMIN,
          USER_ROLES.COMMITTEE_MEMBER,
          USER_ROLES.OWNER,
          USER_ROLES.TENANT,
        ],
      },
      {
        label: 'Buildings',
        path: '/buildings',
        icon: <ApartmentIcon />,
        roles: [USER_ROLES.SYSTEM_ADMIN, USER_ROLES.COMMITTEE_MEMBER],
      },
      {
        label: 'Apartments',
        path: '/apartments',
        icon: <ApartmentIcon />,
        roles: [USER_ROLES.SYSTEM_ADMIN, USER_ROLES.COMMITTEE_MEMBER],
      },
      {
        label: 'Residents',
        path: '/residents',
        icon: <PeopleIcon />,
        roles: [USER_ROLES.SYSTEM_ADMIN, USER_ROLES.COMMITTEE_MEMBER],
      },
      {
        label: 'Invoices',
        path: '/invoices',
        icon: <ReceiptIcon />,
        roles: [
          USER_ROLES.SYSTEM_ADMIN,
          USER_ROLES.COMMITTEE_MEMBER,
          USER_ROLES.OWNER,
          USER_ROLES.TENANT,
        ],
      },
      {
        label: 'Payments',
        path: '/payments',
        icon: <PaymentIcon />,
        roles: [
          USER_ROLES.SYSTEM_ADMIN,
          USER_ROLES.COMMITTEE_MEMBER,
          USER_ROLES.OWNER,
          USER_ROLES.TENANT,
        ],
      },
      {
        label: 'Reports',
        path: '/reports',
        icon: <AssessmentIcon />,
        roles: [USER_ROLES.SYSTEM_ADMIN, USER_ROLES.COMMITTEE_MEMBER, USER_ROLES.OWNER],
      },
      {
        label: 'Announcements',
        path: '/announcements',
        icon: <AnnouncementIcon />,
        roles: [
          USER_ROLES.SYSTEM_ADMIN,
          USER_ROLES.COMMITTEE_MEMBER,
          USER_ROLES.OWNER,
          USER_ROLES.TENANT,
        ],
      },
      {
        label: 'Messages',
        path: '/messages',
        icon: <ChatIcon />,
        roles: [
          USER_ROLES.SYSTEM_ADMIN,
          USER_ROLES.COMMITTEE_MEMBER,
          USER_ROLES.OWNER,
          USER_ROLES.TENANT,
        ],
      },
      {
        label: 'Polls',
        path: '/polls',
        icon: <PollIcon />,
        roles: [USER_ROLES.SYSTEM_ADMIN, USER_ROLES.COMMITTEE_MEMBER, USER_ROLES.OWNER],
      },
      {
        label: 'Maintenance',
        path: '/maintenance',
        icon: <BuildIcon />,
        roles: [
          USER_ROLES.SYSTEM_ADMIN,
          USER_ROLES.COMMITTEE_MEMBER,
          USER_ROLES.OWNER,
          USER_ROLES.TENANT,
        ],
      },
      {
        label: 'Meetings',
        path: '/meetings',
        icon: <EventIcon />,
        roles: [USER_ROLES.SYSTEM_ADMIN, USER_ROLES.COMMITTEE_MEMBER, USER_ROLES.OWNER],
      },
      {
        label: 'Documents',
        path: '/documents',
        icon: <FolderIcon />,
        roles: [
          USER_ROLES.SYSTEM_ADMIN,
          USER_ROLES.COMMITTEE_MEMBER,
          USER_ROLES.OWNER,
          USER_ROLES.TENANT,
        ],
      },
      {
        label: 'Settings',
        path: '/settings',
        icon: <SettingsIcon />,
        roles: [
          USER_ROLES.SYSTEM_ADMIN,
          USER_ROLES.COMMITTEE_MEMBER,
          USER_ROLES.OWNER,
          USER_ROLES.TENANT,
        ],
      },
      {
        label: 'Admin',
        path: '/admin',
        icon: <AdminPanelSettingsIcon />,
        roles: [USER_ROLES.SYSTEM_ADMIN],
      },
    ],
    []
  );

  const filteredMenuItems = useMemo(() => {
    if (!user?.role) return [];
    return menuItems.filter((item) => item.roles.includes(user.role));
  }, [menuItems, user?.role]);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          Horizon HCM
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Building Management
        </Typography>
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, py: 1 }}>
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={isActive}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'inherit' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />

      {/* User Info */}
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" noWrap>
          {user?.name || 'User'}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {user?.role?.replace('_', ' ').toUpperCase() || 'Role'}
        </Typography>
      </Box>
    </Box>
  );
}
