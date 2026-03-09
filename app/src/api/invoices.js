import client from "./client";

export const getInvoices = () => client.get("/invoices");

export const getInvoice = (id) => client.get(`/invoices/${id}`);

export const createInvoice = (data) => client.post("/invoices", { invoice: data });

export const updateInvoice = (id, data) => client.put(`/invoices/${id}`, { invoice: data });

export const deleteInvoice = (id) => client.delete(`/invoices/${id}`);
