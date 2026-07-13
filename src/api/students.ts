import { api } from "./axios";
import type { StudentRecord, UpdateStudentProfileDto } from "@/types/api";

export const studentsApi = {
  list: () => api.get<StudentRecord[]>("/api/v1/students").then((r) => r.data),
  search: (query: string) =>
    api.get<StudentRecord>("/api/v1/students/search", { params: { query } }).then((r) => r.data),
  get: (id: string) => api.get<StudentRecord>(`/api/v1/students/${id}`).then((r) => r.data),
  update: (id: string, dto: UpdateStudentProfileDto) =>
    api.patch<StudentRecord>(`/api/v1/students/${id}`, dto).then((r) => r.data),
  updateMe: (dto: UpdateStudentProfileDto) =>
    api.patch<StudentRecord>("/api/v1/students/me", dto).then((r) => r.data),
  uploadIdCard: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post<StudentRecord>("/api/v1/students/me/upload-id", fd).then((r) => r.data);
  },
  verify: (id: string) =>
    api.patch<StudentRecord>(`/api/v1/students/${id}/verify`).then((r) => r.data),
  import: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/api/v1/students/import", fd).then((r) => r.data);
  },
};
