import React, { useEffect, useState, useCallback } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, Text, ActivityIndicator, RefreshControl } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getClients } from "../api/clients";

import { THEME } from "../theme";

export default function ClientListScreen({ navigation }) {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await getClients();
            setClients(res.data);
        } catch (e) {
            console.log("Failed to load clients", e);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    if (loading) {
        return <View style={[styles.container, styles.center]}><ActivityIndicator color={THEME.primary} size="large" /></View>;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={clients}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate("ClientForm", { client: item })}
                    >
                        <View style={styles.cardHeader}>
                            <Text style={styles.clientName}>{item.name}</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.muted} />
                        </View>
                        <Text style={styles.clientAddress} numberOfLines={1}>{item.address || "No address provided"}</Text>
                        {item.default_project_manager && (
                            <Text style={styles.managerText}>PM: {item.default_project_manager}</Text>
                        )}
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="domain" size={64} color={THEME.muted} />
                        <Text style={styles.emptyText}>No clients added yet</Text>
                        <Text style={styles.emptySubText}>Add your clients to easily generate invoices for them.</Text>
                    </View>
                }
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
                contentContainerStyle={clients.length === 0 ? styles.emptyContainer : styles.listContent}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate("ClientForm")}
            >
                <MaterialCommunityIcons name="plus" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    center: { justifyContent: "center", alignItems: "center" },
    listContent: { padding: 16 },
    card: { backgroundColor: THEME.card, padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: THEME.border },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    clientName: { fontSize: 16, fontWeight: "600", color: THEME.text },
    clientAddress: { fontSize: 13, color: THEME.muted, marginBottom: 4 },
    managerText: { fontSize: 12, color: THEME.primary, fontWeight: "500" },
    empty: { alignItems: "center", gap: 12, paddingHorizontal: 32 },
    emptyText: { color: THEME.text, fontSize: 18, fontWeight: "600" },
    emptySubText: { color: THEME.muted, fontSize: 14, textAlign: "center" },
    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    fab: { position: "absolute", bottom: 24, right: 24, backgroundColor: THEME.primary, width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 }
});
