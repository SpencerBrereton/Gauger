import React, { useState, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator, Platform
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { getClients } from "../api/clients";
import { createInvoice, updateInvoice } from "../api/invoices";

import { THEME } from "../theme";

export default function InvoiceFormScreen({ navigation, route }) {
    const existingInvoice = route.params?.invoice ?? null;
    const isEditing = !!existingInvoice;

    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]);

    const parseDate = (val) => {
        if (!val) return new Date();
        const d = new Date(val);
        return isNaN(d) ? new Date() : d;
    };

    const [form, setForm] = useState(() => {
        if (existingInvoice) {
            return {
                client_id: existingInvoice.client_id ? String(existingInvoice.client_id) : "",
                client_name: existingInvoice.client_name || "",
                invoice_number: existingInvoice.invoice_number || "",
                invoice_date: parseDate(existingInvoice.invoice_date),
                billing_period_start: parseDate(existingInvoice.billing_period_start),
                billing_period_end: parseDate(existingInvoice.billing_period_end),
                due_date: parseDate(existingInvoice.due_date),
                project_name: existingInvoice.project_name || "",
                purchase_order: existingInvoice.purchase_order || "",
                wbs_code: existingInvoice.wbs_code || "",
                project_manager: existingInvoice.project_manager || "",
                lines: existingInvoice.invoice_lines || []
            };
        }
        return {
            client_id: "",
            client_name: "",
            invoice_number: "",
            invoice_date: new Date(),
            billing_period_start: new Date(),
            billing_period_end: new Date(),
            due_date: new Date(new Date().setDate(new Date().getDate() + 30)),
            project_name: "",
            purchase_order: "",
            wbs_code: "",
            project_manager: "",
            lines: []
        };
    });

    const [showDatePicker, setShowDatePicker] = useState({ visible: false, field: null });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await getClients();
            setClients(res.data);
        } catch (e) {
            console.log("Error loading clients", e);
        } finally {
            setLoading(false);
        }
    };

    const onClientChange = (clientId) => {
        const client = clients.find(c => String(c.id) === String(clientId));
        if (client) {
            setForm(f => ({
                ...f,
                client_id: clientId,
                client_name: client.name,
                project_name: client.default_project_name || f.project_name,
                purchase_order: client.default_purchase_order || f.purchase_order,
                wbs_code: client.default_wbs_code || f.wbs_code,
                project_manager: client.default_project_manager || f.project_manager
            }));
        } else {
            setForm(f => ({ ...f, client_id: clientId, client_name: "" }));
        }
    };

    const nextStep = () => {
        if (!form.client_id) return Alert.alert("Required", "Please select a client.");
        if (!form.invoice_number) return Alert.alert("Required", "Please enter an invoice number.");

        let finalForm = { ...form };
        if (!finalForm.client_name && finalForm.client_id) {
            const client = clients.find(c => String(c.id) === String(finalForm.client_id));
            if (client) finalForm.client_name = client.name;
        }

        const serializedForm = {
            ...finalForm,
            invoice_date: finalForm.invoice_date.toISOString().split('T')[0],
            billing_period_start: finalForm.billing_period_start.toISOString().split('T')[0],
            billing_period_end: finalForm.billing_period_end.toISOString().split('T')[0],
            due_date: finalForm.due_date.toISOString().split('T')[0],
            ...(isEditing && { invoiceId: existingInvoice.id })
        };

        navigation.navigate("InvoiceLines", { invoiceData: serializedForm });
    };

    const handleDateChange = (event, selectedDate) => {
        const field = showDatePicker.field;
        setShowDatePicker({ visible: false, field: null });
        if (selectedDate && field) {
            setForm((prev) => ({ ...prev, [field]: selectedDate }));
        }
    };

    if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={THEME.primary} /></View>;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.headerTitle}>{isEditing ? "Edit Invoice" : "Invoice Info"}</Text>

            <View style={styles.section}>
                <Text style={styles.label}>Select Client *</Text>
                {Platform.OS === 'web' ? (
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <select
                            value={form.client_id}
                            onChange={(e) => onClientChange(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px 40px 12px 14px',
                                fontSize: '16px',
                                borderRadius: '6px',
                                border: '1px solid #D1D5DB',
                                outline: 'none',
                                backgroundColor: '#fff',
                                color: form.client_id === "" ? "#6B7280" : "#1D1D1D",
                                appearance: 'none',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center',
                                backgroundSize: '20px'
                            }}
                        >
                            <option value="">Select a client...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                ) : (
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={form.client_id}
                            onValueChange={(val) => onClientChange(val)}
                        >
                            <Picker.Item label="Select a client..." value="" />
                            {clients.map(c => <Picker.Item key={c.id} label={c.name} value={c.id} />)}
                        </Picker>
                    </View>
                )}

                <Text style={styles.label}>Invoice Number *</Text>
                <TextInput
                    style={styles.input}
                    value={form.invoice_number}
                    onChangeText={(val) => setForm(f => ({ ...f, invoice_number: val }))}
                />

                <View style={styles.row}>
                    <View style={styles.flexHalf}>
                        <Text style={styles.label}>Period Start</Text>
                        {Platform.OS === 'web' ? (
                            <input
                                type="date"
                                value={form.billing_period_start.toISOString().split('T')[0]}
                                onChange={(e) => setForm(f => ({ ...f, billing_period_start: new Date(e.target.value) }))}
                                style={styles.webDateInput}
                            />
                        ) : (
                            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker({ visible: true, field: "billing_period_start" })}>
                                <Text style={styles.dateText}>{form.billing_period_start.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={styles.flexHalf}>
                        <Text style={styles.label}>Period End</Text>
                        {Platform.OS === 'web' ? (
                            <input
                                type="date"
                                value={form.billing_period_end.toISOString().split('T')[0]}
                                onChange={(e) => setForm(f => ({ ...f, billing_period_end: new Date(e.target.value) }))}
                                style={styles.webDateInput}
                            />
                        ) : (
                            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker({ visible: true, field: "billing_period_end" })}>
                                <Text style={styles.dateText}>{form.billing_period_end.toLocaleDateString()}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    style={Platform.OS === 'web' ? {} : styles.dateBtn}
                    onPress={() => Platform.OS !== 'web' && setShowDatePicker({ visible: true, field: "invoice_date" })}
                    disabled={Platform.OS === 'web'}
                >
                    <Text style={styles.label}>Invoice Date</Text>
                    {Platform.OS === 'web' ? (
                        <input
                            type="date"
                            value={form.invoice_date.toISOString().split('T')[0]}
                            onChange={(e) => setForm(f => ({ ...f, invoice_date: new Date(e.target.value) }))}
                            style={styles.webDateInput}
                        />
                    ) : (
                        <Text style={styles.dateText}>{form.invoice_date.toLocaleDateString()}</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={Platform.OS === 'web' ? {} : styles.dateBtn}
                    onPress={() => Platform.OS !== 'web' && setShowDatePicker({ visible: true, field: "due_date" })}
                    disabled={Platform.OS === 'web'}
                >
                    <Text style={styles.label}>Due Date</Text>
                    {Platform.OS === 'web' ? (
                        <input
                            type="date"
                            value={form.due_date.toISOString().split('T')[0]}
                            onChange={(e) => setForm(f => ({ ...f, due_date: new Date(e.target.value) }))}
                            style={styles.webDateInput}
                        />
                    ) : (
                        <Text style={styles.dateText}>{form.due_date.toLocaleDateString()}</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Project</Text>
                <TextInput style={styles.input} value={form.project_name} onChangeText={(v) => setForm(f => ({ ...f, project_name: v }))} />

                <Text style={styles.label}>Purchase Order</Text>
                <TextInput style={styles.input} value={form.purchase_order} onChangeText={(v) => setForm(f => ({ ...f, purchase_order: v }))} />

                <Text style={styles.label}>WBS Code</Text>
                <TextInput style={styles.input} value={form.wbs_code} onChangeText={(v) => setForm(f => ({ ...f, wbs_code: v }))} />

                <Text style={styles.label}>Project Manager</Text>
                <TextInput style={styles.input} value={form.project_manager} onChangeText={(v) => setForm(f => ({ ...f, project_manager: v }))} />
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
                <Text style={styles.nextBtnText}>Continue to Line Items</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>

            {showDatePicker.visible && Platform.OS !== 'web' && (
                <DateTimePicker
                    value={form[showDatePicker.field] || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    center: { justifyContent: "center", alignItems: "center" },
    content: { padding: 20, paddingBottom: 40 },
    headerTitle: { fontSize: 24, fontWeight: "700", color: THEME.text, marginBottom: 16 },
    section: { backgroundColor: THEME.card, padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: THEME.border },
    label: { color: THEME.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, marginTop: 8 },
    input: { backgroundColor: THEME.card, color: THEME.text, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: THEME.border },
    pickerContainer: { borderWidth: 1, borderColor: THEME.border, borderRadius: 6, marginBottom: 8, justifyContent: 'center', height: 50 },
    row: { flexDirection: "row", justifyContent: "space-between" },
    dateBtn: { flex: 1, borderWidth: 1, borderColor: THEME.border, borderRadius: 6, padding: 12, marginBottom: 8 },
    dateText: { fontSize: 16, color: THEME.text, marginTop: 4 },
    nextBtn: { backgroundColor: THEME.primary, borderRadius: 8, paddingVertical: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
    nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    flexHalf: { flex: 1 },
    webDateInput: { display: "block", width: "100%", boxSizing: "border-box", padding: "12px", fontSize: "16px", borderRadius: "6px", border: "1px solid #D1D5DB", outline: "none", marginBottom: "8px", backgroundColor: "#fff", color: "#1D1D1D", fontFamily: "inherit" }
});
