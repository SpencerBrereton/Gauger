import client from "./client";

export const getMileageLogs = () => client.get("/mileage_logs");

export const getMileageLog = (id) => client.get(`/mileage_logs/${id}`);

export const createMileageLog = (data) => client.post("/mileage_logs", { mileage_log: data });

export const updateMileageLog = (id, data) => client.put(`/mileage_logs/${id}`, { mileage_log: data });

export const deleteMileageLog = (id) => client.delete(`/mileage_logs/${id}`);
