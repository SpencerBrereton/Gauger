import React, { useEffect, useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    FlatList, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getCategories, createCategory, deleteCategory } from "../api/categories";

import { THEME } from "../theme";

export default function CategoryListScreen() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [saving, setSaving] = useState(false);

    const loadCategories = async () => {
        try {
            const { data } = await getCategories();
            setCategories(data);
        } catch (e) {
            Alert.alert("Error", "Failed to load categories.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCategories(); }, []);

    const handleAdd = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        try {
            const { data } = await createCategory({ name: newName.trim() });
            setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)));
            setNewName("");
        } catch (e) {
            Alert.alert("Error", e.response?.data?.errors?.join("\n") || "Failed to create category.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (id, name) => {
        Alert.alert(
            "Delete Category",
            `Are you sure you want to delete "${name}"? Expenses in this category will be moved to "No Category".`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", style: "destructive", onPress: async () => {
                        try {
                            await deleteCategory(id);
                            setCategories(categories.filter(c => c.id !== id));
                        } catch (e) {
                            Alert.alert("Error", "Failed to delete category.");
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}><ActivityIndicator color={THEME.primary} size="large" /></View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.addSection}>
                <TextInput
                    style={styles.input}
                    value={newName}
                    onChangeText={setNewName}
                />
                <TouchableOpacity
                    style={[styles.addBtn, !newName.trim() && styles.disabledBtn]}
                    onPress={handleAdd}
                    disabled={saving || !newName.trim()}
                >
                    {saving ? <ActivityIndicator color="#fff" /> : <MaterialCommunityIcons name="plus" size={24} color="#fff" />}
                </TouchableOpacity>
            </View>

            <FlatList
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}>
                            <MaterialCommunityIcons name="delete-outline" size={20} color={THEME.danger} />
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={
                    <Text style={styles.empty}>No custom categories yet. Add one above!</Text>
                }
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    center: { flex: 1, backgroundColor: THEME.bg, justifyContent: "center", alignItems: "center" },
    addSection: { flexDirection: "row", padding: 20, gap: 10, borderBottomWidth: 1, borderBottomColor: THEME.border, backgroundColor: THEME.card },
    input: { flex: 1, backgroundColor: THEME.input, color: THEME.text, borderRadius: 4, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, borderWidth: 1, borderColor: THEME.border },
    addBtn: { backgroundColor: THEME.primary, width: 48, height: 48, borderRadius: 4, justifyContent: "center", alignItems: "center" },
    disabledBtn: { opacity: 0.5 },
    list: { padding: 20 },
    item: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: THEME.card, borderRadius: 4, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: THEME.border },
    itemName: { color: THEME.text, fontSize: 16, fontWeight: "500" },
    empty: { color: THEME.muted, textAlign: "center", marginTop: 40, fontSize: 14 },
});
