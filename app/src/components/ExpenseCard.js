import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { THEME, EXPENSE_STATUS_COLORS as STATUS_COLORS } from "../theme";
const CATEGORY_ICONS = { Travel: "airplane", Meals: "food", Equipment: "tools", Software: "laptop", Office: "office-building", Other: "tag" };

export default function ExpenseCard({ expense, onPress }) {
  const categoryName = expense.category_name || expense.category || "No Category";
  const icon = CATEGORY_ICONS[categoryName] || "tag";
  const statusColor = STATUS_COLORS[expense.status] || THEME.muted;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75} testID={`expense-card-${expense.id}`}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={22} color={THEME.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{expense.title}</Text>
        <Text style={styles.meta}>{categoryName} • {expense.date}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>${parseFloat(expense.amount || 0).toFixed(2)}</Text>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", backgroundColor: THEME.card, marginHorizontal: 12, marginVertical: 4, borderRadius: 8, padding: 14, gap: 12, borderWidth: 1, borderColor: THEME.border },
  iconWrap: { width: 40, height: 40, borderRadius: 8, backgroundColor: THEME.expenseAccent, justifyContent: "center", alignItems: "center" },
  info: { flex: 1 },
  title: { color: THEME.text, fontSize: 15, fontWeight: "600", marginBottom: 3 },
  meta: { color: THEME.muted, fontSize: 12 },
  right: { alignItems: "flex-end", gap: 6 },
  amount: { color: THEME.text, fontSize: 16, fontWeight: "800" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});
