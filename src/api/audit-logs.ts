import { api } from "./axios";
import type { AuditLog } from "@/types/api";

export const auditLogsApi = {
  list: () => api.get<AuditLog[]>("/api/v1/audit-logs").then((r) => r.data),
};