import client from "./client";

export const getReconciliationReports = () =>
  client.get("/reconciliation_reports");

export const getReconciliationReport = (id) =>
  client.get(`/reconciliation_reports/${id}`);

export const createReconciliationReport = (data) =>
  client.post("/reconciliation_reports", { reconciliation_report: data });

export const deleteReconciliationReport = (id) =>
  client.delete(`/reconciliation_reports/${id}`);
