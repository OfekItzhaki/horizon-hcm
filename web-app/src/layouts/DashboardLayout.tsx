import { useState } from 'react';
import { Box, AppBar, Toolbar, IconButton, Drawer, useTheme, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { KeyboardShortcutsDialog } from '../components/KeyboardShortcutsDialog';
import { useAppStore } from '../store';
import { useGlobalKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useLogout } from '../hooks/useLogout';

const DRAWER_WIDTH = 260;

export function DashboardLayout() {
  const theme = useTheme();
  const navigate = useNavigate();
  const logout = useLogout();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const [helpOpen, setHelpOpen] = useState(false);

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Global keyboard shortcuts
  useGlobalKeyboardShortcuts(
    () => {}, // Ctrl+K - Search (handled in Header component)
    handleDrawerToggle, // Ctrl+B - Toggle sidebar
    () => navigate('/invoices'), // Ctrl+I - Create invoice
    () => navigate('/announcements'), // Ctrl+A - Create announcement
    logout, // Ctrl+L - Logout
    () => setHelpOpen(true) // Ctrl+/ - Help
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: 1,
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Header />
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={sidebarOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            top: isMobile ? 0 : 64,
            height: isMobile ? '100%' : 'calc(100% - 64px)',
          },
        }}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
      >
        <Sidebar onClose={isMobile ? handleDrawerToggle : undefined} />
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: !isMobile && sidebarOpen ? `${DRAWER_WIDTH}px` : 0,
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* @ts-expect-error - React Router types mismatch with React 18 */}
        <Outlet />
      </Box>

      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcutsDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </Box>
  );
}
