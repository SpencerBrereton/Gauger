import React, { useState, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator, Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createMileageLog, updateMileageLog } from "../api/mileageLogs";
import { uploadGasReceipt, extractGasReceiptData } from "../api/gasReceipts";
import { getVehicles } from "../api/vehicles";
import ReceiptThumbnail from "../components/ReceiptThumbnail";
import FullscreenViewer from "../components/FullscreenViewer";
import { BASE_URL } from "../api/client";

import { THEME } from "../theme";

const Field = ({ label, children }) => (
    <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>
);

export default function MileageLogFormScreen({ navigation, route }) {
    const existingLog = route.params?.mileageLog;
    const isEditing = !!existingLog;
    const [locked, setLocked] = useState(isEditing);
    const [form, setForm] = useState({
        date: new Date().toISOString().split("T")[0],
        current_odometer: "",
        destination: "",
        purpose: "",
        gasoline_litres: "",
        subtotal: "",
        tax: "",
        total_cost: "",
        vehicle_id: null
    });

    const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const [vehicles, setVehicles] = useState([]);
    const [loadingVehicles, setLoadingVehicles] = useState(true);
    const [receipt, setReceipt] = useState(null);
    const [viewerVisible, setViewerVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    useEffect(() => {
        if (existingLog) {
            setForm({
                date: existingLog.date || new Date().toISOString().split("T")[0],
                current_odometer: existingLog.current_odometer ? String(existingLog.current_odometer) : "",
                destination: existingLog.destination || "",
                purpose: existingLog.purpose || "",
                gasoline_litres: existingLog.gasoline_litres ? String(existingLog.gasoline_litres) : "",
                subtotal: existingLog.subtotal ? String(existingLog.subtotal) : "",
                tax: existingLog.tax ? String(existingLog.tax) : "",
                total_cost: existingLog.total_cost ? String(existingLog.total_cost) : "",
                vehicle_id: existingLog.vehicle_id
            });
            if (existingLog.gas_receipt_url) {
                setReceipt({ uri: `${BASE_URL}${existingLog.gas_receipt_url}` });
            }
        }
    }, [existingLog]);

    useEffect(() => {
        const loadVehicles = async () => {
            try {
                const { data } = await getVehicles();
                setVehicles(data);
                if (data.length > 0 && !form.vehicle_id) {
                    update("vehicle_id", data[0].id);
                }
            } catch (e) {
                console.log("Error loading vehicles:", e);
            } finally {
                setLoadingVehicles(false);
            }
        };
        loadVehicles();
    }, []);

    const handleReceiptSelection = async (img) => {
        setReceipt(img);
        setExtracting(true);
        try {
            const { data } = await extractGasReceiptData({ uri: img.uri, name: "receipt.jpg", type: "image/jpeg" });
            if (data) {
                if (data.date) update("date", data.date);
                if (data.gasoline_litres != null) update("gasoline_litres", data.gasoline_litres.toString());
                if (data.subtotal != null) update("subtotal", data.subtotal.toString());
                if (data.tax != null) update("tax", data.tax.toString());
                if (data.total_cost != null) update("total_cost", data.total_cost.toString());
            }
        } catch (e) {
            console.log("Extraction error:", e);
            Alert.alert("Auto-Extract Failed", "Could not interpret receipt fully. Please fill manually.");
        } finally {
            setExtracting(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") { Alert.alert("Permission needed", "Allow photo library access."); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
        if (!result.canceled) handleReceiptSelection(result.assets[0]);
    };

    const openCamera = async () => {
        if (Platform.OS === "web") { Alert.alert("Camera not available on web", "Use the photo picker instead."); return; }
        navigation.navigate("ReceiptCamera", { onCapture: (img) => handleReceiptSelection(img) });
    };

    const handleSave = async () => {
        if (!form.date) { Alert.alert("Validation", "Date is required."); return; }
        if (!form.vehicle_id) { Alert.alert("Validation", "Please select a vehicle."); return; }
        setSaving(true);
        try {
            const body = {
                ...form,
                current_odometer: form.current_odometer ? parseInt(form.current_odometer, 10) : null,
                gasoline_litres: form.gasoline_litres ? parseFloat(form.gasoline_litres) : null,
                subtotal: form.subtotal ? parseFloat(form.subtotal) : null,
                tax: form.tax ? parseFloat(form.tax) : null,
                total_cost: form.total_cost ? parseFloat(form.total_cost) : null
            };

            let response;
            if (isEditing) {
                response = await updateMileageLog(existingLog.id, body);
            } else {
                response = await createMileageLog(body);
            }

            const mileageLog = response.data;
            if (receipt && receipt.uri && !receipt.uri.startsWith("http")) {
                await uploadGasReceipt(mileageLog.id, { uri: receipt.uri, name: "receipt.jpg", type: "image/jpeg" });
            }
            navigation.goBack();
        } catch (e) {
            Alert.alert("Error", e.response?.data?.errors?.join("\n") || "Failed to save mileage log.");
        }
        setSaving(false);
    };


    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {isEditing && locked && (
                <TouchableOpacity style={styles.unlockBtn} onPress={() => setLocked(false)}>
                    <MaterialCommunityIcons name="pencil-lock" size={20} color={THEME.primary} />
                    <Text style={styles.unlockBtnText}>Unlock for Editing</Text>
                </TouchableOpacity>
            )}

            <Field label="Date *">
                {Platform.OS === 'web' ? (
                    <input
                        type="date"
                        value={form.date}
                        onChange={(e) => update("date", e.target.value)}
                        style={styles.webDateInput}
                        disabled={locked}
                    />
                ) : (
                    <TouchableOpacity
                        style={[styles.input, locked && styles.inputLocked]}
                        onPress={() => !locked && setShowDatePicker(true)}
                        disabled={locked}
                    >
                        <Text style={{ color: locked ? THEME.muted : THEME.text }}>{form.date}</Text>
                    </TouchableOpacity>
                )}
            </Field>

            {showDatePicker && Platform.OS !== 'web' && (
                <DateTimePicker
                    value={new Date(form.date + "T00:00:00")}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                            update("date", selectedDate.toISOString().split("T")[0]);
                        }
                    }}
                />
            )}

            <Field label="Vehicle *">
                {loadingVehicles ? (
                    <ActivityIndicator size="small" color={THEME.primary} />
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                        {vehicles.map((v) => (
                            <TouchableOpacity
                                key={v.id}
                                style={[styles.chip, form.vehicle_id === v.id && styles.chipActive, locked && styles.chipLocked]}
                                onPress={() => !locked && update("vehicle_id", v.id)}
                                disabled={locked}
                            >
                                <Text style={[styles.chipText, form.vehicle_id === v.id && styles.chipTextActive]}>
                                    {v.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {vehicles.length === 0 && (
                            <Text style={styles.chipText}>No vehicles. Add one from the Dashboard.</Text>
                        )}
                    </ScrollView>
                )}
            </Field>

            <Field label="Destination">
                <TextInput style={[styles.input, locked && styles.inputLocked]} value={form.destination} onChangeText={(v) => update("destination", v)} editable={!locked} />
            </Field>

            <Field label="Current Odometer (Miles/Km)">
                <TextInput
                    style={[styles.input, locked && styles.inputLocked]}
                    value={form.current_odometer}
                    onChangeText={(v) => update("current_odometer", v.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    editable={!locked}
                />
            </Field>

            <Field label="Purpose">
                <TextInput style={[styles.input, locked && styles.inputLocked]} value={form.purpose} onChangeText={(v) => update("purpose", v)} editable={!locked} />
            </Field>

            <View style={styles.row}>
                <View style={styles.flexHalf}>
                    <Field label="Gas (Litres)">
                        <TextInput style={[styles.input, locked && styles.inputLocked]} value={form.gasoline_litres} onChangeText={(v) => update("gasoline_litres", v.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" editable={!locked} />
                    </Field>
                </View>
                <View style={styles.spacing} />
                <View style={styles.flexHalf}>
                    <Field label="Subtotal ($)">
                        <TextInput style={[styles.input, locked && styles.inputLocked]} value={form.subtotal} onChangeText={(v) => update("subtotal", v.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" editable={!locked} />
                    </Field>
                </View>
            </View>

            <View style={styles.row}>
                <View style={styles.flexHalf}>
                    <Field label="Tax ($)">
                        <TextInput style={[styles.input, locked && styles.inputLocked]} value={form.tax} onChangeText={(v) => update("tax", v.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" editable={!locked} />
                    </Field>
                </View>
                <View style={styles.spacing} />
                <View style={styles.flexHalf}>
                    <Field label="Total Cost ($)">
                        <TextInput style={[styles.input, locked && styles.inputLocked]} value={form.total_cost} onChangeText={(v) => update("total_cost", v.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" editable={!locked} />
                    </Field>
                </View>
            </View>

            <Field label="Gas Receipt">
                <Text style={styles.warningText}>Note: The most recent image upload will autopopulate the form.</Text>
                {receipt ? (
                    <View>
                        <ReceiptThumbnail uri={receipt.uri} onRemove={locked ? null : () => setReceipt(null)} onView={() => setViewerVisible(true)} />
                        {extracting && (
                            <View style={styles.extractingOverlay}>
                                <ActivityIndicator color={THEME.primary} style={{ marginRight: 8 }} />
                                <Text style={styles.extractingText}>Extracting receipt data...</Text>
                            </View>
                        )}
                        <FullscreenViewer visible={viewerVisible} uri={receipt.uri} onClose={() => setViewerVisible(false)} />
                    </View>
                ) : !locked && (
                    <View style={styles.receiptBtns}>
                        <TouchableOpacity style={styles.receiptBtn} onPress={openCamera}><Text style={styles.receiptBtnText}>📷 Camera</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.receiptBtn} onPress={pickImage}><Text style={styles.receiptBtnText}>🖼 Gallery</Text></TouchableOpacity>
                    </View>
                )}
            </Field>

            {!locked && (
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} testID="mileage-form-save-button">
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{isEditing ? "Update Log" : "Save Log"}</Text>}
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    content: { padding: 24, paddingBottom: 48 },
    field: { marginBottom: 20 },
    label: { color: THEME.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
    input: { backgroundColor: THEME.input, color: THEME.text, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, borderWidth: 1, borderColor: THEME.border },
    chips: { flexDirection: "row" },
    chip: { backgroundColor: THEME.card, borderRadius: 4, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: THEME.border },
    chipActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
    chipText: { color: THEME.muted, fontSize: 13 },
    chipTextActive: { color: "#fff", fontWeight: "600" },
    receiptBtns: { flexDirection: "row", gap: 10 },
    receiptBtn: { flex: 1, backgroundColor: THEME.card, borderRadius: 4, padding: 14, alignItems: "center", borderWidth: 1, borderColor: THEME.border, borderStyle: "dashed" },
    receiptBtnText: { color: THEME.muted, fontSize: 14 },
    saveBtn: { backgroundColor: THEME.primary, borderRadius: 4, paddingVertical: 14, alignItems: "center", marginTop: 24 },
    saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
    row: { flexDirection: "row", justifyContent: "space-between" },
    flexHalf: { flex: 1 },
    spacing: { width: 12 },
    extractingOverlay: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7", padding: 12, borderRadius: 6, marginTop: 12, borderWidth: 1, borderColor: "#FDE68A" },
    extractingText: { color: "#92400E", fontSize: 13, fontWeight: "600" },
    warningText: { color: THEME.muted, fontSize: 13, fontStyle: "italic", marginBottom: 8 },
    unlockBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF7ED", padding: 12, borderRadius: 4, marginBottom: 20, borderWidth: 1, borderColor: "#FED7AA", gap: 8 },
    unlockBtnText: { color: THEME.primary, fontWeight: "600", fontSize: 14 },
    inputLocked: { backgroundColor: "#F9FAFB", color: THEME.muted, borderColor: "#E5E7EB" },
    chipLocked: { opacity: 0.5 },
    webDateInput: { display: "block", width: "100%", boxSizing: "border-box", padding: "12px", fontSize: "16px", borderRadius: "4px", border: "1px solid #E5E7EB", outline: "none", marginBottom: "8px", backgroundColor: "#fff", color: "#1D1D1D", fontFamily: "inherit" },
});
