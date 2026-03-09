import React, { useState } from "react";
import { View, Image, TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ReceiptThumbnail({ uri, onRemove, onView }) {
  const [isHovered, setIsHovered] = useState(false);

  // If not on web, we might want to just show it or show it on press
  // But since the user specifically asked for "hovers the mouse", we'll implement hover state
  const showMagnifier = Platform.OS === "web" ? isHovered : true;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        onPress={onView}
        disabled={!onView}
        activeOpacity={0.7}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        {onView && showMagnifier && (
          <View style={styles.viewOverlay}>
            <MaterialCommunityIcons name="magnify" size={24} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
      {onRemove && (
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove} testID="receipt-thumbnail-remove">
          <MaterialCommunityIcons name="close-circle" size={22} color="#FF6584" />
        </TouchableOpacity>
      )}
      <Text style={styles.label}>Receipt attached</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "flex-start" },
  image: { width: 120, height: 120, borderRadius: 12, borderWidth: 2, borderColor: "#6C63FF" },
  viewOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  removeBtn: { position: "absolute", top: -8, right: -8, backgroundColor: "#1a1a2e", borderRadius: 11 },
  label: { color: "#4CD97B", fontSize: 12, marginTop: 6 },
});
