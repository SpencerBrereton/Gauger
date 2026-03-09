import React, { useState, useEffect } from "react";
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, TextInput, Platform
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createInvoice, updateInvoice } from "../api/invoices";
import { getExpenses } from "../api/expenses";
import { getMileageLogs } from "../api/mileageLogs";
import { getUserProfile } from "../api/userProfiles";

import { THEME } from "../theme";

export default function InvoiceLinesScreen({ navigation, route }) {
    const { invoiceData } = route.params;
    const invoiceId = invoiceData.invoiceId ?? null;
    const isEditing = !!invoiceId;
    const originalLineIds = (invoiceData.lines || []).map(l => l.id).filter(Boolean);
    const [lines, setLines] = useState(invoiceData.lines || []);
    const [saving, setSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [defaultDayRate, setDefaultDayRate] = useState("");
    const [defaultOfficeRate, setDefaultOfficeRate] = useState("");
    const [officeHours, setOfficeHours] = useState("");

    const [form, setForm] = useState({
        date: new Date(), day_rate: "", field_expenses: "", office_meeting: "",
        other_expenses: "", vehicle_mileage: "", rotation_mileage: ""
    });

    const [importModalVisible, setImportModalVisible] = useState(false);
    const [availableItems, setAvailableItems] = useState([]);
    const [importLoading, setImportLoading] = useState(false);
    const [officeHoursModalVisible, setOfficeHoursModalVisible] = useState(false);

    useEffect(() => {
        getUserProfile().then(({ data }) => {
            if (data?.default_day_rate) setDefaultDayRate(String(data.default_day_rate));
            if (data?.default_office_rate) setDefaultOfficeRate(String(data.default_office_rate));
        }).catch(() => {});
    }, []);

    const calculateTotal = (line) => {
        return [
            line.day_rate, line.field_expenses, line.office_meeting,
            line.other_expenses, line.vehicle_mileage, line.rotation_mileage
        ].reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    };

    const invoiceSubtotal = lines.reduce((sum, line) => sum + calculateTotal(line), 0);

    const openModal = (index = null) => {
        setEditingIndex(index);
        if (index !== null) {
            setForm({
                ...lines[index],
                date: new Date(lines[index].date)
            });
            setOfficeHours("");
        } else {
            setForm({
                date: new Date(), day_rate: defaultDayRate, field_expenses: "", office_meeting: "",
                other_expenses: "", vehicle_mileage: "", rotation_mileage: ""
            });
            setOfficeHours("");
        }
        setModalVisible(true);
    };

    const addDayRateLine = () => {
        if (!defaultDayRate) {
            Alert.alert("No Day Rate Set", "Set a default day rate in your Profile settings first.");
            return;
        }
        setLines(prev => [...prev, {
            date: new Date(), day_rate: defaultDayRate, field_expenses: "", office_meeting: "",
            other_expenses: "", vehicle_mileage: "", rotation_mileage: "", expense_id: null, mileage_log_id: null
        }]);
    };

    const addOfficeHoursLine = () => {
        if (!defaultOfficeRate) {
            Alert.alert("No Office Rate Set", "Set a default office rate in your Profile settings first.");
            return;
        }
        setOfficeHours("");
        setOfficeHoursModalVisible(true);
    };

    const confirmOfficeHours = () => {
        const h = parseFloat(officeHours) || 0;
        if (h <= 0) {
            Alert.alert("Invalid Hours", "Please enter a number greater than 0.");
            return;
        }
        const amount = (h * parseFloat(defaultOfficeRate)).toFixed(2);
        setLines(prev => [...prev, {
            date: new Date(), day_rate: "", field_expenses: "", office_meeting: amount,
            other_expenses: "", vehicle_mileage: "", rotation_mileage: "", expense_id: null, mileage_log_id: null
        }]);
        setOfficeHoursModalVisible(false);
    };

    const saveLine = () => {
        if (editingIndex !== null) {
            const newLines = [...lines];
            newLines[editingIndex] = { ...form };
            setLines(newLines);
        } else {
            setLines([...lines, { ...form, expense_id: null, mileage_log_id: null }]);
        }
        setModalVisible(false);
    };

    const removeLine = (index) => {
        Alert.alert("Remove Line", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Remove", style: "destructive", onPress: () => setLines(lines.filter((_, i) => i !== index)) }
        ])
    };

    const openImportModal = async () => {
        setImportLoading(true);
        try {
            const [expRes, milRes] = await Promise.all([getExpenses(), getMileageLogs()]);
            const startStr = String(invoiceData.billing_period_start).split('T')[0];
            const endStr = String(invoiceData.billing_period_end).split('T')[0];

            const filteredExpenses = (expRes.data || []).filter(e => {
                if (!e.date) return false;
                const d = String(e.date).split('T')[0];
                return d >= startStr && d <= endStr;
            }).map(e => ({
                id: e.id,
                date: String(e.date).split('T')[0],
                title: e.title || 'Untitled Expense',
                amount: e.final_total || e.amount || 0,
                type: 'expense'
            }));

            const filteredMileage = (milRes.data || []).filter(m => {
                if (!m.date) return false;
                const d = String(m.date).split('T')[0];
                return d >= startStr && d <= endStr;
            }).map(m => ({
                id: m.id,
                date: String(m.date).split('T')[0],
                title: `${m.destination || 'Mileage Log'}`,
                amount: m.total_cost || 0,
                type: 'mileage'
            }));

            setAvailableItems([...filteredExpenses, ...filteredMileage]);
            setImportModalVisible(true);
        } catch (e) {
            Alert.alert("Import Error", "Failed to fetch items for import.");
        } finally {
            setImportLoading(false);
        }
    };

    const handleImport = (item) => {
        const newLine = {
            date: new Date(item.date),
            day_rate: "",
            field_expenses: item.type === 'expense' ? item.amount : "",
            office_meeting: "",
            other_expenses: "",
            vehicle_mileage: item.type === 'mileage' ? item.amount : "",
            rotation_mileage: "",
            expense_id: item.type === 'expense' ? item.id : null,
            mileage_log_id: item.type === 'mileage' ? item.id : null
        };
        setLines([...lines, newLine]);
        setImportModalVisible(false);
    };

    const handleGenerate = async () => {
        if (lines.length === 0) {
            return Alert.alert("Validation", "Please add at least one line item to the invoice.");
        }

        setSaving(true);
        try {
            const { lines: _lines, invoiceId: _id, ...cleanInvoiceData } = invoiceData;

            const currentLineIds = lines.map(l => l.id).filter(Boolean);
            const destroyedLines = originalLineIds
                .filter(id => !currentLineIds.includes(id))
                .map(id => ({ id, _destroy: true }));

            const payload = {
                ...cleanInvoiceData,
                amount: invoiceSubtotal,
                due_date: invoiceData.due_date || new Date().toISOString().split('T')[0],
                invoice_lines_attributes: [
                    ...lines.map(line => ({
                        ...line,
                        date: line.date instanceof Date ? line.date.toISOString().split('T')[0] : line.date,
                        daily_total: calculateTotal(line)
                    })),
                    ...destroyedLines
                ]
            };

            const res = isEditing
                ? await updateInvoice(invoiceId, payload)
                : await createInvoice({ ...payload, status: "sent" });

            navigation.reset({
                index: 1,
                routes: [{ name: 'InvoiceList' }, { name: 'InvoiceDetail', params: { invoice: res.data } }],
            });

        } catch (e) {
            Alert.alert("Error saving invoice", e.response?.data?.errors?.join("\n") || e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Line Items</Text>
                    <Text style={styles.totalBadge}>Total: ${invoiceSubtotal.toFixed(2)}</Text>
                </View>

                {lines.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="format-list-bulleted" size={48} color={THEME.muted} />
                        <Text style={styles.emptyText}>No items added yet</Text>
                    </View>
                ) : (
                    lines.map((line, index) => (
                        <View key={index} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>Item #{index + 1}</Text>
                                <View style={{ flexDirection: "row", gap: 16 }}>
                                    <TouchableOpacity onPress={() => openModal(index)}>
                                        <MaterialCommunityIcons name="pencil" size={20} color={THEME.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => removeLine(index)}>
                                        <MaterialCommunityIcons name="close" size={20} color={THEME.muted} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <Text style={styles.cardText}>Date: {new Date(line.date).toLocaleDateString()}</Text>
                            <Text style={styles.cardTotal}>Daily Total: ${calculateTotal(line).toFixed(2)}</Text>
                        </View>
                    ))
                )}

                {(defaultDayRate || defaultOfficeRate) && (
                    <View style={styles.quickAddSection}>
                        <Text style={styles.quickAddLabel}>Quick Add</Text>
                        <View style={styles.quickAddRow}>
                            {defaultDayRate ? (
                                <TouchableOpacity style={styles.quickAddBtn} onPress={addDayRateLine}>
                                    <MaterialCommunityIcons name="briefcase-clock" size={18} color={THEME.primary} />
                                    <Text style={styles.quickAddBtnText}>Day Rate{"\n"}${defaultDayRate}</Text>
                                </TouchableOpacity>
                            ) : null}
                            {defaultOfficeRate ? (
                                <TouchableOpacity style={styles.quickAddBtn} onPress={addOfficeHoursLine}>
                                    <MaterialCommunityIcons name="office-building" size={18} color={THEME.primary} />
                                    <Text style={styles.quickAddBtnText}>Office Hours{"\n"}${defaultOfficeRate}/hr</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>
                )}

                <TouchableOpacity style={styles.outlineBtn} onPress={() => openModal()}>
                    <MaterialCommunityIcons name="plus" size={20} color={THEME.primary} />
                    <Text style={styles.outlineBtnText}>Add Manual Item</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.outlineBtn, { marginTop: 12 }]}
                    onPress={openImportModal}
                    disabled={importLoading}
                >
                    {importLoading ? <ActivityIndicator size="small" color={THEME.primary} /> : (
                        <>
                            <MaterialCommunityIcons name="receipt" size={20} color={THEME.primary} />
                            <Text style={styles.outlineBtnText}>Import from Expenses/Mileage</Text>
                        </>
                    )}
                </TouchableOpacity>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : (
                        <>
                            <Text style={styles.generateBtnText}>{isEditing ? "Save Changes" : "Generate Invoice"}</Text>
                            <MaterialCommunityIcons name="file-pdf-box" size={24} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {modalVisible && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingIndex !== null ? "Edit Line" : "New Line"}</Text>
                        <ScrollView style={{ paddingHorizontal: 16 }}>
                            {/* Date editing intentionally minimal for now */}
                            <Text style={styles.label}>Date</Text>
                            {Platform.OS === 'web' ? (
                                <input
                                    type="date"
                                    value={form.date.toISOString().split('T')[0]}
                                    onChange={(e) => setForm(prev => ({ ...prev, date: new Date(e.target.value) }))}
                                    style={styles.webDateInput}
                                />
                            ) : (
                                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                                    <Text style={styles.dateText}>{form.date.toLocaleDateString()}</Text>
                                </TouchableOpacity>
                            )}

                            {showDatePicker && Platform.OS !== 'web' && (
                                <DateTimePicker
                                    value={form.date || new Date()}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) setForm(prev => ({ ...prev, date: selectedDate }));
                                    }}
                                />
                            )}



                            <Text style={styles.label}>Day Rate{defaultDayRate && editingIndex === null ? ` (default: $${defaultDayRate})` : ""}</Text>
                            <TextInput style={styles.input} value={String(form.day_rate)} onChangeText={(v) => setForm(f => ({ ...f, day_rate: v.replace(/[^0-9.]/g, "") }))} keyboardType="decimal-pad" placeholder={defaultDayRate || "0.00"} placeholderTextColor={THEME.muted} />

                            <Text style={styles.label}>Field Expenses</Text>
                            <TextInput style={styles.input} value={String(form.field_expenses)} onChangeText={(v) => setForm(f => ({ ...f, field_expenses: v.replace(/[^0-9.]/g, "") }))} keyboardType="decimal-pad" />

                            <Text style={styles.label}>Office / Meeting{defaultOfficeRate ? ` ($${defaultOfficeRate}/hr)` : " ($/Hr)"}</Text>
                            <TextInput style={styles.input} value={String(form.office_meeting)} onChangeText={(v) => setForm(f => ({ ...f, office_meeting: v.replace(/[^0-9.]/g, "") }))} keyboardType="decimal-pad" />

                            <Text style={styles.label}>Other Expenses</Text>
                            <TextInput style={styles.input} value={String(form.other_expenses)} onChangeText={(v) => setForm(f => ({ ...f, other_expenses: v.replace(/[^0-9.]/g, "") }))} keyboardType="decimal-pad" />

                            <Text style={styles.label}>Vehicle Mileage ($)</Text>
                            <TextInput style={styles.input} value={String(form.vehicle_mileage)} onChangeText={(v) => setForm(f => ({ ...f, vehicle_mileage: v.replace(/[^0-9.]/g, "") }))} keyboardType="decimal-pad" />

                            <Text style={styles.label}>Rotation Mileage ($)</Text>
                            <TextInput style={styles.input} value={String(form.rotation_mileage)} onChangeText={(v) => setForm(f => ({ ...f, rotation_mileage: v.replace(/[^0-9.]/g, "") }))} keyboardType="decimal-pad" />
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalVisible(false)}><Text style={styles.modalBtnCancelText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.modalBtnSave} onPress={saveLine}><Text style={styles.modalBtnSaveText}>Save</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {officeHoursModalVisible && (
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: "auto" }]}>
                        <Text style={styles.modalTitle}>Office Hours</Text>
                        <View style={{ paddingHorizontal: 16 }}>
                            <Text style={styles.label}>Rate: ${defaultOfficeRate}/hr</Text>
                            <Text style={styles.label}>Hours Worked</Text>
                            <TextInput
                                style={styles.input}
                                value={officeHours}
                                onChangeText={(v) => setOfficeHours(v.replace(/[^0-9.]/g, ""))}
                                keyboardType="decimal-pad"
                                placeholder="e.g. 4"
                                placeholderTextColor={THEME.muted}
                                autoFocus
                            />
                            {officeHours ? (
                                <Text style={[styles.label, { color: THEME.primary, marginTop: 8 }]}>
                                    Total: ${(parseFloat(officeHours) * parseFloat(defaultOfficeRate)).toFixed(2)}
                                </Text>
                            ) : null}
                        </View>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setOfficeHoursModalVisible(false)}>
                                <Text style={styles.modalBtnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalBtnSave} onPress={confirmOfficeHours}>
                                <Text style={styles.modalBtnSaveText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {importModalVisible && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Import Items</Text>
                        <Text style={styles.importInfo}>
                            Found {availableItems.length} items within the billing period ({String(invoiceData.billing_period_start)} to {String(invoiceData.billing_period_end)})
                        </Text>
                        <ScrollView style={{ paddingHorizontal: 16 }}>
                            {availableItems.length === 0 ? (
                                <Text style={styles.emptyText}>No expenses or mileage logs found for this period.</Text>
                            ) : availableItems.map((item, idx) => (
                                <TouchableOpacity key={idx} style={styles.importItem} onPress={() => handleImport(item)}>
                                    <View style={styles.importRow}>
                                        <MaterialCommunityIcons
                                            name={item.type === 'expense' ? "receipt" : "car"}
                                            size={24}
                                            color={THEME.primary}
                                        />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.importItemTitle}>{item.title}</Text>
                                            <Text style={styles.importItemDate}>{item.date}</Text>
                                        </View>
                                        <Text style={styles.importItemAmount}>${parseFloat(item.amount).toFixed(2)}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setImportModalVisible(false)}>
                                <Text style={styles.modalBtnCancelText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    content: { padding: 20, paddingBottom: 100 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    title: { fontSize: 24, fontWeight: "700", color: THEME.text },
    totalBadge: { backgroundColor: THEME.primary, color: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, fontWeight: "600", fontSize: 16 },
    emptyState: { alignItems: "center", marginVertical: 40, gap: 12 },
    emptyText: { color: THEME.muted, fontSize: 16 },
    card: { backgroundColor: THEME.card, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: THEME.border },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    cardTitle: { fontWeight: "600", fontSize: 16, color: THEME.text },
    cardText: { color: THEME.muted, marginBottom: 4 },
    cardTotal: { fontWeight: "700", color: THEME.primary, marginTop: 4 },
    quickAddSection: { marginTop: 20, marginBottom: 4 },
    quickAddLabel: { color: THEME.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
    quickAddRow: { flexDirection: "row", gap: 12 },
    quickAddBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: THEME.primary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: THEME.card },
    quickAddBtnText: { color: THEME.primary, fontWeight: "600", fontSize: 13, flex: 1 },
    outlineBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: THEME.primary, borderRadius: 8, paddingVertical: 14, gap: 8, marginTop: 20 },
    outlineBtnText: { color: THEME.primary, fontWeight: "600", fontSize: 16 },
    footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: THEME.card, padding: 20, borderTopWidth: 1, borderColor: THEME.border },
    generateBtn: { backgroundColor: THEME.primary, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 16, borderRadius: 8 },
    generateBtnText: { color: "#fff", fontWeight: "700", fontSize: 18 },
    modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center" },
    modalContent: { backgroundColor: THEME.card, margin: 20, borderRadius: 12, paddingVertical: 20, maxHeight: "80%" },
    modalTitle: { fontSize: 20, fontWeight: "700", color: THEME.text, paddingHorizontal: 20, marginBottom: 12 },
    label: { color: THEME.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: THEME.bg, color: THEME.text, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, borderWidth: 1, borderColor: THEME.border },
    dateBtn: { borderWidth: 1, borderColor: THEME.border, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: THEME.bg },
    dateText: { fontSize: 16, color: THEME.text },
    modalFooter: { flexDirection: "row", paddingHorizontal: 20, marginTop: 20, gap: 12 },
    modalBtnCancel: { flex: 1, borderWidth: 1, borderColor: THEME.border, borderRadius: 8, alignItems: "center", paddingVertical: 14 },
    modalBtnCancelText: { color: THEME.text, fontWeight: "600", fontSize: 16 },
    modalBtnSave: { flex: 1, backgroundColor: THEME.primary, borderRadius: 8, alignItems: "center", paddingVertical: 14 },
    modalBtnSaveText: { color: "#fff", fontWeight: "600", fontSize: 16 },
    webDateInput: { display: "block", width: "100%", boxSizing: "border-box", padding: "12px", fontSize: "16px", borderRadius: "6px", border: "1px solid #D1D5DB", outline: "none", marginBottom: "8px", backgroundColor: "#fff", color: "#1D1D1D", fontFamily: "inherit" },
    importInfo: { paddingHorizontal: 20, color: THEME.muted, fontSize: 13, marginBottom: 12 },
    importItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: THEME.border },
    importRow: { flexDirection: "row", alignItems: "center" },
    importItemTitle: { fontWeight: "600", color: THEME.text, fontSize: 15 },
    importItemDate: { color: THEME.muted, fontSize: 13 },
    importItemAmount: { fontWeight: "700", color: THEME.primary, fontSize: 15 }
});
