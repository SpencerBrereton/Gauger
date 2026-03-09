import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import useAuthStore from "../store/authStore";
import { getExpenses } from "../api/expenses";
import { getInvoices } from "../api/invoices";
import { getMileageLogs } from "../api/mileageLogs";
import { getUserProfile } from "../api/userProfiles";
import { THEME } from "../theme";

export default function DashboardScreen({ navigation }) {
  const { user, signOut } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: signOut }
      ]
    );
  };
  const [rawData, setRawData] = useState({ expenses: [], invoices: [], mileage: [] });
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState({ expenseCount: 0, totalExpenses: 0, invoiceCount: 0, totalInvoiced: 0, mileageCount: 0, totalMileageCost: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState(30); // null = all time, 30/60/90 = days

  const PERIODS = [
    { label: "30d", value: 30 },
    { label: "60d", value: 60 },
    { label: "90d", value: 90 },
    { label: "All", value: null },
  ];

  const filterByPeriod = (items, dateField, days) => {
    if (!days) return items;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return items.filter(item => item[dateField] && new Date(item[dateField]) >= cutoff);
  };

  const computeSummary = (expenses, invoices, mileage, days) => {
    const filteredExpenses = filterByPeriod(expenses, "date", days);
    const filteredInvoices = filterByPeriod(invoices, "created_at", days);
    const filteredMileage = filterByPeriod(mileage, "date", days);
    setSummary({
      expenseCount: filteredExpenses.length,
      totalExpenses: filteredExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0),
      invoiceCount: filteredInvoices.length,
      totalInvoiced: filteredInvoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0),
      mileageCount: filteredMileage.length,
      totalMileageCost: filteredMileage.reduce((s, m) => s + parseFloat(m.total_cost || 0), 0),
    });
  };

  const loadSummary = async () => {
    try {
      const [expensesRes, invoicesRes, mileageRes, profileRes] = await Promise.all([
        getExpenses(),
        getInvoices(),
        getMileageLogs(),
        getUserProfile()
      ]);
      const expenses = expensesRes.data;
      const invoices = invoicesRes.data;
      const mileage = mileageRes.data;
      setRawData({ expenses, invoices, mileage });
      setProfile(profileRes.data);
      computeSummary(expenses, invoices, mileage, period);
    } catch (_) { }
  };

  useEffect(() => { loadSummary(); }, []);
  useEffect(() => { computeSummary(rawData.expenses, rawData.invoices, rawData.mileage, period); }, [period]);
  const onRefresh = async () => { setRefreshing(true); await loadSummary(); setRefreshing(false); };

  const SummaryCard = ({ icon, label, value, color, onPress }) => (
    <TouchableOpacity style={[styles.summaryCard, { borderLeftColor: color }]} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back, {profile?.user_name || user?.email || "Contractor"}</Text>
        </View>
      </View>

      <View style={styles.periodBar}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={String(p.value)}
            style={[styles.periodChip, period === p.value && styles.periodChipActive]}
            onPress={() => setPeriod(p.value)}
          >
            <Text style={[styles.periodChipText, period === p.value && styles.periodChipTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.grid}>
        <SummaryCard icon="receipt" label="Expenses" value={summary.expenseCount} color="#F6821F" onPress={() => navigation.navigate("Expenses", { screen: "ExpenseList" })} />
        <SummaryCard icon="currency-usd" label="Total Spent" value={`$${summary.totalExpenses.toFixed(2)}`} color="#DC2626" onPress={() => navigation.navigate("Expenses", { screen: "ExpenseList" })} />
        <SummaryCard icon="file-document" label="Invoices" value={summary.invoiceCount} color="#2563EB" onPress={() => navigation.navigate("Invoices", { screen: "InvoiceList" })} />
        <SummaryCard icon="cash" label="Total Invoiced" value={`$${summary.totalInvoiced.toFixed(2)}`} color="#16A34A" onPress={() => navigation.navigate("Invoices", { screen: "InvoiceList" })} />
        <SummaryCard icon="gas-station" label="Mileage Logs" value={summary.mileageCount} color="#8B5CF6" onPress={() => navigation.navigate("MileageLogs", { screen: "MileageLogList" })} />
        <SummaryCard icon="fuel" label="Fuel Spent" value={`$${summary.totalMileageCost.toFixed(2)}`} color="#10B981" onPress={() => navigation.navigate("MileageLogs", { screen: "MileageLogList" })} />
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("Expenses", { screen: "ExpenseForm" })} testID="dashboard-add-expense-button">
            <MaterialCommunityIcons name="plus-circle" size={20} color={THEME.primary} />
            <Text style={styles.actionText}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("MileageLogs", { screen: "MileageLogForm" })} testID="dashboard-add-mileage-button">
            <MaterialCommunityIcons name="gas-station" size={20} color={THEME.primary} />
            <Text style={styles.actionText}>Add Mileage</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("Invoices", { screen: "InvoiceForm" })} testID="dashboard-add-invoice-button">
            <MaterialCommunityIcons name="file-document-plus" size={20} color={THEME.primary} />
            <Text style={styles.actionText}>Add Invoice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("Expenses", { screen: "Categories" })} testID="dashboard-manage-categories-button">
            <MaterialCommunityIcons name="tag-multiple" size={20} color={THEME.primary} />
            <Text style={styles.actionText}>Categories</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("Vehicles")} testID="dashboard-vehicles-button">
            <MaterialCommunityIcons name="car" size={20} color={THEME.primary} />
            <Text style={styles.actionText}>Vehicles</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("Settings", { screen: "ClientList" })} testID="dashboard-manage-clients-button">
            <MaterialCommunityIcons name="account-group" size={20} color={THEME.primary} />
            <Text style={styles.actionText}>Clients</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 20, paddingTop: 28, backgroundColor: THEME.card, borderBottomWidth: 1, borderBottomColor: THEME.border },
  greeting: { color: THEME.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600" },
  email: { color: THEME.text, fontSize: 16, fontWeight: "700", marginTop: 2 },
  signOutBtn: { padding: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 12 },
  summaryCard: { backgroundColor: THEME.card, borderRadius: 8, padding: 16, margin: 6, flex: 1, minWidth: 140, borderTopWidth: 3, alignItems: "flex-start", borderWidth: 1, borderColor: THEME.border },
  summaryValue: { color: THEME.text, fontSize: 22, fontWeight: "700", marginTop: 10 },
  summaryLabel: { color: THEME.muted, fontSize: 11, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600" },
  periodBar: { flexDirection: "row", paddingHorizontal: 18, paddingVertical: 12, gap: 8 },
  periodChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: THEME.border, backgroundColor: THEME.card },
  periodChipActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  periodChipText: { fontSize: 13, fontWeight: "600", color: THEME.muted },
  periodChipTextActive: { color: "#FFFFFF" },
  quickActions: { paddingHorizontal: 20, paddingBottom: 24 },
  sectionTitle: { color: THEME.muted, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 },
  actionGrid: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  actionBtn: { minWidth: "45%", flexGrow: 1, flexDirection: "row", alignItems: "center", backgroundColor: THEME.card, borderRadius: 8, padding: 14, gap: 10, borderWidth: 1, borderColor: THEME.border },
  actionText: { color: THEME.text, fontSize: 14, fontWeight: "500" },
});
