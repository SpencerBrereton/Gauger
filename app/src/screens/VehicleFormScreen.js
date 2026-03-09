import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, ActivityIndicator, Image, Platform
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createVehicle, updateVehicle, uploadVehiclePhoto, deleteVehicle } from "../api/vehicles";
import { BASE_URL } from "../api/client";
import { appendFile } from "../utils/formDataUtils";


import { THEME } from "../theme";
const RULESETS = ["personal", "work", "hybrid"];

export default function VehicleFormScreen({ navigation, route }) {
    const existingVehicle = route.params?.vehicle;
    const [name, setName] = useState(existingVehicle?.name || "");
    const [ruleset, setRuleset] = useState(existingVehicle?.ruleset || "personal");
    const [photo, setPhoto] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission needed", "Allow camera roll access to add a photo.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setPhoto(result.assets[0]);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Validation", "Please give your vehicle a name.");
            return;
        }

        setSaving(true);
        try {
            let vehicle;
            if (existingVehicle) {
                const res = await updateVehicle(existingVehicle.id, { name, ruleset });
                vehicle = res.data;

                if (photo) {
                    await uploadVehiclePhoto(vehicle.id, {
                        uri: photo.uri,
                        name: "vehicle.jpg",
                        type: "image/jpeg",
                    });
                }
            } else {
                if (photo) {
                    const formData = new FormData();
                    formData.append("vehicle[name]", name);
                    formData.append("vehicle[ruleset]", ruleset);
                    await appendFile(formData, "photo", {
                        uri: photo.uri,
                        name: "vehicle.jpg",
                        type: "image/jpeg",
                    });
                    const res = await createVehicle(formData, true);

                    vehicle = res.data;
                } else {
                    const res = await createVehicle({ name, ruleset });
                    vehicle = res.data;
                }
            }

            navigation.goBack();
        } catch (e) {
            Alert.alert("Error", "Failed to save vehicle profile.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (Platform.OS === "web") {
            if (window.confirm("Are you sure you want to remove this vehicle?")) {
                setDeleting(true);
                deleteVehicle(existingVehicle.id)
                    .then(() => navigation.goBack())
                    .catch(() => window.alert("Failed to delete vehicle."))
                    .finally(() => setDeleting(false));
            }
        } else {
            Alert.alert(
                "Delete Vehicle",
                "Are you sure you want to remove this vehicle?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                            setDeleting(true);
                            try {
                                await deleteVehicle(existingVehicle.id);
                                navigation.goBack();
                            } catch (e) {
                                Alert.alert("Error", "Failed to delete vehicle.");
                            } finally {
                                setDeleting(false);
                            }
                        }
                    }
                ]
            );
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
                {photo ? (
                    <Image source={{ uri: photo.uri }} style={styles.photo} />
                ) : existingVehicle?.photo_url ? (
                    <Image source={{ uri: `${BASE_URL}${existingVehicle.photo_url}` }} style={styles.photo} />
                ) : (
                    <View style={styles.photoPlaceholder}>
                        <MaterialCommunityIcons name="camera-plus" size={32} color={THEME.primary} />
                        <Text style={styles.photoText}>Add photo</Text>
                    </View>
                )}
            </TouchableOpacity>

            <View style={styles.field}>
                <Text style={styles.label}>Vehicle Name</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                />
            </View>

            <View style={styles.field}>
                <Text style={styles.label}>Ruleset</Text>
                <View style={styles.rulesetContainer}>
                    {RULESETS.map((r) => (
                        <TouchableOpacity
                            key={r}
                            style={[styles.rulesetBtn, ruleset === r && styles.rulesetBtnActive]}
                            onPress={() => setRuleset(r)}
                        >
                            <Text style={[styles.rulesetText, ruleset === r && styles.rulesetTextActive]}>
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={styles.hint}>
                    This ruleset determines how expenses for this vehicle are categorized.
                </Text>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : (
                    <Text style={styles.saveBtnText}>{existingVehicle ? "Update Vehicle" : "Create Vehicle"}</Text>
                )}
            </TouchableOpacity>

            {existingVehicle && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
                    {deleting ? <ActivityIndicator color={THEME.danger} /> : <Text style={styles.deleteBtnText}>Remove Vehicle</Text>}
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    content: { padding: 24, paddingBottom: 48 },
    photoContainer: {
        height: 180,
        backgroundColor: THEME.card,
        borderRadius: 4,
        marginBottom: 24,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: THEME.border,
        borderStyle: "dashed",
        overflow: "hidden"
    },
    photo: { width: "100%", height: "100%" },
    photoPlaceholder: { alignItems: "center" },
    photoText: { color: THEME.primary, fontWeight: "600", marginTop: 8 },
    field: { marginBottom: 24 },
    label: { color: THEME.muted, fontSize: 11, fontWeight: "700", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 },
    input: { backgroundColor: THEME.card, borderRadius: 4, padding: 16, fontSize: 16, borderWidth: 1, borderColor: THEME.border, color: THEME.text },
    rulesetContainer: { flexDirection: "row", gap: 10, marginTop: 4 },
    rulesetBtn: { flex: 1, paddingVertical: 12, alignItems: "center", backgroundColor: THEME.card, borderRadius: 4, borderWidth: 1, borderColor: THEME.border },
    rulesetBtnActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
    rulesetText: { color: THEME.text, fontWeight: "600" },
    rulesetTextActive: { color: "#fff" },
    hint: { color: THEME.muted, fontSize: 12, marginTop: 12, fontStyle: "italic" },
    saveBtn: { backgroundColor: THEME.primary, borderRadius: 4, paddingVertical: 16, alignItems: "center", marginTop: 12, elevation: 2 },
    saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
    deleteBtn: { marginTop: 20, paddingVertical: 12, alignItems: "center" },
    deleteBtnText: { color: THEME.danger, fontWeight: "600" },
});
