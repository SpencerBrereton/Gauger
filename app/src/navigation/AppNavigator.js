import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import useAuthStore from "../store/authStore";
import { THEME } from "../theme";

// Screens
import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import ExpenseListScreen from "../screens/ExpenseListScreen";
import ExpenseFormScreen from "../screens/ExpenseFormScreen";
import ReceiptCameraScreen from "../screens/ReceiptCameraScreen";
import InvoiceListScreen from "../screens/InvoiceListScreen";
import InvoiceDetailScreen from "../screens/InvoiceDetailScreen";
import ReconciliationScreen from "../screens/ReconciliationScreen";
import ReconciliationDetailScreen from "../screens/ReconciliationDetailScreen";
import CategoryListScreen from "../screens/CategoryListScreen";
import VehicleListScreen from "../screens/VehicleListScreen";
import VehicleFormScreen from "../screens/VehicleFormScreen";
import MileageLogsScreen from "../screens/MileageLogsScreen";
import MileageLogFormScreen from "../screens/MileageLogFormScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ClientListScreen from "../screens/ClientListScreen";
import ClientFormScreen from "../screens/ClientFormScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function ExpenseStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: THEME.card, shadowColor: THEME.border, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 1 }, elevation: 0, borderBottomWidth: 1, borderBottomColor: THEME.border },
        headerTintColor: THEME.primary,
        headerTitleStyle: { fontWeight: "600", color: THEME.text, fontSize: 16 },
        cardStyle: { backgroundColor: THEME.bg },
      }}
    >
      <Stack.Screen name="ExpenseList" component={ExpenseListScreen} options={{ title: "Expenses" }} />
      <Stack.Screen name="ExpenseForm" component={ExpenseFormScreen} options={{ title: "Add Expense" }} />
      <Stack.Screen name="ReceiptCamera" component={ReceiptCameraScreen} options={{ title: "Capture Receipt" }} />
      <Stack.Screen name="Categories" component={CategoryListScreen} options={{ title: "Manage Categories" }} />
    </Stack.Navigator>
  );
}

import InvoiceFormScreen from "../screens/InvoiceFormScreen";
import InvoiceLinesScreen from "../screens/InvoiceLinesScreen";

function InvoiceStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: THEME.card, shadowColor: THEME.border, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 1 }, elevation: 0, borderBottomWidth: 1, borderBottomColor: THEME.border },
        headerTintColor: THEME.primary,
        headerTitleStyle: { fontWeight: "600", color: THEME.text, fontSize: 16 },
        cardStyle: { backgroundColor: THEME.bg },
      }}
    >
      <Stack.Screen name="InvoiceList" component={InvoiceListScreen} options={{ title: "Invoices" }} />
      <Stack.Screen name="InvoiceForm" component={InvoiceFormScreen} options={{ title: "New Invoice" }} />
      <Stack.Screen name="InvoiceLines" component={InvoiceLinesScreen} options={{ title: "Invoice Lines" }} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} options={{ title: "Invoice" }} />
    </Stack.Navigator>
  );
}

function VehicleStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: THEME.card, shadowColor: THEME.border, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 1 }, elevation: 0, borderBottomWidth: 1, borderBottomColor: THEME.border },
        headerTintColor: THEME.primary,
        headerTitleStyle: { fontWeight: "600", color: THEME.text, fontSize: 16 },
        cardStyle: { backgroundColor: THEME.bg },
      }}
    >
      <Stack.Screen name="VehicleList" component={VehicleListScreen} options={{ title: "My Vehicles" }} />
      <Stack.Screen name="VehicleForm" component={VehicleFormScreen} options={{ title: "Vehicle Profile" }} />
    </Stack.Navigator>
  );
}

function MileageLogStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: THEME.card, shadowColor: THEME.border, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 1 }, elevation: 0, borderBottomWidth: 1, borderBottomColor: THEME.border },
        headerTintColor: THEME.primary,
        headerTitleStyle: { fontWeight: "600", color: THEME.text, fontSize: 16 },
        cardStyle: { backgroundColor: THEME.bg },
      }}
    >
      <Stack.Screen name="MileageLogList" component={MileageLogsScreen} options={{ title: "Mileage Logs" }} />
      <Stack.Screen name="MileageLogForm" component={MileageLogFormScreen} options={{ title: "Add Mileage Log" }} />
      <Stack.Screen name="ReceiptCamera" component={ReceiptCameraScreen} options={{ title: "Capture Receipt" }} />
    </Stack.Navigator>
  );
}

function ReconciliationStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: THEME.card, shadowColor: THEME.border, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 1 }, elevation: 0, borderBottomWidth: 1, borderBottomColor: THEME.border },
        headerTintColor: THEME.primary,
        headerTitleStyle: { fontWeight: "600", color: THEME.text, fontSize: 16 },
        cardStyle: { backgroundColor: THEME.bg },
      }}
    >
      <Stack.Screen name="ReconciliationList" component={ReconciliationScreen} options={{ title: "Reconciliation" }} />
      <Stack.Screen name="ReconciliationDetail" component={ReconciliationDetailScreen} options={{ title: "Report Detail" }} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: THEME.card, shadowColor: THEME.border, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 1 }, elevation: 0, borderBottomWidth: 1, borderBottomColor: THEME.border },
        headerTintColor: THEME.primary,
        headerTitleStyle: { fontWeight: "600", color: THEME.text, fontSize: 16 },
        cardStyle: { backgroundColor: THEME.bg },
      }}
    >
      <Stack.Screen name="SettingsMenu" component={ProfileScreen} options={{ title: "My Profile Defaults" }} />
      <Stack.Screen name="ClientList" component={ClientListScreen} options={{ title: "My Clients" }} />
      <Stack.Screen name="ClientForm" component={ClientFormScreen} options={{ title: "Client Details" }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: THEME.card,
          borderTopColor: THEME.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: THEME.primary,
        tabBarInactiveTintColor: THEME.inactive,
        headerStyle: { backgroundColor: THEME.card, shadowColor: THEME.border, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 1 }, elevation: 0, borderBottomWidth: 1, borderBottomColor: THEME.border },
        headerTintColor: THEME.primary,
        headerTitleStyle: { fontWeight: "600", fontSize: 16, color: THEME.text },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpenseStack}
        options={{
          headerShown: false,
          unmountOnBlur: true,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="receipt" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Invoices"
        component={InvoiceStack}
        options={{
          headerShown: false,
          unmountOnBlur: true,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="MileageLogs"
        component={MileageLogStack}
        options={{
          headerShown: false,
          tabBarLabel: "Mileage",
          unmountOnBlur: true,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="gas-station" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Reconciliation"
        component={ReconciliationStack}
        options={{
          headerShown: false,
          unmountOnBlur: true,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="scale-balance" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isInitializing, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: THEME.bg }}>
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Vehicles" component={VehicleStack} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
