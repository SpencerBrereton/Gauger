import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { createClient, updateClient, deleteClient } from "../api/clients";

import { THEME } from "../theme";

const Field = ({ label, children }) => (
    <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>
);

export default function ClientFormScreen({ navigation, route }) {
    const existingClient = route.params?.client;
    const isEditing = !!existingClient;

    const [form, setForm] = useState({
        name: existingClient?.name || "",
        address: existingClient?.address || "",
        default_project_manager: existingClient?.default_project_manager || "",
        default_project_name: existingClient?.default_project_name || "",
        default_purchase_order: existingClient?.default_purchase_order || "",
        default_wbs_code: existingClient?.default_wbs_code || ""
    });

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const handleSave = async () => {
        if (!form.name) {
            Alert.alert("Validation", "Client Name is required.");
            return;
        }

        setSaving(true);
        try {
            if (isEditing) {
                await updateClient(existingClient.id, form);
            } else {
                await createClient(form);
            }
            navigation.goBack();
        } catch (e) {
            Alert.alert("Error", e.response?.data?.errors?.join("\n") || "Failed to save client.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert("Delete Client", "Are you sure you want to delete this client? This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: async () => {
                    setDeleting(true);
                    try {
                        await deleteClient(existingClient.id);
                        navigation.goBack();
                    } catch (e) {
                        Alert.alert("Error", "Failed to delete client.");
                        setDeleting(false);
                    }
                }
            }
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Field label="Client Name *">
                <TextInput style={styles.input} value={form.name} onChangeText={(v) => update("name", v)} />
            </Field>

            <Field label="Client Address">
                <TextInput style={[styles.input, styles.textarea]} value={form.address} onChangeText={(v) => update("address", v)} multiline numberOfLines={3} />
            </Field>

            <Field label="Default Project Manager">
                <TextInput style={styles.input} value={form.default_project_manager} onChangeText={(v) => update("default_project_manager", v)} />
            </Field>

            <Field label="Default Project Name">
                <TextInput style={styles.input} value={form.default_project_name} onChangeText={(v) => update("default_project_name", v)} />
            </Field>

            <Field label="Default Purchase Order">
                <TextInput style={styles.input} value={form.default_purchase_order} onChangeText={(v) => update("default_purchase_order", v)} />
            </Field>

            <Field label="Default WBS Code">
                <TextInput style={styles.input} value={form.default_wbs_code} onChangeText={(v) => update("default_wbs_code", v)} />
            </Field>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving || deleting}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{isEditing ? "Update Client" : "Add Client"}</Text>}
            </TouchableOpacity>

            {isEditing && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={saving || deleting}>
                    {deleting ? <ActivityIndicator color={THEME.danger} /> : <Text style={styles.deleteBtnText}>Delete Client</Text>}
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
    input: { backgroundColor: THEME.input, color: THEME.text, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: THEME.border },
    textarea: { height: 80, textAlignVertical: "top" },
    saveBtn: { backgroundColor: THEME.primary, borderRadius: 8, paddingVertical: 16, alignItems: "center", marginTop: 12 },
    saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    deleteBtn: { backgroundColor: "transparent", borderWidth: 1, borderColor: THEME.danger, borderRadius: 8, paddingVertical: 16, alignItems: "center", marginTop: 16 },
    deleteBtnText: { color: THEME.danger, fontSize: 16, fontWeight: "600" }
});
