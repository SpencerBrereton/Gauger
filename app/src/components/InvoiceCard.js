import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { THEME, INVOICE_STATUS_COLORS as STATUS_COLORS } from "../theme";

export default function InvoiceCard({ invoice, onPress }) {
  const statusColor = STATUS_COLORS[invoice.status] || THEME.muted;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75} testID={`invoice-card-${invoice.id}`}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="file-document" size={22} color={THEME.info} />
      </View>
      <View style={styles.info}>
        <Text style={styles.invoiceNum}>#{invoice.invoice_number}</Text>
        <Text style={styles.client} numberOfLines={1}>{invoice.client_name}</Text>
        <Text style={styles.due}>Due {invoice.due_date}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>${parseFloat(invoice.amount || 0).toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", backgroundColor: THEME.card, marginHorizontal: 12, marginVertical: 4, borderRadius: 8, padding: 14, gap: 12, borderWidth: 1, borderColor: THEME.border },
  iconWrap: { width: 40, height: 40, borderRadius: 8, backgroundColor: THEME.invoiceAccent, justifyContent: "center", alignItems: "center" },
  info: { flex: 1 },
  invoiceNum: { color: THEME.text, fontSize: 15, fontWeight: "700", marginBottom: 2 },
  client: { color: THEME.muted, fontSize: 13, marginBottom: 2 },
  due: { color: THEME.muted, fontSize: 11 },
  right: { alignItems: "flex-end", gap: 6 },
  amount: { color: THEME.text, fontSize: 16, fontWeight: "800" },
});
