import React, { useState, useMemo, useCallback } from "react";
import {
    View, Text, StyleSheet, SectionList, TouchableOpacity,
    ActivityIndicator, Alert, ScrollView, RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getInvoices, deleteInvoice } from "../api/invoices";
import { THEME, INVOICE_STATUS_COLORS, sharedStyles } from "../theme";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMonthKey(dateStr) {
    const [year, month] = dateStr.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
}

function shortMonth(monthKey) {
    const [year, month] = monthKey.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleString("default", { month: "short", year: "2-digit" });
}

// invoice_date is nullable — fall back to due_date for grouping/sorting
function invDate(inv) {
    return inv.invoice_date || inv.due_date || "";
}

function getMonthOptions(invoices) {
    const keys = [...new Set(invoices.map((inv) => invDate(inv).slice(0, 7)))];
    return keys.sort((a, b) => b.localeCompare(a));
}

function sortInvoices(invoices, sortKey, sortDir) {
    if (!sortKey) return invoices;
    const dir = sortDir === "asc" ? 1 : -1;
    const valueOf = (inv) => {
        switch (sortKey) {
            case "date":    return invDate(inv);
            case "number":  return (inv.invoice_number ?? "").toLowerCase();
            case "client":  return (inv.client_name ?? "").toLowerCase();
            case "status":  return inv.status ?? "";
            case "amount":  return Number(inv.amount) || 0;
            default:        return 0;
        }
    };
    return [...invoices].sort((a, b) => {
        const av = valueOf(a), bv = valueOf(b);
        if (av < bv) return -dir;
        if (av > bv) return dir;
        return 0;
    });
}

function buildSections(invoices, filterMonth, sortKey, sortDir) {
    const filtered = filterMonth
        ? invoices.filter((inv) => invDate(inv).slice(0, 7) === filterMonth)
        : invoices;

    const sorted = sortKey
        ? sortInvoices(filtered, sortKey, sortDir)
        : [...filtered].sort((a, b) => invDate(b).localeCompare(invDate(a)));

    const map = {};
    for (const inv of sorted) {
        const key = invDate(inv).slice(0, 7);
        if (!map[key]) map[key] = [];
        map[key].push(inv);
    }

    const orderedKeys = [];
    const seen = new Set();
    for (const inv of sorted) {
        const k = invDate(inv).slice(0, 7);
        if (!seen.has(k)) { seen.add(k); orderedKeys.push(k); }
    }

    return orderedKeys.map((key) => {
        const data = map[key];
        const totalAmount = data.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
        const byStatus = data.reduce((acc, inv) => {
            acc[inv.status] = (acc[inv.status] || 0) + 1;
            return acc;
        }, {});
        return {
            key,
            title: formatMonthKey(key + "-01"),
            data,
            summary: { totalAmount, byStatus, count: data.length },
        };
    });
}

function fmtDate(dateStr) {
    return `${Number(dateStr.split("-")[2])}`;
}

function dayOfWeek(dateStr) {
    return new Date(dateStr + "T12:00:00").toLocaleString("default", { weekday: "short" });
}

function fmtAmount(val) {
    if (!val && val !== 0) return "—";
    return `$${Number(val).toFixed(2)}`;
}

function colAlign(align) {
    return align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";
}

