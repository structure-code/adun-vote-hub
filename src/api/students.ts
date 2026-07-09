import { api } from "./axios";
import type { UpdateStudentProfileDto, User } from "@/types/api";

export const studentsApi = {
  list: () => api.get<User[]>("/api/v1/students").then((r) => r.data),
  get: (id: string) => api.get<User>(`/api/v1/students/${id}`).then((r) => r.data),
  update: (id: string, dto: UpdateStudentProfileDto) =>
    api.patch<User>(`/api/v1/students/${id}`, dto).then((r) => r.data),
  import: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post("/api/v1/students/import", fd, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },
};