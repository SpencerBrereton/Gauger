import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal } from "react-native";
import { WebView } from "react-native-webview";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { THEME, INVOICE_STATUS_COLORS as STATUS_COLORS } from "../theme";
import { getUserProfile } from "../api/userProfiles";

import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import { BASE_URL } from "../api/client";
import storage from "../utils/storage";

export default function InvoiceDetailScreen({ route, navigation }) {
  const { invoice } = route.params;
  const [pdfHtml, setPdfHtml] = useState(null);

  const generatePDF = async () => {
    try {
      const { data: profile } = await getUserProfile();

      let logoBase64 = null;
      if (profile?.logo_url) {
        try {
          // Use the proxy endpoint to avoid CORS issues with direct R2 pre-signed URLs
          let proxyUrl = `${BASE_URL}/api/v1/user_profile/logo`;

          const token = await storage.getToken();
          const headers = token ? { Authorization: `Bearer ${token}` } : {};

          if (Platform.OS === 'web') {
            const response = await fetch(proxyUrl, { headers });
            const blob = await response.blob();
            logoBase64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
          } else {
            const { uri } = await FileSystem.downloadAsync(
              proxyUrl,
              FileSystem.documentDirectory + 'temp_logo.png',
              { headers }
            );
            const base64Str = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
            logoBase64 = `data:image/png;base64,${base64Str}`;
          }
        } catch (err) {
          console.warn('Could not fetch logo for PDF rendering', err);
        }
      }

      const lines = invoice.invoice_lines || invoice.lines || [];

      let tableRows = '';
      let totalDayRate = 0;
      let totalFieldExp = 0;
      let totalOffice = 0;
      let totalOther = 0;
      let totalVehicle = 0;
      let totalRotation = 0;
      let grandTotal = 0;

      const displayLines = [...lines];

      displayLines.forEach(l => {
        const dRate = parseFloat(l.day_rate || 0);
        const fExp = parseFloat(l.field_expenses || 0);
        const oMtg = parseFloat(l.office_meeting || 0);
        const oth = parseFloat(l.other_expenses || 0);
        const vMil = parseFloat(l.vehicle_mileage || 0);
        const rMil = parseFloat(l.rotation_mileage || 0);
        const dTotal = parseFloat(l.daily_total || 0);

        totalDayRate += dRate;
        totalFieldExp += fExp;
        totalOffice += oMtg;
        totalOther += oth;
        totalVehicle += vMil;
        totalRotation += rMil;
        grandTotal += dTotal;

        tableRows += `
          <tr>
            <td class="center">${l.date || ''}</td>
            <td>${dRate ? '$' + dRate.toFixed(2) : ''}</td>
            <td>${fExp ? '$' + fExp.toFixed(2) : ''}</td>
            <td>${oMtg ? '$' + oMtg.toFixed(2) : ''}</td>
            <td>${oth ? '$' + oth.toFixed(2) : ''}</td>
            <td>${vMil ? '$' + vMil.toFixed(2) : ''}</td>
            <td>${rMil ? '$' + rMil.toFixed(2) : ''}</td>
            <td>$${dTotal.toFixed(2)}</td>
          </tr>
        `;
      });

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; font-size: 11px; color: #000; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
              .company-info { width: 33%; }
              .company-info h2 { margin: 0 0 5px 0; font-size: 14px; font-weight: bold; }
              .company-info p { margin: 0 0 3px 0; font-size: 11px; }
              .logo-space { width: 33%; text-align: center; }
              .logo { max-width: 150px; max-height: 80px; }
              .logo-placeholder { 
                display: inline-block; 
                width: 80px; height: 80px; 
                border-radius: 50%; 
                border: 2px dashed #999; 
                line-height: 80px; 
                font-size: 10px; color: #999; 
              }
              
              .top-right { width: 34%; }
              .grid-row { display: flex; margin-bottom: 4px; align-items: flex-end; }
              .grid-label { font-weight: bold; width: 105px; text-align: right; padding-right: 10px; }
              .grid-val { flex: 1; min-height: 14px; }
              
              .border-bottom { border-bottom: 1px solid #000; padding-bottom: 1px; }
              
              .bill-to-section { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .bill-to-left { width: 60%; }
              
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
              th, td { border: 1px solid #000; padding: 5px 4px; text-align: right; }
              th { background-color: #f0f0f0; text-align: center; font-weight: bold; white-space: pre-wrap; }
              td.center { text-align: center; }
              .total-row td { font-weight: bold; background-color: #f0f0f0; }
              
              .mt-15 { margin-top: 15px; }
              .mt-20 { margin-top: 20px; }
              .manager-box { text-align: center; margin-top: 20px; width: 200px; float: right; }
              .signature-line { border-bottom: 1px solid #000; height: 16px; margin-bottom: 4px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-info">
                <h2>${profile?.company_name || 'Your Company Name'}</h2>
                <p>${(profile?.company_address || 'Your Company Address').replace(/\n/g, '<br/>')}</p>
                <p>${profile?.phone || 'Your Phone Number'}</p>
                
                <div class="grid-row mt-15">
                  <div class="grid-label" style="text-align: left; width: 50px;">Name:</div>
                  <div class="grid-val border-bottom">${profile?.user_name || 'Your Name'}</div>
                </div>
              </div>
              
              <div class="logo-space">
                ${logoBase64
          ? `<img class="logo" src="${logoBase64}" />`
          : `<div class="logo-placeholder">LOGO</div>`
        }
              </div>
              
              <div class="top-right">
                <div class="grid-row">
                  <div class="grid-label">Invoice #:</div>
                  <div class="grid-val">${invoice.invoice_number || 'N/A'}</div>
                </div>
                <div class="grid-row">
                  <div class="grid-label">Invoice Date:</div>
                  <div class="grid-val">${invoice.invoice_date || new Date().toLocaleDateString()}</div>
                </div>
                <div class="grid-row mt-15">
                  <div class="grid-label">GST #:</div>
                  <div class="grid-val">${profile?.gst_number || ''}</div>
                </div>
                <div class="grid-row">
                  <div class="grid-label">WCB #:</div>
                  <div class="grid-val">${profile?.wcb_number || ''}</div>
                </div>
              </div>
            </div>
            
            <div class="bill-to-section">
              <div class="bill-to-left">
                <div style="display: flex;">
                  <div style="font-weight: bold; width: 50px;">Bill To:</div>
                  <div style="flex: 1;">
                    <strong>${invoice.client_name || 'N/A'}</strong><br/>
                    1500, 520 - 3rd Avenue SW<br/>
                    Calgary, AB  T2P 0R3
                  </div>
                </div>
                
                <div style="display: flex; margin-top: 20px; align-items: center;">
                  <div style="font-weight: bold; width: 90px;">Billing period:</div>
                  <div style="font-weight: bold;">
                    ${invoice.billing_period_start || ''} - ${invoice.billing_period_end || ''}
                  </div>
                </div>
              </div>
              
              <div style="width: 34%;">
                <div class="grid-row">
                  <div class="grid-label">Project:</div>
                  <div class="grid-val border-bottom">${invoice.project_name || ''}</div>
                </div>
                <div class="grid-row">
                  <div class="grid-label">Purchase Order:</div>
                  <div class="grid-val border-bottom">${invoice.purchase_order || ''}</div>
                </div>
                <div class="grid-row">
                  <div class="grid-label">WBS Code:</div>
                  <div class="grid-val border-bottom">${invoice.wbs_code || ''}</div>
                </div>
                
                <div class="manager-box">
                  <div class="signature-line" style="border-bottom-color: transparent;">
                    ${invoice.project_manager || ''}
                  </div>
                  <div style="border-top: 1px solid #000; padding-top: 2px;">Project Manager</div>
                </div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th style="width: 60px;">Date</th>
                  <th>Day Rate</th>
                  <th>Field Expenses</th>
                  <th>Office / Meeting<br/>$100/Hr</th>
                  <th>Other Expenses</th>
                  <th>Vehicle<br/>Mileage</th>
                  <th>Rotation<br/>Mileage</th>
                  <th>Daily Total</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
                <tr class="total-row">
                  <td class="center">TOTAL</td>
                  <td>${totalDayRate ? '$' + totalDayRate.toFixed(2) : ''}</td>
                  <td>${totalFieldExp ? '$' + totalFieldExp.toFixed(2) : ''}</td>
                  <td>${totalOffice ? '$' + totalOffice.toFixed(2) : ''}</td>
                  <td>${totalOther ? '$' + totalOther.toFixed(2) : ''}</td>
                  <td>${totalVehicle ? '$' + totalVehicle.toFixed(2) : ''}</td>
                  <td>${totalRotation ? '$' + totalRotation.toFixed(2) : ''}</td>
                  <td>$${grandTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        iframe.style.border = 'none';

        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(htmlContent);
        doc.close();

        setTimeout(() => {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 100);
      } else {
        setPdfHtml(htmlContent);
      }
    } catch (e) {
      console.error(e);
      alert("Error generating PDF");
    }
  };

  const Row = ({ label, value, valueStyle, isLast }) => (
    <View style={[styles.row, isLast && { borderBottomWidth: 0 }]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueStyle]}>{value || "-"}</Text>
    </View>
  );

  const lines = invoice.invoice_lines || invoice.lines || [];

  const sharePdf = async () => {
    const { uri } = await Print.printToFileAsync({ html: pdfHtml });
    await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
  };

  return (
    <View style={styles.container}>
      {pdfHtml && (
        <Modal visible animationType="slide" onRequestClose={() => setPdfHtml(null)}>
          <View style={styles.pdfModal}>
            <View style={styles.pdfToolbar}>
              <TouchableOpacity onPress={() => setPdfHtml(null)} style={styles.pdfToolbarBtn}>
                <MaterialCommunityIcons name="close" size={22} color={THEME.text} />
                <Text style={styles.pdfToolbarBtnText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.pdfToolbarTitle}>Invoice Preview</Text>
              <TouchableOpacity onPress={sharePdf} style={styles.pdfToolbarBtn}>
                <MaterialCommunityIcons name="share-variant" size={22} color={THEME.primary} />
                <Text style={[styles.pdfToolbarBtnText, { color: THEME.primary }]}>Share</Text>
              </TouchableOpacity>
            </View>
            <WebView source={{ html: pdfHtml }} style={{ flex: 1 }} />
          </View>
        </Modal>
      )}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNum}>#{invoice.invoice_number || 'N/A'}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("InvoiceForm", { invoice })}>
            <MaterialCommunityIcons name="pencil" size={18} color={THEME.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amount}>${parseFloat(invoice.amount || 0).toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={generatePDF}>
          <MaterialCommunityIcons name="file-pdf-box" size={24} color="#FFF" />
          <Text style={styles.actionBtnText}>View PDF Invoice</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.cardContent}>
            <Row label="Client" value={invoice.client_name} />
            <Row label="Invoice Date" value={invoice.invoice_date} />
            <Row label="Due Date" value={invoice.due_date} />
            <Row label="Billing Period" value={invoice.billing_period_start ? `${invoice.billing_period_start} to ${invoice.billing_period_end}` : null} />
            {invoice.paid_at && <Row label="Paid At" value={invoice.paid_at} valueStyle={{ color: "#16A34A" }} />}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Project Details</Text>
          <View style={styles.cardContent}>
            <Row label="Project Name" value={invoice.project_name} />
            <Row label="Project Manager" value={invoice.project_manager} />
            <Row label="Purchase Order" value={invoice.purchase_order} />
            <Row label="WBS Code" value={invoice.wbs_code} isLast={true} />
          </View>
        </View>

        {lines.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Line Items ({lines.length})</Text>
            <View style={styles.cardContent}>
              {lines.map((line, idx) => (
                <View key={idx} style={[styles.lineItem, idx === lines.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.lineItemHeader}>
                    <View style={styles.lineDateBadge}>
                      <MaterialCommunityIcons name="calendar" size={14} color={THEME.primary} />
                      <Text style={styles.lineDateText}>{line.date}</Text>
                    </View>
                    <Text style={styles.lineTotal}>${parseFloat(line.daily_total || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.lineDetails}>
                    {!!line.day_rate && <Text style={styles.lineDetailText}>Day Rate: ${line.day_rate}</Text>}
                    {!!line.field_expenses && <Text style={styles.lineDetailText}>Field Exp: ${line.field_expenses}</Text>}
                    {!!line.office_meeting && <Text style={styles.lineDetailText}>Office: ${line.office_meeting}</Text>}
                    {!!line.other_expenses && <Text style={styles.lineDetailText}>Other: ${line.other_expenses}</Text>}
                    {!!line.vehicle_mileage && <Text style={styles.lineDetailText}>Mileage: ${line.vehicle_mileage}</Text>}
                    {!!line.rotation_mileage && <Text style={styles.lineDetailText}>Rotation: ${line.rotation_mileage}</Text>}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  content: { padding: 20, paddingBottom: 60 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingHorizontal: 4 },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: THEME.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  editBtnText: { color: THEME.primary, fontWeight: "600", fontSize: 14 },
  invoiceLabel: { color: THEME.muted, fontSize: 13, fontWeight: "600", letterSpacing: 1, marginBottom: 4 },
  invoiceNum: { color: THEME.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  amountBox: { backgroundColor: THEME.primary, borderRadius: 16, padding: 24, marginBottom: 20, alignItems: "center", shadowColor: THEME.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  amountLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  amount: { color: "#FFF", fontSize: 40, fontWeight: "800", letterSpacing: -1 },
  actionBtn: { backgroundColor: THEME.text, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, paddingVertical: 16, borderRadius: 12, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  card: { backgroundColor: THEME.card, borderRadius: 16, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: "hidden" },
  sectionTitle: { backgroundColor: "#F9FAFB", paddingHorizontal: 20, paddingVertical: 14, fontSize: 14, fontWeight: "700", color: THEME.muted, textTransform: "uppercase", letterSpacing: 1, borderBottomWidth: 1, borderBottomColor: THEME.border },
  cardContent: { paddingHorizontal: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: THEME.border },
  rowLabel: { color: THEME.muted, fontSize: 14, flex: 1 },
  rowValue: { color: THEME.text, fontSize: 14, fontWeight: "600", flex: 2, textAlign: "right" },
  lineItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: THEME.border },
  lineItemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  lineDateBadge: { flexDirection: "row", alignItems: "center", backgroundColor: THEME.primary + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, gap: 6 },
  lineDateText: { color: THEME.primary, fontWeight: "700", fontSize: 13 },
  lineTotal: { fontWeight: "800", fontSize: 16, color: THEME.text },
  lineDetails: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  lineDetailText: { fontSize: 12, color: THEME.muted, backgroundColor: THEME.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, overflow: 'hidden' },
  pdfModal: { flex: 1, backgroundColor: "#fff" },
  pdfToolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: THEME.border, backgroundColor: "#fff" },
  pdfToolbarTitle: { fontSize: 16, fontWeight: "700", color: THEME.text },
  pdfToolbarBtn: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 70 },
  pdfToolbarBtnText: { fontSize: 15, fontWeight: "600", color: THEME.text },
});
