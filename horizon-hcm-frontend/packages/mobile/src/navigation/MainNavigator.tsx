import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import BuildingsScreen from '../screens/buildings/BuildingsScreen';
import InvoicesScreen from '../screens/invoices/InvoicesScreen';
import PaymentsScreen from '../screens/payments/PaymentsScreen';

const Tab = createBottomTabNavigator();

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
        name="Buildings"
        component={BuildingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="office-building" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Invoices"
        component={InvoicesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="credit-card" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
