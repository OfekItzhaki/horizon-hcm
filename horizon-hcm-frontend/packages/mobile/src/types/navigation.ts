import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  Buildings: undefined;
  Invoices: undefined;
  Payments: undefined;
  BuildingDetail: { buildingId: string };
  InvoiceDetail: { invoiceId: string };
  PaymentDetail: { paymentId: string };
};

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type MainNavigationProp = NativeStackNavigationProp<MainStackParamList>;
