import client from "./client";

export const getClients = () => client.get("/clients");
export const getClient = (id) => client.get(`/clients/${id}`);
export const createClient = (data) => client.post("/clients", { client: data });
export const updateClient = (id, data) => client.put(`/clients/${id}`, { client: data });
export const deleteClient = (id) => client.delete(`/clients/${id}`);
