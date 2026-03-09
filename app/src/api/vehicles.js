import client from "./client";
import { appendFile } from "../utils/formDataUtils";

export const getVehicles = () => client.get("/vehicles");

export const getVehicle = (id) => client.get(`/vehicles/${id}`);

export const createVehicle = async (data, isFormData = false) => {
    if (isFormData) {
        // If data is already FormData (e.g. from VehicleFormScreen calling with custom set), 
        // we might need to handle it carefully, but let's encourage passing raw data.
        return client.post("/vehicles", data, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    }
    return client.post("/vehicles", { vehicle: data });
};

export const updateVehicle = (id, data) => client.put(`/vehicles/${id}`, { vehicle: data });

export const deleteVehicle = (id) => client.delete(`/vehicles/${id}`);

export const uploadVehiclePhoto = async (id, photoData) => {
    const formData = new FormData();
    await appendFile(formData, "photo", photoData);

    return client.put(`/vehicles/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};
