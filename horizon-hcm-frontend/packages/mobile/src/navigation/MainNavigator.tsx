import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import BuildingsScreen from '../screens/buildings/BuildingsScreen';
import BuildingDetailScreen from '../screens/buildings/BuildingDetailScreen';
import BuildingFormScreen from '../screens/buildings/BuildingFormScreen';
import ApartmentsScreen from '../screens/apartments/ApartmentsScreen';
import ResidentsScreen from '../screens/residents/ResidentsScreen';
import InvoicesScreen from '../screens/invoices/InvoicesScreen';
import InvoiceDetailScreen from '../screens/invoices/InvoiceDetailScreen';
import PaymentsScreen from '../screens/payments/PaymentsScreen';
import PaymentFormScreen from '../screens/payments/PaymentFormScreen';
import AnnouncementsScreen from '../screens/announcements/AnnouncementsScreen';
import AnnouncementDetailScreen from '../screens/announcements/AnnouncementDetailScreen';
import MaintenanceScreen from '../screens/maintenance/MaintenanceScreen';
import MaintenanceDetailScreen from '../screens/maintenance/MaintenanceDetailScreen';
import MaintenanceFormScreen from '../screens/maintenance/MaintenanceFormScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BuildingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="BuildingsList"
        component={BuildingsScreen}
        options={{ title: 'Buildings' }}
      />
      <Stack.Screen
        name="BuildingDetail"
        component={BuildingDetailScreen}
        options={{ title: 'Building Details' }}
      />
      <Stack.Screen
        name="BuildingForm"
        component={BuildingFormScreen}
        options={{ title: 'Building Form' }}
      />
      <Stack.Screen
        name="ApartmentsList"
        component={ApartmentsScreen}
        options={{ title: 'Apartments' }}
      />
      <Stack.Screen
        name="ResidentsList"
        component={ResidentsScreen}
        options={{ title: 'Residents' }}
      />
    </Stack.Navigator>
  );
}

function CommunicationStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AnnouncementsList"
        component={AnnouncementsScreen}
        options={{ title: 'Announcements' }}
      />
      <Stack.Screen
        name="AnnouncementDetail"
        component={AnnouncementDetailScreen}
        options={{ title: 'Announcement' }}
      />
      <Stack.Screen
        name="MaintenanceList"
        component={MaintenanceScreen}
        options={{ title: 'Maintenance' }}
      />
      <Stack.Screen
        name="MaintenanceDetail"
        component={MaintenanceDetailScreen}
        options={{ title: 'Request Details' }}
      />
      <Stack.Screen
        name="MaintenanceForm"
        component={MaintenanceFormScreen}
        options={{ title: 'New Request' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}

function FinanceStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="InvoicesList"
        component={InvoicesScreen}
        options={{ title: 'Invoices' }}
      />
      <Stack.Screen
        name="InvoiceDetail"
        component={InvoiceDetailScreen}
        options={{ title: 'Invoice Details' }}
      />
      <Stack.Screen
        name="PaymentForm"
        component={PaymentFormScreen}
        options={{ title: 'Make Payment' }}
      />
      <Stack.Screen
        name="PaymentsList"
        component={PaymentsScreen}
        options={{ title: 'Payments' }}
      />
    </Stack.Navigator>
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
