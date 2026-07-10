import { api } from "./axios";
import type {
  CreateDepartmentDto,
  CreateFacultyDto,
  CreateLevelDto,
  Department,
  Faculty,
  Level,
  UpdateDepartmentDto,
  UpdateFacultyDto,
  UpdateLevelDto,
} from "@/types/api";

const base = "/api/v1/institutions";

export const institutionsApi = {
  faculties: {
    list: () => api.get<Faculty[]>(`${base}/faculties`).then((response) => response.data),
    create: (dto: CreateFacultyDto) =>
      api.post<Faculty>(`${base}/faculties`, dto).then((response) => response.data),
    update: (id: string, dto: UpdateFacultyDto) =>
      api.patch<Faculty>(`${base}/faculties/${id}`, dto).then((response) => response.data),
    remove: (id: string) =>
      api.delete<void>(`${base}/faculties/${id}`).then((response) => response.data),
  },
  departments: {
    list: (facultyId?: string) =>
      api
        .get<Department[]>(`${base}/departments`, {
          params: facultyId ? { facultyId } : undefined,
        })
        .then((response) => response.data),
    create: (dto: CreateDepartmentDto) =>
      api.post<Department>(`${base}/departments`, dto).then((response) => response.data),
    update: (id: string, dto: UpdateDepartmentDto) =>
      api.patch<Department>(`${base}/departments/${id}`, dto).then((response) => response.data),
    remove: (id: string) =>
      api.delete<void>(`${base}/departments/${id}`).then((response) => response.data),
  },
  levels: {
    list: () => api.get<Level[]>(`${base}/levels`).then((response) => response.data),
    create: (dto: CreateLevelDto) =>
      api.post<Level>(`${base}/levels`, dto).then((response) => response.data),
    update: (id: string, dto: UpdateLevelDto) =>
      api.patch<Level>(`${base}/levels/${id}`, dto).then((response) => response.data),
    remove: (id: string) =>
      api.delete<void>(`${base}/levels/${id}`).then((response) => response.data),
  },
};
