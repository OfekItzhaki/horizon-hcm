import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  Buildings: undefined;
  Apartments: undefined;
  Residents: undefined;
  Invoices: undefined;
  Payments: undefined;
  Announcements: undefined;
  Maintenance: undefined;
  BuildingDetail: { buildingId: string };
  ApartmentDetail: { apartmentId: string };
  ResidentDetail: { residentId: string };
  InvoiceDetail: { invoiceId: string };
  PaymentDetail: { paymentId: string };
  AnnouncementDetail: { announcementId: string };
  MaintenanceDetail: { maintenanceId: string };
  BuildingForm: undefined;
  MaintenanceForm: undefined;
};

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type MainNavigationProp = NativeStackNavigationProp<MainStackParamList>;
