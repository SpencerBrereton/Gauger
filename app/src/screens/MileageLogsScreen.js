import React, { useState, useMemo } from "react";
import {
    View, Text, StyleSheet, SectionList, TouchableOpacity,
    ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getMileageLogs, deleteMileageLog } from "../api/mileageLogs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { THEME, sharedStyles } from "../theme";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMonthKey(dateStr) {
    const [year, month] = dateStr.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
}

function computeKmDeltas(logs) {
    const withOdo = logs
        .filter((l) => l.current_odometer != null && l.current_odometer !== "")
        .map((l) => ({ id: l.id, odo: Number(l.current_odometer), date: l.date }))
        .sort((a, b) => a.odo - b.odo || a.date.localeCompare(b.date));

    const deltaMap = new Map();
    for (let i = 1; i < withOdo.length; i++) {
        const delta = withOdo[i].odo - withOdo[i - 1].odo;
        if (delta > 0 && delta < 10000) {
            deltaMap.set(withOdo[i].id, delta);
        }
    }
    return deltaMap;
}

// Sort a flat array of logs by a given column key + direction.
// deltaMap needed for the "km" column.
function sortLogs(logs, sortKey, sortDir) {
    if (!sortKey) return logs;
    const dir = sortDir === "asc" ? 1 : -1;

    const valueOf = (l) => {
        switch (sortKey) {
            case "date":      return l.date ?? "";
            case "dest":      return (l.destination ?? "").toLowerCase();
            case "purpose":   return (l.purpose ?? "").toLowerCase();
            case "odometer":  return Number(l.current_odometer) || 0;
            case "gas":       return Number(l.gasoline_litres) || 0;
            case "cost":      return Number(l.total_cost) || 0;
            default:          return 0;
        }
    };

    return [...logs].sort((a, b) => {
        const av = valueOf(a), bv = valueOf(b);
        if (av < bv) return -dir;
        if (av > bv) return dir;
        return 0;
    });
}

function buildSections(logs, filterMonth, sortKey, sortDir) {
    // deltaMap computed once over all raw logs for accurate km deltas
    const deltaMap = computeKmDeltas(logs);

    // Filter to selected month
    const filtered = filterMonth
        ? logs.filter((l) => l.date.slice(0, 7) === filterMonth)
        : logs;

    // Sort within month (or across all if no filter)
    const defaultSorted = sortKey
        ? sortLogs(filtered, sortKey, sortDir)
        : [...filtered].sort((a, b) => b.date.localeCompare(a.date)); // default: newest first

    // Group into months
    const map = {};
    for (const log of defaultSorted) {
        const key = log.date.slice(0, 7);
        if (!map[key]) map[key] = [];
        map[key].push(log);
    }

    // Build sections, preserving display order from sorted list
    const orderedKeys = [];
    const seen = new Set();
    for (const log of defaultSorted) {
        const k = log.date.slice(0, 7);
        if (!seen.has(k)) { seen.add(k); orderedKeys.push(k); }
    }

    return orderedKeys.map((key) => {
        const data = map[key];
        const totalKm = data.reduce((sum, l) => sum + (deltaMap.get(l.id) ?? 0), 0);
        const totalGas = data.reduce((sum, l) => sum + (Number(l.gasoline_litres) || 0), 0);
        const totalCost = data.reduce((sum, l) => sum + (Number(l.total_cost) || 0), 0);
        const costPerKm = totalKm > 0 && totalCost > 0 ? totalCost / totalKm : null;
        const litresPer100km = totalKm > 0 && totalGas > 0 ? (totalGas / totalKm) * 100 : null;

        return {
            key,
            title: formatMonthKey(key + "-01"),
            data: data.map(l => ({ ...l, delta: deltaMap.get(l.id) || 0 })),
            summary: { totalKm, totalGas, totalCost, costPerKm, litresPer100km, count: data.length },
        };
    });
}

// Collect distinct "YYYY-MM" month keys from logs, sorted descending
function getMonthOptions(logs) {
    const keys = [...new Set(logs.map((l) => l.date.slice(0, 7)))];
    return keys.sort((a, b) => b.localeCompare(a));
}

