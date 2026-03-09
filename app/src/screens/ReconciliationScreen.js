import { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl, ScrollView, Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getReconciliationReports,
  createReconciliationReport,
  deleteReconciliationReport,
} from "../api/reconciliation";
import { THEME, sharedStyles } from "../theme";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPresetDates(preset) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed

  switch (preset) {
    case "this_month": {
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0);
      return [fmt(start), fmt(end)];
    }
    case "last_month": {
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      return [fmt(start), fmt(end)];
    }
    case "this_quarter": {
      const qStart = Math.floor(m / 3) * 3;
      const start = new Date(y, qStart, 1);
      const end = new Date(y, qStart + 3, 0);
      return [fmt(start), fmt(end)];
    }
    case "last_quarter": {
      const qStart = Math.floor(m / 3) * 3 - 3;
      const start = new Date(y, qStart, 1);
      const end = new Date(y, qStart + 3, 0);
      return [fmt(start), fmt(end)];
    }
    default:
      return ["", ""];
  }
}

function fmt(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fmtPeriod(start, end) {
  const opts = { month: "short", day: "numeric", year: "numeric" };
  const s = new Date(start + "T12:00:00").toLocaleDateString("default", opts);
  const e = new Date(end + "T12:00:00").toLocaleDateString("default", opts);
  return `${s} – ${e}`;
}

function calcNet(r) {
  return parseFloat(r.total_invoiced || 0) - parseFloat(r.total_expenses || 0);
}

function sortReports(reports, key) {
  const arr = [...reports];
  switch (key) {
    case "period":
      return arr.sort((a, b) => b.period_start.localeCompare(a.period_start));
    case "net":
      return arr.sort((a, b) => calcNet(b) - calcNet(a));
    case "expenses":
      return arr.sort((a, b) => parseFloat(b.total_expenses || 0) - parseFloat(a.total_expenses || 0));
    default:
      return arr;
  }
}

const PRESETS = [
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_quarter", label: "This Quarter" },
  { key: "last_quarter", label: "Last Quarter" },
  { key: "custom", label: "Custom" },
];

const SORT_OPTIONS = [
  { key: "period", label: "Period" },
  { key: "net", label: "Net" },
  { key: "expenses", label: "Expenses" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortBar({ sortKey, onSort }) {
  return (
    <View style={styles.sortBar}>
      <Text style={styles.sortLabel}>Sort by:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sortChip, sortKey === opt.key && styles.sortChipActive]}
            onPress={() => onSort(opt.key)}
          >
            <Text style={[styles.sortChipText, sortKey === opt.key && styles.sortChipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function StatusBadge({ net }) {
  if (net > 0) return (
    <View style={[styles.badge, { backgroundColor: "#16A34A18", borderColor: "#16A34A44" }]}>
      <View style={[styles.badgeDot, { backgroundColor: "#16A34A" }]} />
      <Text style={[styles.badgeText, { color: "#16A34A" }]}>Surplus</Text>
    </View>
  );
  if (net < 0) return (
    <View style={[styles.badge, { backgroundColor: "#DC262618", borderColor: "#DC262644" }]}>
      <View style={[styles.badgeDot, { backgroundColor: "#DC2626" }]} />
      <Text style={[styles.badgeText, { color: "#DC2626" }]}>Deficit</Text>
    </View>
  );
  return (
    <View style={[styles.badge, { backgroundColor: THEME.muted + "18", borderColor: THEME.muted + "44" }]}>
      <View style={[styles.badgeDot, { backgroundColor: THEME.muted }]} />
      <Text style={[styles.badgeText, { color: THEME.muted }]}>Break-even</Text>
    </View>
  );
}

function ReportCard({ report, onPress, onDelete }) {
  const net = calcNet(report);
  const invoiced = parseFloat(report.total_invoiced || 0);
  const expenses = parseFloat(report.total_expenses || 0);
  const margin = invoiced > 0 ? Math.round(((invoiced - expenses) / invoiced) * 100) : null;
  const netColor = net > 0 ? "#16A34A" : net < 0 ? "#DC2626" : "#2563EB";

  return (
    <TouchableOpacity style={styles.reportCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="calendar-range" size={14} color={THEME.muted} />
        <Text style={styles.period}>{fmtPeriod(report.period_start, report.period_end)}</Text>
        <StatusBadge net={net} />
      </View>

      <View style={styles.figures}>
        <View style={styles.figureCol}>
          <Text style={styles.figureLabel}>Expenses</Text>
          <Text style={[styles.figureValue, { color: "#DC2626" }]}>
            ${expenses.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.figureCol, styles.figureDivider]}>
          <Text style={styles.figureLabel}>Invoiced</Text>
          <Text style={[styles.figureValue, { color: "#16A34A" }]}>
            ${invoiced.toFixed(2)}
          </Text>
        </View>
        <View style={styles.figureCol}>
          <Text style={styles.figureLabel}>Net</Text>
          <Text style={[styles.figureValue, { color: netColor }]}>
            ${net.toFixed(2)}
          </Text>
        </View>
      </View>

      {margin !== null && (
        <Text style={styles.margin}>
          Profit margin: <Text style={{ color: netColor, fontWeight: "700" }}>{margin}%</Text>
        </Text>
      )}

      {report.notes ? <Text style={styles.reportNotes}>{report.notes}</Text> : null}

      <View style={styles.cardFooter}>
        <Text style={styles.tapHint}>Tap for breakdown</Text>
        <TouchableOpacity onPress={() => onDelete(report.id)} hitSlop={8}>
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={THEME.muted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function GenerateModal({ visible, onClose, onSubmit }) {
  const [preset, setPreset] = useState("last_month");
  const [form, setForm] = useState(() => {
    const [s, e] = getPresetDates("last_month");
    return { period_start: s, period_end: e, notes: "" };
  });
  const [saving, setSaving] = useState(false);

  const selectPreset = (key) => {
    setPreset(key);
    if (key !== "custom") {
      const [s, e] = getPresetDates(key);
      setForm((f) => ({ ...f, period_start: s, period_end: e }));
    }
  };

  const handleSubmit = async () => {
    if (!form.period_start || !form.period_end) {
      Alert.alert("Validation", "Start and end dates are required.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form);
      setPreset("last_month");
      const [s, e] = getPresetDates("last_month");
      setForm({ period_start: s, period_end: e, notes: "" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Generate Report</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={THEME.muted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Period</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[styles.presetChip, preset === p.key && styles.presetChipActive]}
                onPress={() => selectPreset(p.key)}
              >
                <Text style={[styles.presetChipText, preset === p.key && styles.presetChipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {(preset === "custom") && (
            <>
              <Text style={styles.fieldLabel}>Start Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={form.period_start}
                onChangeText={(v) => setForm((f) => ({ ...f, period_start: v }))}
                placeholder="2026-01-01"
                placeholderTextColor={THEME.muted}
              />
              <Text style={styles.fieldLabel}>End Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={form.period_end}
                onChangeText={(v) => setForm((f) => ({ ...f, period_end: v }))}
                placeholder="2026-01-31"
                placeholderTextColor={THEME.muted}
              />
            </>
          )}

          {preset !== "custom" && (
            <Text style={styles.dateRange}>
              {form.period_start && form.period_end
                ? fmtPeriod(form.period_start, form.period_end)
                : "—"}
            </Text>
          )}

          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, { height: 70 }]}
            value={form.notes}
            onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
            multiline
            placeholder="Add any notes..."
            placeholderTextColor={THEME.muted}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Generate Report</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ReconciliationScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sortKey, setSortKey] = useState("period");

  const load = useCallback(async () => {
    try {
      const res = await getReconciliationReports();
      setReports(res.data || []);
    } catch (_) {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load();
  }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleCreate = async (form) => {
    try {
      await createReconciliationReport(form);
      setShowModal(false);
      await load();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.errors?.join("\n") || "Failed to create report.");
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Report", "Are you sure you want to delete this report?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteReconciliationReport(id);
            load();
          } catch {
            Alert.alert("Error", "Could not delete the report.");
          }
        },
      },
    ]);
  };

  const sorted = sortReports(reports, sortKey);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={THEME.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {reports.length > 0 && (
        <SortBar sortKey={sortKey} onSort={setSortKey} />
      )}

      {reports.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="scale-balance" size={64} color={THEME.border} />
          <Text style={styles.emptyText}>No reports yet</Text>
          <Text style={styles.emptySubText}>Tap + to generate your first report</Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
          renderItem={({ item }) => (
            <ReportCard
              report={item}
              onPress={() => navigation.navigate("ReconciliationDetail", { report: item })}
              onDelete={handleDelete}
            />
          )}
        />
      )}

      <TouchableOpacity
        style={sharedStyles.fab}
        onPress={() => setShowModal(true)}
        testID="reconciliation-add-button"
      >
        <MaterialCommunityIcons name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      <GenerateModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  emptyText: { color: THEME.text, fontSize: 16, fontWeight: "600", marginTop: 8 },
  emptySubText: { color: THEME.muted, fontSize: 14 },
  listContent: { padding: 12, paddingBottom: 100 },

  // Sort bar
  sortBar: {
    backgroundColor: THEME.card,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    gap: 10,
  },
  sortLabel: { fontSize: 11, color: THEME.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  sortScroll: { gap: 8 },
  sortChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: THEME.bg, borderWidth: 1, borderColor: THEME.border },
  sortChipActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  sortChipText: { fontSize: 12, color: THEME.text, fontWeight: "600" },
  sortChipTextActive: { color: "#FFF" },

  // Report card
  reportCard: {
    backgroundColor: THEME.card,
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
  period: { flex: 1, color: THEME.text, fontWeight: "600", fontSize: 14 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  figures: { flexDirection: "row", marginBottom: 10 },
  figureCol: { flex: 1, alignItems: "center" },
  figureDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: THEME.border },
  figureLabel: { color: THEME.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontWeight: "700" },
  figureValue: { fontSize: 17, fontWeight: "700" },
  margin: { color: THEME.muted, fontSize: 12, marginBottom: 4 },
  reportNotes: { color: THEME.muted, fontSize: 13, marginTop: 4, fontStyle: "italic" },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, borderTopWidth: 1, borderTopColor: THEME.divider, paddingTop: 10 },
  tapHint: { color: THEME.muted, fontSize: 11, fontWeight: "600" },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: { backgroundColor: THEME.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, gap: 12, paddingBottom: 36 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  modalTitle: { color: THEME.text, fontSize: 17, fontWeight: "700" },
  fieldLabel: { color: THEME.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginTop: 4 },
  presetRow: { gap: 8, paddingVertical: 4 },
  presetChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: THEME.border, backgroundColor: THEME.bg },
  presetChipActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  presetChipText: { fontSize: 13, fontWeight: "600", color: THEME.muted },
  presetChipTextActive: { color: "#FFF" },
  dateRange: { color: THEME.text, fontSize: 14, fontWeight: "600", textAlign: "center", paddingVertical: 6, backgroundColor: THEME.bg, borderRadius: 8 },
  input: { backgroundColor: THEME.input, color: THEME.text, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: THEME.border },
  saveBtn: { backgroundColor: THEME.primary, borderRadius: 8, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
