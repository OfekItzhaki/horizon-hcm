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
  ApartmentForm: {
    apartment?: {
      id: string;
      number: string;
      floor: number;
      size?: number;
      bedrooms?: number;
      bathrooms?: number;
      occupancyStatus: string;
    };
    buildingId?: string;
  };
  ResidentsList: { buildingId?: string };
  ResidentForm: {
    resident?: {
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
      moveInDate?: string;
    };
    apartmentId?: string;
  };
};

export type FinanceStackParamList = {
  InvoicesList: undefined;
  InvoiceDetail: {
    invoice: {
      id: string;
      buildingId: string;
      apartmentId: string;
      amount: number;
      currency: string;
      description: string;
      dueDate: string | Date;
      status: string;
      createdAt: string | Date;
      updatedAt: string | Date;
      paidAt?: string | Date;
      paymentId?: string;
    };
  };
  PaymentForm: { invoice: { id: string; description: string; amount: number } };
  PaymentsList: undefined;
  ReportsList: undefined;
};

export type CommunicationStackParamList = {
  AnnouncementsList: undefined;
  AnnouncementDetail: {
    announcement: {
      id: string;
      buildingId: string;
      title: string;
      content: string;
      priority: string;
      requiresConfirmation: boolean;
      createdBy: string;
      createdAt: string | Date;
      updatedAt: string | Date;
      publishedAt?: string | Date;
      readBy: string[];
      confirmedBy: string[];
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
      trackingNumber: string;
      createdAt: string | Date;
      updatedAt: string | Date;
      resolvedAt?: string | Date;
      photos?: string[];
    };
  };
  MaintenanceForm: undefined;
  PollsList: undefined;
  PollDetail: { pollId: string };
  PollForm: Record<string, never>;
  MeetingsList: undefined;
  MeetingDetail: { meetingId: string };
  MeetingForm: Record<string, never>;
  DocumentsList: undefined;
  NotificationsList: undefined;
  Chat: undefined;
  Settings: undefined;
  Profile: undefined;
  ProfileEdit: undefined;
  ChangePassword: undefined;
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
