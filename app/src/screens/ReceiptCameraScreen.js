import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

export default function ReceiptCameraScreen({ navigation, route }) {
  const { onCapture } = route.params || {};
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need camera access to capture receipts.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (onCapture) onCapture(photo);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "Failed to capture photo.");
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.flipBtn} onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}>
            <Text style={styles.btnText}>Flip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureBtn} onPress={takePicture} testID="receipt-camera-capture-button" />
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  camera: { flex: 1, width: "100%" },
  controls: { position: "absolute", bottom: 40, left: 0, right: 0, flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingHorizontal: 24 },
  captureBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#fff", borderWidth: 4, borderColor: "#ccc" },
  flipBtn: { backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtn: { backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  btnText: { color: "#fff", fontWeight: "600" },
  message: { color: "#fff", fontSize: 16, textAlign: "center", marginHorizontal: 32, marginBottom: 24 },
  btn: { backgroundColor: "#6C63FF", borderRadius: 10, paddingHorizontal: 24, paddingVertical: 14 },
});
