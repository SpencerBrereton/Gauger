import client from "./client";
import { appendFile } from "../utils/formDataUtils";

export const uploadGasReceipt = async (mileageLogId, imageFile) => {
    const formData = new FormData();
    await appendFile(formData, "receipt", imageFile);

    return client.post(`/mileage_logs/${mileageLogId}/receipts`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
    });
};

export const extractGasReceiptData = async (imageFile) => {
    const formData = new FormData();
    await appendFile(formData, "receipt", imageFile);

    return client.post("/mileage_logs/extract_gas_receipt", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
    });
};

export const deleteGasReceipt = (mileageLogId) =>
    client.delete(`/mileage_logs/${mileageLogId}/receipts/1`);