function fmtOdo(val) {
    if (!val && val !== 0) return "—";
    return Number(val).toLocaleString();
}

function fmtNum(val, decimals = 1) {
    if (!val && val !== 0) return "—";
    return Number(val).toFixed(decimals);
}

function fmtDate(dateStr) {
    return `${Number(dateStr.split("-")[2])}`;
}

function dayOfWeek(dateStr) {
    return new Date(dateStr + "T12:00:00").toLocaleString("default", { weekday: "short" });
}

function shortMonth(monthKey) {
    // monthKey: "YYYY-MM"
    const [year, month] = monthKey.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleString("default", { month: "short", year: "2-digit" });
}

// ─── Column config ────────────────────────────────────────────────────────────

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortBar({ sortKey, sortDir, onSort }) {
    const options = [
        { key: "date", label: "Date" },
        { key: "odometer", label: "Odo" },
        { key: "gas", label: "Fuel" },
        { key: "cost", label: "Cost" },
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

function MileageLogItem({ item, onEdit, onDelete }) {
    const delta = item.delta;
    return (
        <TouchableOpacity style={styles.logCard} onPress={() => onEdit(item)} activeOpacity={0.7}>
            <View style={styles.cardMain}>
                <View style={styles.dateBlock}>
                    <Text style={styles.dateNum}>{fmtDate(item.date)}</Text>
                    <Text style={styles.dateDow}>{dayOfWeek(item.date)}</Text>
                </View>

                <View style={styles.infoBlock}>
                    <Text style={styles.destText} numberOfLines={1}>{item.destination || "Unnamed"}</Text>
                    <Text style={styles.purposeText} numberOfLines={1}>{item.purpose || "—"}</Text>
                </View>

                <View style={styles.costBlock}>
                    <Text style={[styles.costText, !item.total_cost && styles.costMuted]}>
                        {item.total_cost ? `$${fmtNum(item.total_cost, 2)}` : "$0.00"}
                    </Text>
                </View>
            </View>

            <View style={styles.cardStats}>
                <View style={styles.itemStat}>
                    <MaterialCommunityIcons name="speedometer" size={14} color={THEME.muted} />
                    <Text style={styles.statText}>{fmtOdo(item.current_odometer)}</Text>
                </View>
                {delta > 0 && (
                    <View style={styles.itemStat}>
                        <MaterialCommunityIcons name="map-marker-distance" size={14} color={THEME.muted} />
                        <Text style={styles.statText}>{delta.toLocaleString()} km</Text>
                    </View>
                )}
                {item.gasoline_litres > 0 && (
                    <View style={styles.itemStat}>
                        <MaterialCommunityIcons name="gas-station" size={14} color={THEME.muted} />
                        <Text style={styles.statText}>{fmtNum(item.gasoline_litres)} L</Text>
                    </View>
                )}

                <View style={{ flex: 1 }} />

                <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={8}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={THEME.muted} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

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
    const { totalKm, totalGas, totalCost, costPerKm, litresPer100km, count } = summary;
    return (
        <View style={styles.sectionFooter}>
            <View style={styles.sectionFooterGrid}>
                <StatBox
                    icon="currency-usd"
                    label="Total Cost"
                    value={`$${fmtNum(totalCost, 2)}`}
                    color={THEME.success}
                />
                <StatBox
                    icon="map-marker-distance"
                    label="Distance"
                    value={`${totalKm.toLocaleString()} km`}
                    color={THEME.info}
                />
                <StatBox
                    icon="gas-station"
                    label="Fuel Used"
                    value={`${fmtNum(totalGas, 1)} L`}
                    color={THEME.muted}
                />
                <StatBox
                    icon="format-list-bulleted"
                    label="Entries"
                    value={String(count)}
                    color={THEME.muted}
                />
                {costPerKm !== null && (
                    <StatBox
                        icon="cash-multiple"
                        label="Avg Cost"
                        value={`$${fmtNum(costPerKm, 3)}`}
                        subLabel="/km"
                        color={THEME.primary}
                    />
                )}
                {litresPer100km !== null && (
                    <StatBox
                        icon="fuel"
                        label="Efficiency"
                        value={fmtNum(litresPer100km, 1)}
                        subLabel="L/100"
                        color={THEME.primary}
                    />
                )}
            </View>
        </View>
    );
}

// Month filter chip bar — sits above the horizontal scroll table
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

export default function MileageLogsScreen({ navigation }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterMonth, setFilterMonth] = useState(null);   // "YYYY-MM" or null
    const [sortKey, setSortKey] = useState(null);            // col key or null
    const [sortDir, setSortDir] = useState("desc");          // "asc" | "desc"

    const fetchLogs = async () => {
        try {
            const response = await getMileageLogs();
            setLogs(response.data || []);
        } catch {
            Alert.alert("Error", "Could not load mileage logs.");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            setLoading(true);
            fetchLogs();
        }, [])
    );

    const handleDelete = (id) => {
        Alert.alert("Delete Log", "Are you sure you want to delete this log?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteMileageLog(id);
                        fetchLogs();
                    } catch {
                        Alert.alert("Error", "Could not delete the log.");
                    }
                },
            },
        ]);
    };

    const handleSort = (key) => {
        if (sortKey === key) {
            // Same column: flip direction, or clear if already desc
            if (sortDir === "asc") {
                setSortDir("desc");
            } else {
                // second tap on desc → clear sort
                setSortKey(null);
                setSortDir("desc");
            }
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const monthOptions = useMemo(() => getMonthOptions(logs), [logs]);
    const sections = useMemo(
        () => buildSections(logs, filterMonth, sortKey, sortDir),
        [logs, filterMonth, sortKey, sortDir]
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
            {logs.length === 0 ? (
                <View style={styles.center}>
                    <MaterialCommunityIcons name="map-marker-path" size={48} color={THEME.border} />
                    <Text style={styles.emptyText}>No mileage logs yet</Text>
                    <Text style={styles.emptySubText}>Tap + to add your first entry</Text>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {/* Month filter bar — outside horizontal scroll so it stays full-width */}
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
                            <Text style={styles.emptyText}>No logs for this month</Text>
                        </View>
                    ) : (
                        <SectionList
                            sections={sections}
                            keyExtractor={(item) => item.id.toString()}
                            stickySectionHeadersEnabled={true}
                            renderSectionHeader={({ section }) => (
                                <View style={styles.monthHeader}>
                                    <MaterialCommunityIcons name="calendar-month" size={15} color={THEME.primary} />
                                    <Text style={styles.monthTitle}>{section.title}</Text>
                                    <Text style={styles.monthCount}>{section.summary.count} entries</Text>
                                </View>
                            )}
                            renderItem={({ item }) => (
                                <MileageLogItem
                                    item={item}
                                    onEdit={(log) => navigation.navigate("MileageLogForm", { mileageLog: log })}
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
                onPress={() => navigation.navigate("MileageLogForm")}
            >
                <MaterialCommunityIcons name="plus" size={26} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function colAlign(align) {
    return align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";
}

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

    // Log Card style
    logCard: {
        backgroundColor: THEME.card,
        marginHorizontal: 12,
        marginBottom: 8,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: THEME.border,
        ...sharedStyles.shadow, // If shadow doesn't exist I'll add a simple one
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
    destText: {
        fontSize: 15,
        fontWeight: "700",
        color: THEME.text,
    },
    purposeText: {
        fontSize: 13,
        color: THEME.muted,
    },
    costBlock: {
        alignItems: "flex-end",
    },
    costText: {
        fontSize: 16,
        fontWeight: "700",
        color: THEME.success,
    },
    costMuted: {
        color: THEME.muted,
    },
    cardStats: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: THEME.divider,
        paddingTop: 10,
    },
    itemStat: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statText: {
        fontSize: 12,
        fontWeight: "600",
        color: THEME.textSecondary,
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
