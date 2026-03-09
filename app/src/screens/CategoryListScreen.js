import React, { useEffect, useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    FlatList, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
    RefreshControl
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getCategories, createCategory, deleteCategory, updateCategory } from "../api/categories";

import { THEME } from "../theme";

export default function CategoryListScreen() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [newName, setNewName] = useState("");
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState("");

    const loadCategories = async () => {
        try {
            const { data } = await getCategories();
            setCategories(data);
        } catch (e) {
            Alert.alert("Error", "Failed to load categories.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadCategories(); }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadCategories();
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        try {
            await createCategory({ name: newName.trim() });
            loadCategories();
            setNewName("");
        } catch (e) {
            Alert.alert("Error", e.response?.data?.errors?.join("\n") || "Failed to create category.");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (id) => {
        if (!editValue.trim()) return setEditingId(null);
        setSaving(true);
        try {
            await updateCategory(id, { name: editValue.trim() });
            setCategories(categories.map(c => c.id === id ? { ...c, name: editValue.trim() } : c));
            setEditingId(null);
        } catch (e) {
            Alert.alert("Error", "Failed to update category.");
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (category) => {
        setEditingId(category.id);
        setEditValue(category.name);
    };

    const handleDelete = (id, name, count) => {
        const message = count > 0
            ? `Are you sure? "${name}" has ${count} expenses that will be moved to "No Category".`
            : `Are you sure you want to delete "${name}"?`;

        Alert.alert(
            "Delete Category",
            message,
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
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
            <View style={styles.addSection}>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>New Category</Text>
                    <View style={styles.row}>
                        <TextInput
                            style={styles.input}
                            placeholder=""
                            placeholderTextColor={THEME.muted}
                            value={newName}
                            onChangeText={setNewName}
                        />
                        <TouchableOpacity
                            style={[styles.addBtn, !newName.trim() && styles.disabledBtn]}
                            onPress={handleAdd}
                            disabled={saving || !newName.trim()}
                        >
                            {saving && !editingId ? <ActivityIndicator color="#fff" size="small" /> : <MaterialCommunityIcons name="plus" size={24} color="#fff" />}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <FlatList
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
                renderItem={({ item }) => (
                    <View style={styles.item}>
                        {editingId === item.id ? (
                            <View style={styles.editRow}>
                                <TextInput
                                    autoFocus
                                    style={styles.editInput}
                                    value={editValue}
                                    onChangeText={setEditValue}
                                    onSubmitEditing={() => handleUpdate(item.id)}
                                />
                                <View style={styles.editActions}>
                                    <TouchableOpacity onPress={() => setEditingId(null)} style={styles.cancelBtn}>
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleUpdate(item.id)} style={styles.saveBtn}>
                                        <Text style={styles.saveText}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemCount}>{item.expenses_count || 0} expenses</Text>
                                </View>
                                <View style={styles.actions}>
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => startEdit(item)}>
                                        <MaterialCommunityIcons name="pencil" size={20} color={THEME.muted} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id, item.name, item.expenses_count)}>
                                        <MaterialCommunityIcons name="delete-outline" size={20} color={THEME.danger} />
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="tag-multiple-outline" size={48} color={THEME.border} />
                        <Text style={styles.empty}>No custom categories yet.</Text>
                        <Text style={styles.emptySub}>Add categories to organize your expenses.</Text>
                    </View>
                }
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    center: { flex: 1, backgroundColor: THEME.bg, justifyContent: "center", alignItems: "center" },
    addSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: THEME.border, backgroundColor: THEME.card },
    inputContainer: { gap: 4 },
    label: { color: THEME.muted, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.5 },
    row: { flexDirection: "row", gap: 10, marginTop: 4 },
    input: { flex: 1, backgroundColor: THEME.bg, color: THEME.text, borderRadius: 8, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 14 : 10, fontSize: 16, borderWidth: 1, borderColor: THEME.border },
    addBtn: { backgroundColor: THEME.primary, width: 50, height: 50, borderRadius: 8, justifyContent: "center", alignItems: "center", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    disabledBtn: { opacity: 0.5, elevation: 0 },
    list: { padding: 16, paddingBottom: 40 },
    item: { backgroundColor: THEME.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: THEME.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    itemInfo: { flex: 1 },
    itemName: { color: THEME.text, fontSize: 16, fontWeight: "600" },
    itemCount: { color: THEME.muted, fontSize: 12, marginTop: 2 },
    actions: { flexDirection: "row", gap: 8 },
    actionBtn: { padding: 8, borderRadius: 8, backgroundColor: THEME.bg },
    editRow: { flex: 1 },
    editInput: { backgroundColor: THEME.bg, color: THEME.text, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, borderWidth: 1, borderColor: THEME.primary },
    editActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 12 },
    cancelBtn: { paddingVertical: 6, paddingHorizontal: 12 },
    cancelText: { color: THEME.muted, fontWeight: "600" },
    saveBtn: { backgroundColor: THEME.primary, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 6 },
    saveText: { color: "#fff", fontWeight: "700" },
    emptyContainer: { alignItems: "center", marginTop: 60, gap: 10 },
    empty: { color: THEME.text, fontSize: 16, fontWeight: "600" },
    emptySub: { color: THEME.muted, textAlign: "center", fontSize: 14, paddingHorizontal: 40 },
});
