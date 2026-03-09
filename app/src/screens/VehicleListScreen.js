import React, { useEffect, useState, useCallback } from "react";
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl, Image
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getVehicles } from "../api/vehicles";
import { BASE_URL } from "../api/client";
import { useFocusEffect } from "@react-navigation/native";

import { THEME } from "../theme";

export default function VehicleListScreen({ navigation }) {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await getVehicles();
            setVehicles(res.data);
        } catch (_) { }
        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const VehicleCard = ({ vehicle }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("VehicleForm", { vehicle })}
        >
            <View style={styles.imageContainer}>
                {vehicle.photo_url ? (
                    <Image source={{ uri: `${BASE_URL}${vehicle.photo_url}` }} style={styles.image} />
                ) : (
                    <MaterialCommunityIcons name="car" size={32} color={THEME.primary} />
                )}
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{vehicle.name}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{vehicle.ruleset.toUpperCase()}</Text>
                </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={THEME.muted} />
        </TouchableOpacity>
    );

    if (loading) {
        return <View style={styles.center}><ActivityIndicator color={THEME.primary} size="large" /></View>;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={vehicles}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => <VehicleCard vehicle={item} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="car-off" size={64} color={THEME.muted} />
                        <Text style={styles.emptyText}>No vehicles added yet</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate("VehicleForm")}>
                            <Text style={styles.addBtnText}>Add Your First Vehicle</Text>
                        </TouchableOpacity>
                    </View>
                }
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
                contentContainerStyle={[styles.list, vehicles.length === 0 && styles.emptyContainer]}
            />
            {vehicles.length > 0 && (
                <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("VehicleForm")}>
                    <MaterialCommunityIcons name="plus" size={28} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: THEME.bg },
    list: { padding: 16 },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: THEME.card,
        borderRadius: 4,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: THEME.border
    },
    imageContainer: {
        width: 60,
        height: 60,
        borderRadius: 4,
        backgroundColor: THEME.expenseAccent,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden"
    },
    image: { width: "100%", height: "100%" },
    info: { flex: 1, marginLeft: 16 },
    name: { color: THEME.text, fontSize: 18, fontWeight: "700", marginBottom: 4 },
    badge: {
        backgroundColor: THEME.divider,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: "flex-start"
    },
    badgeText: { color: THEME.muted, fontSize: 10, fontWeight: "800" },
    empty: { alignItems: "center", padding: 40 },
    emptyText: { color: THEME.muted, fontSize: 16, marginTop: 16, marginBottom: 24, textAlign: "center" },
    emptyContainer: { flex: 1, justifyContent: "center" },
    addBtn: { backgroundColor: THEME.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 4 },
    addBtnText: { color: "#fff", fontWeight: "700" },
    fab: {
        position: "absolute",
        right: 20,
        bottom: 20,
        width: 52,
        height: 52,
        borderRadius: 4,
        backgroundColor: THEME.primary,
        justifyContent: "center",
        alignItems: "center",
        elevation: 3
    },
});
