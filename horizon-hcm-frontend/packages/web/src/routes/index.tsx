import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';

// Lazy load components for code splitting
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const TwoFactorSetupPage = lazy(() => import('../pages/auth/TwoFactorSetupPage'));
const TwoFactorVerifyPage = lazy(() => import('../pages/auth/TwoFactorVerifyPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const BuildingsPage = lazy(() => import('../pages/buildings/BuildingsPage'));
const ApartmentsPage = lazy(() => import('../pages/apartments/ApartmentsPage'));
const ResidentsPage = lazy(() => import('../pages/residents/ResidentsPage'));
const InvoicesPage = lazy(() => import('../pages/invoices/InvoicesPage'));
const InvoiceDetailPage = lazy(() => import('../pages/invoices/InvoiceDetailPage'));
const PaymentsPage = lazy(() => import('../pages/payments/PaymentsPage'));
const PaymentDashboardPage = lazy(() => import('../pages/payments/PaymentDashboardPage'));
const BalanceReportPage = lazy(() => import('../pages/reports/BalanceReportPage'));
const IncomeExpenseReportPage = lazy(() => import('../pages/reports/IncomeExpenseReportPage'));
const BudgetComparisonReportPage = lazy(
  () => import('../pages/reports/BudgetComparisonReportPage')
);
const YearOverYearReportPage = lazy(() => import('../pages/reports/YearOverYearReportPage'));
const AnnouncementsPage = lazy(() => import('../pages/announcements/AnnouncementsPage'));
const MessagesPage = lazy(() => import('../pages/messages/MessagesPage'));
const PollsPage = lazy(() => import('../pages/polls/PollsPage'));
const MaintenancePage = lazy(() => import('../pages/maintenance/MaintenancePage'));
const DocumentsPage = lazy(() => import('../pages/documents/DocumentsPage'));
const MeetingsPage = lazy(() => import('../pages/meetings/MeetingsPage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const UserManagementPage = lazy(() => import('../pages/admin/UserManagementPage'));
const SystemConfigPage = lazy(() => import('../pages/admin/SystemConfigPage'));

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
    path: '/register',
    element: (
      <LazyLoad>
        <RegisterPage />
      </LazyLoad>
    ),
  },
  {
    path: '/2fa/setup',
    element: (
      <LazyLoad>
        <TwoFactorSetupPage />
      </LazyLoad>
    ),
  },
  {
    path: '/2fa/verify',
    element: (
      <LazyLoad>
        <TwoFactorVerifyPage />
      </LazyLoad>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <LazyLoad>
        <ForgotPasswordPage />
      </LazyLoad>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <LazyLoad>
        <ResetPasswordPage />
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
        element: (
          <LazyLoad>
            <BuildingsPage />
          </LazyLoad>
        ),
      },
      {
        path: 'apartments',
        element: (
          <LazyLoad>
            <ApartmentsPage />
          </LazyLoad>
        ),
      },
      {
        path: 'residents',
        element: (
          <LazyLoad>
            <ResidentsPage />
          </LazyLoad>
        ),
      },
      {
        path: 'invoices',
        element: (
          <LazyLoad>
            <InvoicesPage />
          </LazyLoad>
        ),
      },
      {
        path: 'invoices/:invoiceId',
        element: (
          <LazyLoad>
            <InvoiceDetailPage />
          </LazyLoad>
        ),
      },
      {
        path: 'payments',
        element: (
          <LazyLoad>
            <PaymentDashboardPage />
          </LazyLoad>
        ),
      },
      {
        path: 'payments/history',
        element: (
          <LazyLoad>
            <PaymentsPage />
          </LazyLoad>
        ),
      },
      {
        path: 'reports',
        element: (
          <LazyLoad>
            <BalanceReportPage />
          </LazyLoad>
        ),
      },
      {
        path: 'reports/balance',
        element: (
          <LazyLoad>
            <BalanceReportPage />
          </LazyLoad>
        ),
      },
      {
        path: 'reports/income-expense',
        element: (
          <LazyLoad>
            <IncomeExpenseReportPage />
          </LazyLoad>
        ),
      },
      {
        path: 'reports/budget',
        element: (
          <LazyLoad>
            <BudgetComparisonReportPage />
          </LazyLoad>
        ),
      },
      {
        path: 'reports/year-over-year',
        element: (
          <LazyLoad>
            <YearOverYearReportPage />
          </LazyLoad>
        ),
      },
      {
        path: 'announcements',
        element: (
          <LazyLoad>
            <AnnouncementsPage />
          </LazyLoad>
        ),
      },
      {
        path: 'messages',
        element: (
          <LazyLoad>
            <MessagesPage />
          </LazyLoad>
        ),
      },
      {
        path: 'polls',
        element: (
          <LazyLoad>
            <PollsPage />
          </LazyLoad>
        ),
      },
      {
        path: 'maintenance',
        element: (
          <LazyLoad>
            <MaintenancePage />
          </LazyLoad>
        ),
      },
      {
        path: 'meetings',
        element: (
          <LazyLoad>
            <MeetingsPage />
          </LazyLoad>
        ),
      },
      {
        path: 'documents',
        element: (
          <LazyLoad>
            <DocumentsPage />
          </LazyLoad>
        ),
      },
      {
        path: 'settings',
        element: (
          <LazyLoad>
            <SettingsPage />
          </LazyLoad>
        ),
      },
      {
        path: 'admin',
        element: (
          <LazyLoad>
            <AdminDashboardPage />
          </LazyLoad>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <LazyLoad>
            <UserManagementPage />
          </LazyLoad>
        ),
      },
      {
        path: 'admin/buildings',
        element: <Box p={3}>Admin Buildings Management (Coming Soon)</Box>,
      },
      {
        path: 'admin/audit-log',
        element: <Box p={3}>Audit Log (Coming Soon)</Box>,
      },
      {
        path: 'admin/settings',
        element: (
          <LazyLoad>
            <SystemConfigPage />
          </LazyLoad>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
