import React from "react";
import { Modal, View, Image, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function FullscreenViewer({ visible, uri, onClose }) {
    if (!uri) return null;

    return (
        <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <MaterialCommunityIcons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    header: {
        height: 60,
        justifyContent: "center",
        alignItems: "flex-end",
        paddingHorizontal: 20,
        zIndex: 10,
    },
    closeBtn: {
        padding: 8,
    },
    imageContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        width: width,
        height: height - 120,
    },
});
