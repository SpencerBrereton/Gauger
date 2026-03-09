import { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getExpenses } from "../api/expenses";
import { getInvoices } from "../api/invoices";
import { getMileageLogs } from "../api/mileageLogs";
import { THEME, INVOICE_STATUS_COLORS } from "../theme";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_ICONS = {
  Travel: "airplane",
  Meals: "food",
  Equipment: "tools",
  Software: "laptop",
  Office: "office-building",
  Other: "tag",
};

function inRange(dateStr, start, end) {
  if (!dateStr) return false;
  return dateStr >= start && dateStr <= end;
}

// Match invoices to a period using billing_period_start when set (the explicit
// work period), falling back to due_date or invoice_date — mirrors backend logic.
function invoiceInPeriod(inv, start, end) {
  const billingStart = (inv.billing_period_start || "").slice(0, 10);
  if (billingStart) return inRange(billingStart, start, end);
  const due = (inv.due_date || "").slice(0, 10);
  const issued = (inv.invoice_date || "").slice(0, 10);
  return inRange(due, start, end) || inRange(issued, start, end);
}

function fmtPeriod(start, end) {
  const opts = { month: "short", day: "numeric", year: "numeric" };
  const s = new Date(start + "T12:00:00").toLocaleDateString("default", opts);
  const e = new Date(end + "T12:00:00").toLocaleDateString("default", opts);
  return `${s} – ${e}`;
}

