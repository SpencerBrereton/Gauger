import client from "./client";

export const getCategories = () => client.get("/categories");

export const getCategory = (id) => client.get(`/categories/${id}`);

export const createCategory = (data) => client.post("/categories", { category: data });

export const updateCategory = (id, data) => client.put(`/categories/${id}`, { category: data });

export const deleteCategory = (id) => client.delete(`/categories/${id}`);
