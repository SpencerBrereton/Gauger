import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createExpense, updateExpense } from "../api/expenses";
import { uploadReceipt, extractReceiptData } from "../api/receipts";
import { getCategories } from "../api/categories";
import ReceiptThumbnail from "../components/ReceiptThumbnail";
import FullscreenViewer from "../components/FullscreenViewer";
import { useFocusEffect } from "@react-navigation/native";
import { BASE_URL } from "../api/client";

import { THEME } from "../theme";
const STATUS_OPTIONS = ["pending", "approved", "rejected"];

const Field = ({ label, children }) => (
  <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}</View>
);

export default function ExpenseFormScreen({ navigation, route }) {
  const existingExpense = route.params?.expense;
  const isEditing = !!existingExpense;
  const [locked, setLocked] = useState(isEditing);
  const [form, setForm] = useState({ title: "", amount: "", subtotal: "", tax: "", tip: "", category_id: null, date: new Date().toISOString().split("T")[0], notes: "", status: "pending" });
  const [categories, setCategories] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  React.useEffect(() => {
    if (existingExpense) {
      setForm({
        title: existingExpense.title || "",
        amount: existingExpense.amount ? String(existingExpense.amount) : "",
        subtotal: existingExpense.subtotal ? String(existingExpense.subtotal) : "",
        tax: existingExpense.tax ? String(existingExpense.tax) : "",
        tip: existingExpense.tip ? String(existingExpense.tip) : "",
        category_id: existingExpense.category_id,
        date: existingExpense.date || new Date().toISOString().split("T")[0],
        notes: existingExpense.notes || "",
        status: existingExpense.status || "pending"
      });
      if (existingExpense.receipt_url) {
        setReceipt({ uri: `${BASE_URL}${existingExpense.receipt_url}` });
      }
    }
  }, [existingExpense]);

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        try {
          const { data } = await getCategories();
          setCategories(data);
          if (data.length > 0 && !form.category_id) update("category_id", data[0].id);
        } catch (_) { } finally { setLoadingCats(false); }
      };
      load();
    }, [form.category_id])
  );

  const handleReceiptSelection = async (img) => {
    setReceipt(img);
    setExtracting(true);
    try {
      const { data } = await extractReceiptData({ uri: img.uri, name: "receipt.jpg", type: "image/jpeg" });
      if (data) {
        if (data.title) update("title", data.title);
        if (data.amount != null) update("amount", data.amount.toString());
        if (data.date) update("date", data.date);
        if (data.subtotal != null) update("subtotal", data.subtotal.toString());
        if (data.tax != null) update("tax", data.tax.toString());
        if (data.tip != null) update("tip", data.tip.toString());

        if (data.category) {
          const match = categories.find(c => c.name.toLowerCase().includes(data.category.toLowerCase()) || data.category.toLowerCase().includes(c.name.toLowerCase()));
          if (match) update("category_id", match.id);
        }
      }
    } catch (e) {
      console.log("Extraction error:", e);
      Alert.alert("Auto-Extract Failed", "Could not interpret receipt fully. Please fill manually.");
    } finally {
      setExtracting(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Allow photo library access."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled) handleReceiptSelection(result.assets[0]);
  };

  const openCamera = async () => {
    if (Platform.OS === "web") { Alert.alert("Camera not available on web", "Use the photo picker instead."); return; }
    navigation.navigate("ReceiptCamera", { onCapture: (img) => handleReceiptSelection(img) });
  };

  const handleSave = async () => {
    if (!form.title || !form.amount) { Alert.alert("Validation", "Title and amount are required."); return; }
    setSaving(true);
    try {
      const body = {
        ...form,
        amount: parseFloat(form.amount) || 0,
        subtotal: form.subtotal ? parseFloat(form.subtotal) : null,
        tax: form.tax ? parseFloat(form.tax) : null,
        tip: form.tip ? parseFloat(form.tip) : null,
        final_total: parseFloat(form.amount) || 0
      };

      let response;
      if (isEditing) {
        response = await updateExpense(existingExpense.id, body);
      } else {
        response = await createExpense(body);
      }

      const expense = response.data;
      if (receipt && receipt.uri && !receipt.uri.startsWith("http")) {
        await uploadReceipt(expense.id, { uri: receipt.uri, name: "receipt.jpg", type: "image/jpeg" });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.errors?.join("\n") || "Failed to save expense.");
    }
    setSaving(false);
  };


  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isEditing && locked && (
        <TouchableOpacity style={styles.unlockBtn} onPress={() => setLocked(false)}>
          <MaterialCommunityIcons name="pencil-lock" size={20} color={THEME.primary} />
          <Text style={styles.unlockBtnText}>Unlock for Editing</Text>
        </TouchableOpacity>
      )}

      <Field label="Title *">
        <TextInput style={[styles.input, locked && styles.inputLocked]} value={form.title} onChangeText={(v) => update("title", v)} testID="expense-form-title" editable={!locked} />
      </Field>
      <View style={styles.row}>
        <View style={styles.flexHalf}>
          <Field label="Subtotal ($)">
            <TextInput style={[styles.input, locked && styles.inputLocked]} value={form.subtotal} onChangeText={(v) => update("subtotal", v.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" editable={!locked} />
          </Field>
        </View>
        <View style={styles.spacing} />
        <View style={styles.flexHalf}>
          <Field label="Tax ($)">
            <TextInput style={[styles.input, locked && styles.inputLocked]} value={form.tax} onChangeText={(v) => update("tax", v.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" editable={!locked} />
          </Field>
        </View>
        <View style={styles.spacing} />
        <View style={styles.flexHalf}>
          <Field label="Tip ($)">
            <TextInput style={[styles.input, locked && styles.inputLocked]} value={form.tip} onChangeText={(v) => update("tip", v.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" editable={!locked} />
          </Field>
        </View>
      </View>
      <Field label="Final Total ($) *">
        <TextInput style={[styles.input, locked && styles.inputLocked]} value={form.amount} onChangeText={(v) => update("amount", v.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" testID="expense-form-amount" editable={!locked} />
      </Field>
      <Field label="Date">
        {Platform.OS === 'web' ? (
          <input
            type="date"
            value={form.date}
            onChange={(e) => update("date", e.target.value)}
            style={styles.webDateInput}
            disabled={locked}
          />
        ) : (
          <TouchableOpacity
            style={[styles.input, locked && styles.inputLocked]}
            onPress={() => !locked && setShowDatePicker(true)}
            disabled={locked}
          >
            <Text style={{ color: locked ? THEME.muted : THEME.text }}>{form.date}</Text>
          </TouchableOpacity>
        )}
      </Field>

      {showDatePicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={new Date(form.date + "T00:00:00")}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              update("date", selectedDate.toISOString().split("T")[0]);
            }
          }}
        />
      )}
      <Field label="Category">
        {loadingCats ? <ActivityIndicator size="small" color={THEME.primary} /> : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {categories.map((cat) => (
              <TouchableOpacity key={cat.id} style={[styles.chip, form.category_id === cat.id && styles.chipActive, locked && styles.chipLocked]} onPress={() => !locked && update("category_id", cat.id)} disabled={locked}>
                <Text style={[styles.chipText, form.category_id === cat.id && styles.chipTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
            {categories.length === 0 && !locked && (
              <TouchableOpacity style={styles.chip} onPress={() => navigation.navigate("Categories")}>
                <Text style={styles.chipText}>+ Add Custom Category</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </Field>
      <Field label="Notes">
        <TextInput style={[styles.input, styles.textarea, locked && styles.inputLocked]} value={form.notes} onChangeText={(v) => update("notes", v)} multiline numberOfLines={3} testID="expense-form-notes" editable={!locked} />
      </Field>
      <Field label="Receipt">
        <Text style={styles.warningText}>Note: The most recent image upload will autopopulate the form.</Text>
        {receipt ? (
          <View>
            <ReceiptThumbnail uri={receipt.uri} onRemove={locked ? null : () => setReceipt(null)} onView={() => setViewerVisible(true)} />
            {extracting && (
              <View style={styles.extractingOverlay}>
                <ActivityIndicator color={THEME.primary} style={{ marginRight: 8 }} />
                <Text style={styles.extractingText}>Extracting receipt data...</Text>
              </View>
            )}
            <FullscreenViewer visible={viewerVisible} uri={receipt.uri} onClose={() => setViewerVisible(false)} />
          </View>
        ) : !locked && (
          <View style={styles.receiptBtns}>
            <TouchableOpacity style={styles.receiptBtn} onPress={openCamera}><Text style={styles.receiptBtnText}>📷 Camera</Text></TouchableOpacity>
            <TouchableOpacity style={styles.receiptBtn} onPress={pickImage}><Text style={styles.receiptBtnText}>🖼 Gallery</Text></TouchableOpacity>
          </View>
        )}
      </Field>

      {!locked && (
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} testID="expense-form-save-button">
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{isEditing ? "Update Expense" : "Save Expense"}</Text>}
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
  input: { backgroundColor: THEME.input, color: THEME.text, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, borderWidth: 1, borderColor: THEME.border },
  textarea: { height: 80, textAlignVertical: "top" },
  chips: { flexDirection: "row" },
  chip: { backgroundColor: THEME.card, borderRadius: 4, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: THEME.border },
  chipActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  chipText: { color: THEME.muted, fontSize: 13 },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  receiptBtns: { flexDirection: "row", gap: 10 },
  receiptBtn: { flex: 1, backgroundColor: THEME.card, borderRadius: 4, padding: 14, alignItems: "center", borderWidth: 1, borderColor: THEME.border, borderStyle: "dashed" },
  receiptBtnText: { color: THEME.muted, fontSize: 14 },
  saveBtn: { backgroundColor: THEME.primary, borderRadius: 4, paddingVertical: 14, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  flexHalf: { flex: 1 },
  spacing: { width: 12 },
  extractingOverlay: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7", padding: 12, borderRadius: 6, marginTop: 12, borderWidth: 1, borderColor: "#FDE68A" },
  extractingText: { color: "#92400E", fontSize: 13, fontWeight: "600" },
  warningText: { color: THEME.muted, fontSize: 13, fontStyle: "italic", marginBottom: 8 },
  unlockBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF7ED", padding: 12, borderRadius: 4, marginBottom: 20, borderWidth: 1, borderColor: "#FED7AA", gap: 8 },
  unlockBtnText: { color: THEME.primary, fontWeight: "600", fontSize: 14 },
  inputLocked: { backgroundColor: "#F9FAFB", color: THEME.muted, borderColor: "#E5E7EB" },
  chipLocked: { opacity: 0.5 },
  webDateInput: { display: "block", width: "100%", boxSizing: "border-box", padding: "12px", fontSize: "16px", borderRadius: "4px", border: "1px solid #E5E7EB", outline: "none", marginBottom: "8px", backgroundColor: "#fff", color: "#1D1D1D", fontFamily: "inherit" },
});