function fmtMoney(val) {
  return `$${Number(val || 0).toFixed(2)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title }) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon} size={15} color={THEME.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function StatRow({ label, value, color, icon }) {
  return (
    <View style={styles.statRow}>
      <View style={[styles.statIcon, { backgroundColor: (color || THEME.muted) + "18" }]}>
        <MaterialCommunityIcons name={icon} size={16} color={color || THEME.muted} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

function CategoryBreakdown({ expenses }) {
  const byCategory = {};
  for (const e of expenses) {
    const cat = e.category_name || e.category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + parseFloat(e.amount || 0);
  }

  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  if (entries.length === 0) {
    return <Text style={styles.noData}>No expenses in this period</Text>;
  }

  return (
    <View style={styles.breakdownList}>
      {entries.map(([cat, amount]) => {
        const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
        const icon = CATEGORY_ICONS[cat] || "tag";
        return (
          <View key={cat} style={styles.breakdownRow}>
            <View style={[styles.statIcon, { backgroundColor: THEME.primary + "18" }]}>
              <MaterialCommunityIcons name={icon} size={15} color={THEME.primary} />
            </View>
            <Text style={styles.breakdownLabel}>{cat}</Text>
            <View style={styles.breakdownBar}>
              <View style={[styles.breakdownBarFill, { width: `${pct}%`, backgroundColor: THEME.primary + "60" }]} />
            </View>
            <Text style={styles.breakdownPct}>{pct}%</Text>
            <Text style={styles.breakdownAmount}>{fmtMoney(amount)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function InvoiceStatusBreakdown({ invoices }) {
  const STATUS_COLORS = INVOICE_STATUS_COLORS;
  const STATUS_ICONS = { sent: "send", paid: "check-circle-outline", overdue: "alert-circle-outline" };

  const byStatus = {};
  for (const inv of invoices) {
    const s = inv.status || "sent";
    if (!byStatus[s]) byStatus[s] = { count: 0, total: 0 };
    byStatus[s].count += 1;
    byStatus[s].total += parseFloat(inv.amount || 0);
  }

  if (invoices.length === 0) {
    return <Text style={styles.noData}>No invoices in this period</Text>;
  }

  return (
    <View style={styles.breakdownList}>
      {Object.entries(byStatus).map(([status, { count, total }]) => {
        const color = STATUS_COLORS[status] || THEME.muted;
        const icon = STATUS_ICONS[status] || "file-document";
        return (
          <View key={status} style={styles.statRow}>
            <View style={[styles.statIcon, { backgroundColor: color + "18" }]}>
              <MaterialCommunityIcons name={icon} size={16} color={color} />
            </View>
            <Text style={[styles.statLabel, { color }]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
            <Text style={styles.statMeta}>{count} invoice{count !== 1 ? "s" : ""}</Text>
            <Text style={[styles.statValue, { color }]}>{fmtMoney(total)}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ReconciliationDetailScreen({ route }) {
  const { report } = route.params;
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [mileageCost, setMileageCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [expRes, invRes, mileRes] = await Promise.all([
        getExpenses(),
        getInvoices(),
        getMileageLogs(),
      ]);
      const s = report.period_start;
      const e = report.period_end;
      setExpenses((expRes.data || []).filter((x) => inRange(x.date, s, e)));
      setInvoices((invRes.data || []).filter((x) => invoiceInPeriod(x, s, e)));
      const mileTotal = (mileRes.data || [])
        .filter((x) => inRange(x.date, s, e))
        .reduce((sum, m) => sum + parseFloat(m.total_cost || 0), 0);
      setMileageCost(mileTotal);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, [report.period_start, report.period_end]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load();
  }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const net = parseFloat(report.total_invoiced || 0) - parseFloat(report.total_expenses || 0);
  const netColor = net > 0 ? "#16A34A" : net < 0 ? "#DC2626" : "#2563EB";
  const invoiced = parseFloat(report.total_invoiced || 0);
  const expTotal = parseFloat(report.total_expenses || 0);
  const margin = invoiced > 0 ? Math.round(((invoiced - expTotal) / invoiced) * 100) : null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
    >
      {/* Hero header */}
      <View style={styles.hero}>
        <Text style={styles.heroPeriod}>{fmtPeriod(report.period_start, report.period_end)}</Text>
        <Text style={[styles.heroNet, { color: netColor }]}>{fmtMoney(net)}</Text>
        <Text style={styles.heroNetLabel}>NET {net >= 0 ? "SURPLUS" : "DEFICIT"}</Text>
        {margin !== null && (
          <Text style={[styles.heroMargin, { color: netColor }]}>{margin}% profit margin</Text>
        )}
      </View>

      {/* Summary row */}
      <View style={styles.card}>
        <SectionHeader icon="chart-bar" title="Summary" />
        <StatRow icon="currency-usd" label="Total Expenses" value={fmtMoney(expTotal)} color="#DC2626" />
        <StatRow icon="cash" label="Total Invoiced" value={fmtMoney(invoiced)} color="#16A34A" />
        {mileageCost > 0 && (
          <StatRow icon="gas-station" label="Mileage / Fuel" value={fmtMoney(mileageCost)} color="#8B5CF6" />
        )}
        <StatRow icon="scale-balance" label="Net" value={fmtMoney(net)} color={netColor} />
      </View>

      {/* Expenses by category */}
      <View style={styles.card}>
        <SectionHeader icon="tag-multiple" title="Expenses by Category" />
        <CategoryBreakdown expenses={expenses} />
      </View>

      {/* Invoice status breakdown */}
      <View style={styles.card}>
        <SectionHeader icon="file-document-multiple" title="Invoice Breakdown" />
        <InvoiceStatusBreakdown invoices={invoices} />
      </View>

      {/* Notes */}
      {report.notes ? (
        <View style={styles.card}>
          <SectionHeader icon="note-text" title="Notes" />
          <Text style={styles.notes}>{report.notes}</Text>
        </View>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  hero: {
    backgroundColor: THEME.card,
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    marginBottom: 12,
  },
  heroPeriod: { color: THEME.muted, fontSize: 13, fontWeight: "600", marginBottom: 10 },
  heroNet: { fontSize: 40, fontWeight: "800", letterSpacing: -1 },
  heroNetLabel: { color: THEME.muted, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 4 },
  heroMargin: { fontSize: 14, fontWeight: "700", marginTop: 8 },

  card: {
    backgroundColor: THEME.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 16,
  },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  sectionTitle: { color: THEME.muted, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.5 },

  statRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: THEME.divider },
  statIcon: { width: 30, height: 30, borderRadius: 6, justifyContent: "center", alignItems: "center" },
  statLabel: { flex: 1, color: THEME.text, fontSize: 14, fontWeight: "500" },
  statMeta: { color: THEME.muted, fontSize: 12 },
  statValue: { color: THEME.text, fontSize: 15, fontWeight: "700" },

  breakdownList: { gap: 8 },
  breakdownRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  breakdownLabel: { width: 72, color: THEME.text, fontSize: 13, fontWeight: "500" },
  breakdownBar: { flex: 1, height: 6, backgroundColor: THEME.border, borderRadius: 3, overflow: "hidden" },
  breakdownBarFill: { height: "100%", borderRadius: 3 },
  breakdownPct: { width: 32, color: THEME.muted, fontSize: 11, fontWeight: "600", textAlign: "right" },
  breakdownAmount: { width: 72, color: THEME.text, fontSize: 13, fontWeight: "700", textAlign: "right" },

  noData: { color: THEME.muted, fontSize: 14, fontStyle: "italic", textAlign: "center", paddingVertical: 8 },
  notes: { color: THEME.text, fontSize: 14, lineHeight: 20 },
});
