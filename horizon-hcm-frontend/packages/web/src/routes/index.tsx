import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Lazy load components for code splitting
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));

// Loading fallback component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
);

// Wrapper for lazy loaded components
const LazyLoad = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
);

// Router configuration
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: (
      <LazyLoad>
        <LoginPage />
      </LazyLoad>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: (
          <LazyLoad>
            <DashboardPage />
          </LazyLoad>
        ),
      },
      {
        path: 'buildings',
        element: <Box p={3}>Buildings Page (Coming Soon)</Box>,
      },
      {
        path: 'residents',
        element: <Box p={3}>Residents Page (Coming Soon)</Box>,
      },
      {
        path: 'invoices',
        element: <Box p={3}>Invoices Page (Coming Soon)</Box>,
      },
      {
        path: 'payments',
        element: <Box p={3}>Payments Page (Coming Soon)</Box>,
      },
      {
        path: 'reports',
        element: <Box p={3}>Reports Page (Coming Soon)</Box>,
      },
      {
        path: 'announcements',
        element: <Box p={3}>Announcements Page (Coming Soon)</Box>,
      },
      {
        path: 'messages',
        element: <Box p={3}>Messages Page (Coming Soon)</Box>,
      },
      {
        path: 'polls',
        element: <Box p={3}>Polls Page (Coming Soon)</Box>,
      },
      {
        path: 'maintenance',
        element: <Box p={3}>Maintenance Page (Coming Soon)</Box>,
      },
      {
        path: 'meetings',
        element: <Box p={3}>Meetings Page (Coming Soon)</Box>,
      },
      {
        path: 'documents',
        element: <Box p={3}>Documents Page (Coming Soon)</Box>,
      },
      {
        path: 'settings',
        element: <Box p={3}>Settings Page (Coming Soon)</Box>,
      },
      {
        path: 'admin',
        element: <Box p={3}>Admin Page (Coming Soon)</Box>,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
