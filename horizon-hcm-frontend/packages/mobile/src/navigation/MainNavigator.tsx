import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import BuildingsScreen from '../screens/buildings/BuildingsScreen';
import ApartmentsScreen from '../screens/apartments/ApartmentsScreen';
import ResidentsScreen from '../screens/residents/ResidentsScreen';
import InvoicesScreen from '../screens/invoices/InvoicesScreen';
import PaymentsScreen from '../screens/payments/PaymentsScreen';
import AnnouncementsScreen from '../screens/announcements/AnnouncementsScreen';
import MaintenanceScreen from '../screens/maintenance/MaintenanceScreen';

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
        name="MaintenanceList"
        component={MaintenanceScreen}
        options={{ title: 'Maintenance' }}
      />
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
