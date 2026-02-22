import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type BuildingsStackParamList = {
  BuildingsList: undefined;
  BuildingDetail: {
    building: {
      id: string;
      name: string;
      address: unknown;
      totalApartments?: number;
      totalResidents?: number;
      yearBuilt?: number;
    };
  };
  BuildingForm: { building?: { id: string; name: string; address: unknown; yearBuilt?: number } };
  ApartmentsList: { buildingId?: string };
  ResidentsList: { buildingId?: string };
};

export type FinanceStackParamList = {
  InvoicesList: undefined;
  InvoiceDetail: {
    invoice: {
      id: string;
      number: string;
      description: string;
      amount: number;
      status: string;
      issueDate: string;
      dueDate: string;
      paidDate?: string;
    };
  };
  PaymentForm: { invoice: { id: string; number: string; description: string; amount: number } };
  PaymentsList: undefined;
};

export type CommunicationStackParamList = {
  AnnouncementsList: undefined;
  AnnouncementDetail: {
    announcement: {
      id: string;
      title: string;
      content: string;
      author: string;
      date: string;
      priority: string;
      isRead?: boolean;
    };
  };
  MaintenanceList: undefined;
  MaintenanceDetail: {
    request: {
      id: string;
      title: string;
      description: string;
      category: string;
      priority: string;
      status: string;
      location: string;
      trackingNumber: string;
      submittedDate: string;
      completedDate?: string;
      photos?: string[];
    };
  };
  MaintenanceForm: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  BuildingsTab: undefined;
  FinanceTab: undefined;
  CommunicationTab: undefined;
};

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type BuildingsNavigationProp = NativeStackNavigationProp<BuildingsStackParamList>;
export type FinanceNavigationProp = NativeStackNavigationProp<FinanceStackParamList>;
export type CommunicationNavigationProp = NativeStackNavigationProp<CommunicationStackParamList>;
