import client from "./client";

export const getExpenses = () => client.get("/expenses");

export const getExpense = (id) => client.get(`/expenses/${id}`);

export const createExpense = (data) => client.post("/expenses", { expense: data });

export const updateExpense = (id, data) => client.put(`/expenses/${id}`, { expense: data });

export const deleteExpense = (id) => client.delete(`/expenses/${id}`);