// ─── Column config ────────────────────────────────────────────────────────────

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortBar({ sortKey, sortDir, onSort }) {
    const options = [
        { key: "date", label: "Date" },
        { key: "number", label: "Number" },
        { key: "client", label: "Client" },
        { key: "status", label: "Status" },
        { key: "amount", label: "Amount" },
    ];

    return (
        <View style={styles.sortBar}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>
                {options.map((opt) => (
                    <TouchableOpacity
                        key={opt.key}
                        style={[styles.sortChip, sortKey === opt.key && styles.sortChipActive]}
                        onPress={() => onSort(opt.key)}
                    >
                        <Text style={[styles.sortChipText, sortKey === opt.key && styles.sortChipTextActive]}>
                            {opt.label}
                        </Text>
                        {sortKey === opt.key && (
                            <MaterialCommunityIcons
                                name={sortDir === "asc" ? "arrow-up" : "arrow-down"}
                                size={12}
                                color="#FFF"
                            />
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

function InvoiceItem({ item, onPress, onDelete }) {
    const date = invDate(item);
    return (
        <TouchableOpacity style={styles.invoiceCard} onPress={() => onPress(item)} activeOpacity={0.7}>
            <View style={styles.cardMain}>
                <View style={styles.dateBlock}>
                    <Text style={styles.dateNum}>{fmtDate(date)}</Text>
                    <Text style={styles.dateDow}>{dayOfWeek(date)}</Text>
                </View>

                <View style={styles.infoBlock}>
                    <Text style={styles.invoiceNum} numberOfLines={1}>#{item.invoice_number}</Text>
                    <Text style={styles.clientText} numberOfLines={1}>{item.client_name || "Unknown Client"}</Text>
                </View>

                <View style={styles.amountBlock}>
                    <Text style={styles.amountText}>{fmtAmount(item.amount)}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <StatusBadge status={item.status} />
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={8}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={THEME.muted} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

function StatusBadge({ status }) {
    const s = status === "draft" ? "sent" : status;
    const color = INVOICE_STATUS_COLORS[s] || THEME.muted;
    const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
    return (
        <View style={[styles.statusBadge, { borderColor: color + "44", backgroundColor: color + "18" }]}>
            <View style={[styles.statusDot, { backgroundColor: color }]} />
            <Text style={[styles.statusText, { color }]}>{label}</Text>
        </View>
    );
}

// DataRow replaced by InvoiceItem

function StatBox({ icon, label, value, color = THEME.muted, subLabel }) {
    return (
        <View style={styles.statBox}>
            <View style={[styles.statIconContainer, { backgroundColor: color + "15" }]}>
                <MaterialCommunityIcons name={icon} size={16} color={color} />
            </View>
            <View style={styles.statContent}>
                <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
                <View style={styles.statValueContainer}>
                    <Text style={[styles.statValue, { color: color === THEME.muted ? THEME.text : color }]}>
                        {value}
                    </Text>
                    {subLabel && <Text style={styles.statSubLabel}>{subLabel}</Text>}
                </View>
            </View>
        </View>
    );
}

function SectionFooter({ summary }) {
    const { totalAmount, byStatus, count } = summary;
    return (
        <View style={styles.sectionFooter}>
            <View style={styles.sectionFooterGrid}>
                <StatBox
                    icon="currency-usd"
                    label="Total Amount"
                    value={fmtAmount(totalAmount)}
                    color={THEME.primary}
                />
                <StatBox
                    icon="format-list-bulleted"
                    label="Invoices"
                    value={String(count)}
                    color={THEME.muted}
                />
                {Object.entries(byStatus).map(([status, n]) => {
                    const color = INVOICE_STATUS_COLORS[status] || THEME.muted;
                    const icon = status === 'paid' ? 'check-circle-outline' : status === 'sent' ? 'email-outline' : status === 'overdue' ? 'alert-circle-outline' : 'file-outline';
                    return (
                        <StatBox
                            key={status}
                            icon={icon}
                            label={status.charAt(0).toUpperCase() + status.slice(1)}
                            value={String(n)}
                            color={color}
                        />
                    );
                })}
            </View>
        </View>
    );
}

function MonthFilterBar({ months, selected, onSelect }) {
    if (months.length === 0) return null;
    return (
        <View style={styles.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBarInner}>
                <TouchableOpacity
                    style={[styles.filterChip, !selected && styles.filterChipActive]}
                    onPress={() => onSelect(null)}
                >
                    <Text style={[styles.filterChipText, !selected && styles.filterChipTextActive]}>All</Text>
                </TouchableOpacity>
                {months.map((m) => (
                    <TouchableOpacity
                        key={m}
                        style={[styles.filterChip, selected === m && styles.filterChipActive]}
                        onPress={() => onSelect(selected === m ? null : m)}
                    >
                        <Text style={[styles.filterChipText, selected === m && styles.filterChipTextActive]}>
                            {shortMonth(m)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function InvoiceListScreen({ navigation }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterMonth, setFilterMonth] = useState(null);
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState("desc");

    const load = useCallback(async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        try {
            const res = await getInvoices();
            setInvoices(res.data || []);
        } catch { }
        setLoading(false);
        setRefreshing(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            load();
        }, [load])
    );

    const handleDelete = (id) => {
        Alert.alert("Delete Invoice", "Are you sure you want to delete this invoice?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteInvoice(id);
                        load();
                    } catch {
                        Alert.alert("Error", "Could not delete the invoice.");
                    }
                },
            },
        ]);
    };

    const handleSort = (key) => {
        if (sortKey === key) {
            if (sortDir === "asc") {
                setSortDir("desc");
            } else {
                setSortKey(null);
                setSortDir("desc");
            }
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const monthOptions = useMemo(() => getMonthOptions(invoices), [invoices]);
    const sections = useMemo(
        () => buildSections(invoices, filterMonth, sortKey, sortDir),
        [invoices, filterMonth, sortKey, sortDir]
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={THEME.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {invoices.length === 0 ? (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="file-document-outline" size={48} color={THEME.border} />
                    <Text style={styles.emptyText}>No invoices yet</Text>
                    <Text style={styles.emptySubText}>Tap + to add your first entry</Text>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    <MonthFilterBar
                        months={monthOptions}
                        selected={filterMonth}
                        onSelect={setFilterMonth}
                    />

                    {/* Sort Bar */}
                    <SortBar
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={handleSort}
                    />

                    {sections.length === 0 ? (
                        <View style={styles.center}>
                            <MaterialCommunityIcons name="filter-off-outline" size={40} color={THEME.border} />
                            <Text style={styles.emptyText}>No invoices for this month</Text>
                        </View>
                    ) : (
                        <SectionList
                            sections={sections}
                            keyExtractor={(item) => String(item.id)}
                            stickySectionHeadersEnabled={true}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={() => load(true)}
                                    tintColor={THEME.primary}
                                />
                            }
                            renderSectionHeader={({ section }) => (
                                <View style={styles.monthHeader}>
                                    <MaterialCommunityIcons name="calendar-month" size={15} color={THEME.primary} />
                                    <Text style={styles.monthTitle}>{section.title}</Text>
                                    <Text style={styles.monthCount}>{section.summary.count} entries</Text>
                                </View>
                            )}
                            renderItem={({ item }) => (
                                <InvoiceItem
                                    item={item}
                                    onPress={(inv) => navigation.navigate("InvoiceDetail", { invoice: inv })}
                                    onDelete={handleDelete}
                                />
                            )}
                            renderSectionFooter={({ section }) => (
                                <SectionFooter summary={section.summary} />
                            )}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
                </View>
            )}

            <TouchableOpacity
                style={sharedStyles.fab}
                onPress={() => navigation.navigate("InvoiceForm")}
            >
                <MaterialCommunityIcons name="plus" size={26} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ROW_HEIGHT = 52;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
    emptyText: { color: THEME.text, fontSize: 16, fontWeight: "600", marginTop: 12 },
    emptySubText: { color: THEME.muted, fontSize: 14 },
    listContent: { paddingBottom: 100 },

    // Month filter bar
    filterBar: {
        backgroundColor: THEME.card,
        borderBottomWidth: 1,
        borderBottomColor: THEME.border,
    },
    filterBarInner: {
        flexDirection: "row",
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 6,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        backgroundColor: THEME.bg,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    filterChipActive: {
        backgroundColor: THEME.primary,
        borderColor: THEME.primary,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: "600",
        color: THEME.muted,
    },
    filterChipTextActive: {
        color: "#FFF",
    },

    // Sort Bar
    sortBar: {
        backgroundColor: THEME.card,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 10,
        gap: 10,
    },
    sortLabel: {
        fontSize: 11,
        color: THEME.muted,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    sortScroll: {
        gap: 8,
    },
    sortChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: THEME.bg,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    sortChipActive: {
        backgroundColor: THEME.primary,
        borderColor: THEME.primary,
    },
    sortChipText: {
        fontSize: 12,
        color: THEME.text,
        fontWeight: "600",
    },
    sortChipTextActive: {
        color: "#FFF",
    },

    // Month section header
    monthHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: THEME.bg,
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 12,
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: THEME.text,
        letterSpacing: 0.2,
        flex: 1,
    },
    monthCount: {
        fontSize: 11,
        color: THEME.muted,
        fontWeight: "600",
    },

    // Invoice Card style
    invoiceCard: {
        backgroundColor: THEME.card,
        marginHorizontal: 12,
        marginBottom: 8,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    cardMain: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 10,
    },
    dateBlock: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: THEME.bg,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        minWidth: 44,
    },
    dateNum: {
        fontSize: 18,
        fontWeight: "800",
        color: THEME.text,
    },
    dateDow: {
        fontSize: 9,
        fontWeight: "700",
        color: THEME.muted,
        textTransform: "uppercase",
    },
    infoBlock: {
        flex: 1,
        gap: 2,
    },
    invoiceNum: {
        fontSize: 15,
        fontWeight: "800",
        color: THEME.info,
    },
    clientText: {
        fontSize: 13,
        color: THEME.muted,
        fontWeight: "500",
    },
    amountBlock: {
        alignItems: "flex-end",
    },
    amountText: {
        fontSize: 16,
        fontWeight: "700",
        color: THEME.text,
    },
    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: THEME.divider,
        paddingTop: 10,
    },

    // Section footer
    sectionFooter: {
        backgroundColor: THEME.bg,
        borderTopWidth: 1,
        borderTopColor: THEME.border,
        paddingBottom: 20,
    },
    sectionFooterGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        padding: 12,
        gap: 8,
    },
    statBox: {
        backgroundColor: THEME.card,
        borderRadius: 8,
        padding: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flexGrow: 1,
        minWidth: "45%",
        borderWidth: 1,
        borderColor: THEME.border,
    },
    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 6,
        justifyContent: "center",
        alignItems: "center",
    },
    statContent: {
        flex: 1,
    },
    statLabel: {
        fontSize: 9,
        color: THEME.muted,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    statValueContainer: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 2,
    },
    statValue: {
        fontSize: 14,
        fontWeight: "700",
        color: THEME.text,
    },
    statSubLabel: {
        fontSize: 9,
        color: THEME.muted,
        fontWeight: "600",
        marginLeft: 2,
    },
});
