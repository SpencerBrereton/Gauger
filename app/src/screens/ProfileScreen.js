import React, { useState, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator, Image, Platform
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { getUserProfile, updateUserProfile } from "../api/userProfiles";
import useAuthStore from "../store/authStore";
import storage from "../utils/storage";
import { BASE_URL } from "../api/client";

import { THEME } from "../theme";

const Field = ({ label, children }) => (
    <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        {children}
    </View>
);

export default function ProfileScreen({ navigation }) {
    const { signOut } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoLocalUri, setLogoLocalUri] = useState(null);
    const [form, setForm] = useState({
        company_name: "",
        company_address: "",
        phone: "",
        user_name: "",
        gst_number: "",
        wcb_number: "",
        default_day_rate: "",
        default_office_rate: "",
        logo_url: null,
        new_logo: null
    });

    const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const { data } = await getUserProfile();
            if (data) {
                setForm({
                    company_name: data.company_name || "",
                    company_address: data.company_address || "",
                    phone: data.phone || "",
                    user_name: data.user_name || "",
                    gst_number: data.gst_number || "",
                    wcb_number: data.wcb_number || "",
                    default_day_rate: data.default_day_rate ? String(data.default_day_rate) : "",
                    default_office_rate: data.default_office_rate ? String(data.default_office_rate) : "",
                    logo_url: data.logo_url || null,
                    new_logo: null
                });
                if (data.logo_url && Platform.OS !== 'web') {
                    downloadLogo();
                }
            }
        } catch (e) {
            console.log("Error loading profile", e);
        } finally {
            setLoading(false);
        }
    };

    const downloadLogo = async () => {
        try {
            const token = await storage.getToken();
            const url = `${BASE_URL}/api/v1/user_profile/logo`;
            console.log('[Logo] BASE_URL:', BASE_URL);
            console.log('[Logo] Downloading from:', url);
            console.log('[Logo] Token present:', !!token);
            const dest = FileSystem.cacheDirectory + 'profile_logo.png';
            const existing = await FileSystem.getInfoAsync(dest);
            if (existing.exists) {
                await FileSystem.deleteAsync(dest, { idempotent: true });
            }
            const result = await FileSystem.downloadAsync(
                url,
                dest,
                token ? { headers: { Authorization: `Bearer ${token}` } } : {}
            );
            console.log('[Logo] Download result status:', result.status);
            console.log('[Logo] Download result uri:', result.uri);
            if (result.status === 200) {
                setLogoLocalUri(result.uri);
            } else {
                console.warn('[Logo] Non-200 status:', result.status);
            }
        } catch (e) {
            console.warn('[Logo] Download error:', e.message, e);
        }
    };

    const handlePickLogo = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission to access gallery is required!");
            return;
        }

        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
            setForm({ ...form, new_logo: pickerResult.assets[0] });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let payload;

            if (form.new_logo) {
                payload = new FormData();
                payload.append('user_profile[company_name]', form.company_name);
                payload.append('user_profile[company_address]', form.company_address);
                payload.append('user_profile[phone]', form.phone);
                payload.append('user_profile[user_name]', form.user_name);
                payload.append('user_profile[gst_number]', form.gst_number);
                payload.append('user_profile[wcb_number]', form.wcb_number);
                if (form.default_day_rate) payload.append('user_profile[default_day_rate]', parseFloat(form.default_day_rate));
                if (form.default_office_rate) payload.append('user_profile[default_office_rate]', parseFloat(form.default_office_rate));

                if (Platform.OS === 'web') {
                    const res = await fetch(form.new_logo.uri);
                    const blob = await res.blob();
                    payload.append('user_profile[logo]', blob, 'logo.jpg');
                } else {
                    payload.append('user_profile[logo]', {
                        uri: form.new_logo.uri,
                        type: 'image/jpeg',
                        name: 'logo.jpg',
                    });
                }
            } else {
                payload = {
                    ...form,
                    default_day_rate: form.default_day_rate ? parseFloat(form.default_day_rate) : null,
                    default_office_rate: form.default_office_rate ? parseFloat(form.default_office_rate) : null
                };
            }

            const { data } = await updateUserProfile(payload);
            setForm((prev) => ({ ...prev, new_logo: null, logo_url: data.logo_url || prev.logo_url }));
            if (form.new_logo && Platform.OS !== 'web') {
                setLogoLocalUri(null);
                downloadLogo();
            }
            Alert.alert("Success", "Profile settings saved.");
        } catch (e) {
            console.log(e);
            Alert.alert("Error", e.response?.data?.errors?.join("\n") || "Failed to save profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: signOut }
            ]
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator color={THEME.primary} size="large" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.headerTitle}>Invoice Defaults</Text>
            <Text style={styles.subtitle}>These details will appear on your generated PDF invoices.</Text>

            <View style={styles.section}>
                <Field label="Company Logo">
                    <View style={styles.logoRow}>
                        <TouchableOpacity style={styles.logoPicker} onPress={handlePickLogo}>
                            {form.new_logo ? (
                                <Image source={{ uri: form.new_logo.uri }} style={styles.logoImage} />
                            ) : logoLocalUri || form.logo_url ? (
                                <Image source={{ uri: logoLocalUri || form.logo_url }} style={styles.logoImage} />
                            ) : (
                                <View style={styles.logoPlaceholder}>
                                    <Text style={styles.logoPlaceholderText}>Select Logo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.logoHint}>Tap to upload a square logo (e.g. 500x500).</Text>
                    </View>
                </Field>
                <Field label="Company Name">
                    <TextInput style={styles.input} value={form.company_name} onChangeText={(v) => update("company_name", v)} />
                </Field>
                <Field label="Company Address">
                    <TextInput style={[styles.input, styles.textarea]} value={form.company_address} onChangeText={(v) => update("company_address", v)} multiline numberOfLines={2} />
                </Field>
                <Field label="Phone Number">
                    <TextInput style={styles.input} value={form.phone} onChangeText={(v) => update("phone", v)} keyboardType="phone-pad" />
                </Field>
                <Field label="Your Name">
                    <TextInput style={styles.input} value={form.user_name} onChangeText={(v) => update("user_name", v)} />
                </Field>
            </View>

            <View style={styles.section}>
                <Field label="GST / Tax Number">
                    <TextInput style={styles.input} value={form.gst_number} onChangeText={(v) => update("gst_number", v)} />
                </Field>
                <Field label="WCB / Insurance Number">
                    <TextInput style={styles.input} value={form.wcb_number} onChangeText={(v) => update("wcb_number", v)} />
                </Field>
            </View>

            <View style={styles.section}>
                <View style={styles.row}>
                    <View style={styles.flexHalf}>
                        <Field label="Default Day Rate ($)">
                            <TextInput style={styles.input} value={form.default_day_rate} onChangeText={(v) => update("default_day_rate", v.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" />
                        </Field>
                    </View>
                    <View style={styles.spacing} />
                    <View style={styles.flexHalf}>
                        <Field label="Office Rate ($/Hr)">
                            <TextInput style={styles.input} value={form.default_office_rate} onChangeText={(v) => update("default_office_rate", v.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" />
                        </Field>
                    </View>
                </View>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Settings</Text>}
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    center: { justifyContent: "center", alignItems: "center" },
    content: { padding: 20, paddingBottom: 40 },
    headerTitle: { fontSize: 24, fontWeight: "700", color: THEME.text, marginBottom: 4 },
    subtitle: { fontSize: 14, color: THEME.muted, marginBottom: 24 },
    section: { backgroundColor: THEME.card, padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: THEME.border },
    field: { marginBottom: 16 },
    label: { color: THEME.muted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
    input: { backgroundColor: THEME.input, color: THEME.text, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, borderWidth: 1, borderColor: THEME.border },
    textarea: { height: 80, textAlignVertical: "top" },
    row: { flexDirection: "row", justifyContent: "space-between" },
    flexHalf: { flex: 1 },
    spacing: { width: 12 },
    saveBtn: { backgroundColor: THEME.primary, borderRadius: 8, paddingVertical: 16, alignItems: "center", justifyContent: "center" },
    saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    actionRow: { flexDirection: "row", marginTop: 16, gap: 12 },
    logoRow: { flexDirection: "row", alignItems: "center", gap: 16 },
    logoPicker: { width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: THEME.border, borderStyle: "dashed", justifyContent: "center", alignItems: "center", overflow: "hidden", backgroundColor: THEME.input },
    logoPlaceholder: { justifyContent: "center", alignItems: "center", padding: 10 },
    logoPlaceholderText: { fontSize: 10, color: THEME.muted, textAlign: "center", fontWeight: "600" },
    logoImage: { width: "100%", height: "100%", resizeMode: "cover" },
    logoHint: { flex: 1, fontSize: 12, color: THEME.muted },
    logoutBtn: { marginTop: 40, borderTopWidth: 1, borderTopColor: THEME.border, paddingTop: 20, alignItems: "center" },
    logoutBtnText: { color: THEME.error || "#DC2626", fontSize: 16, fontWeight: "600" }
});
