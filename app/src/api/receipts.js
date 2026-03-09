import client from "./client";
import { appendFile } from "../utils/formDataUtils";

/**
 * Upload a receipt image for an expense.
 * @param {number} expenseId
 * @param {object} imageFile - { uri, name, type } from expo-image-picker result
 */
export const uploadReceipt = async (expenseId, imageFile) => {
  const formData = new FormData();
  await appendFile(formData, "receipt_image", imageFile);

  return client.post(`/expenses/${expenseId}/receipts`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
};

export const extractReceiptData = async (imageFile) => {
  const formData = new FormData();
  await appendFile(formData, "receipt", imageFile);

  return client.post("/expenses/extract_receipt", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
};

export const deleteReceipt = (expenseId) =>
  client.delete(`/expenses/${expenseId}/receipts/1`);
