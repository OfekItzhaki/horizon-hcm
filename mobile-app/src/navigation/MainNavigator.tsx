import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import BuildingsScreen from '../screens/buildings/BuildingsScreen';
import BuildingDetailScreen from '../screens/buildings/BuildingDetailScreen';
import BuildingFormScreen from '../screens/buildings/BuildingFormScreen';
import ApartmentsScreen from '../screens/apartments/ApartmentsScreen';
import ApartmentFormScreen from '../screens/apartments/ApartmentFormScreen';
import ResidentsScreen from '../screens/residents/ResidentsScreen';
import ResidentFormScreen from '../screens/residents/ResidentFormScreen';
import InvoicesScreen from '../screens/invoices/InvoicesScreen';
import InvoiceDetailScreen from '../screens/invoices/InvoiceDetailScreen';
import PaymentsScreen from '../screens/payments/PaymentsScreen';
import PaymentFormScreen from '../screens/payments/PaymentFormScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import AnnouncementsScreen from '../screens/announcements/AnnouncementsScreen';
import AnnouncementDetailScreen from '../screens/announcements/AnnouncementDetailScreen';
import MaintenanceScreen from '../screens/maintenance/MaintenanceScreen';
import MaintenanceDetailScreen from '../screens/maintenance/MaintenanceDetailScreen';
import MaintenanceFormScreen from '../screens/maintenance/MaintenanceFormScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import PollsScreen from '../screens/polls/PollsScreen';
import PollDetailScreen from '../screens/polls/PollDetailScreen';
import DocumentsScreen from '../screens/documents/DocumentsScreen';
import MeetingsScreen from '../screens/meetings/MeetingsScreen';
import MeetingDetailScreen from '../screens/meetings/MeetingDetailScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ProfileEditScreen from '../screens/profile/ProfileEditScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import {
  BuildingsStackParamList,
  CommunicationStackParamList,
  FinanceStackParamList,
  MainTabParamList,
} from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();
const BuildingsStackNav = createNativeStackNavigator<BuildingsStackParamList>();
const CommunicationStackNav = createNativeStackNavigator<CommunicationStackParamList>();
const FinanceStackNav = createNativeStackNavigator<FinanceStackParamList>();

function BuildingsStack() {
  return (
    <BuildingsStackNav.Navigator>
      <BuildingsStackNav.Screen
        name="BuildingsList"
        component={BuildingsScreen}
        options={{ title: 'Buildings' }}
      />
      <BuildingsStackNav.Screen
        name="BuildingDetail"
        component={BuildingDetailScreen}
        options={{ title: 'Building Details' }}
      />
      <BuildingsStackNav.Screen
        name="BuildingForm"
        component={BuildingFormScreen}
        options={{ title: 'Building Form' }}
      />
      <BuildingsStackNav.Screen
        name="ApartmentsList"
        component={ApartmentsScreen}
        options={{ title: 'Apartments' }}
      />
      <BuildingsStackNav.Screen
        name="ApartmentForm"
        component={ApartmentFormScreen}
        options={{ title: 'Apartment Form' }}
      />
      <BuildingsStackNav.Screen
        name="ResidentsList"
        component={ResidentsScreen}
        options={{ title: 'Residents' }}
      />
      <BuildingsStackNav.Screen
        name="ResidentForm"
        component={ResidentFormScreen}
        options={{ title: 'Resident Form' }}
      />
    </BuildingsStackNav.Navigator>
  );
}

function CommunicationStack() {
  return (
    <CommunicationStackNav.Navigator>
      <CommunicationStackNav.Screen
        name="AnnouncementsList"
        component={AnnouncementsScreen}
        options={{ title: 'Announcements' }}
      />
      <CommunicationStackNav.Screen
        name="AnnouncementDetail"
        component={AnnouncementDetailScreen}
        options={{ title: 'Announcement' }}
      />
      <CommunicationStackNav.Screen
        name="MaintenanceList"
        component={MaintenanceScreen}
        options={{ title: 'Maintenance' }}
      />
      <CommunicationStackNav.Screen
        name="MaintenanceDetail"
        component={MaintenanceDetailScreen}
        options={{ title: 'Request Details' }}
      />
      <CommunicationStackNav.Screen
        name="MaintenanceForm"
        component={MaintenanceFormScreen}
        options={{ title: 'New Request' }}
      />
      <CommunicationStackNav.Screen name="PollsList" component={PollsScreen} options={{ title: 'Polls' }} />
      <CommunicationStackNav.Screen
        name="PollDetail"
        component={PollDetailScreen}
        options={{ title: 'Poll Details' }}
      />
      <CommunicationStackNav.Screen
        name="MeetingsList"
        component={MeetingsScreen}
        options={{ title: 'Meetings' }}
      />
      <CommunicationStackNav.Screen
        name="MeetingDetail"
        component={MeetingDetailScreen}
        options={{ title: 'Meeting Details' }}
      />
      <CommunicationStackNav.Screen
        name="DocumentsList"
        component={DocumentsScreen}
        options={{ title: 'Documents' }}
      />
      <CommunicationStackNav.Screen
        name="NotificationsList"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <CommunicationStackNav.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
      <CommunicationStackNav.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <CommunicationStackNav.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <CommunicationStackNav.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ title: 'Edit Profile' }}
      />
      <CommunicationStackNav.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
    </CommunicationStackNav.Navigator>
  );
}

function FinanceStack() {
  return (
    <FinanceStackNav.Navigator>
      <FinanceStackNav.Screen
        name="InvoicesList"
        component={InvoicesScreen}
        options={{ title: 'Invoices' }}
      />
      <FinanceStackNav.Screen
        name="InvoiceDetail"
        component={InvoiceDetailScreen}
        options={{ title: 'Invoice Details' }}
      />
      <FinanceStackNav.Screen
        name="PaymentForm"
        component={PaymentFormScreen}
        options={{ title: 'Make Payment' }}
      />
      <FinanceStackNav.Screen
        name="PaymentsList"
        component={PaymentsScreen}
        options={{ title: 'Payments' }}
      />
      <FinanceStackNav.Screen name="ReportsList" component={ReportsScreen} options={{ title: 'Reports' }} />
    </FinanceStackNav.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1976d2',
        tabBarInactiveTintColor: '#757575',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="BuildingsTab"
        component={BuildingsStack}
        options={{
          headerShown: false,
          title: 'Buildings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="office-building" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FinanceTab"
        component={FinanceStack}
        options={{
          headerShown: false,
          title: 'Finance',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CommunicationTab"
        component={CommunicationStack}
        options={{
          headerShown: false,
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dots-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
