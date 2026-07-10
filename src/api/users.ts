import { api } from "./axios";
import type { ChangePasswordDto, CreateUserDto, UpdateUserDto, User } from "@/types/api";

export const usersApi = {
  me: () => api.get<User>("/api/v1/users/me").then((r) => r.data),
  updateMe: (dto: UpdateUserDto) => api.patch<User>("/api/v1/users/me", dto).then((r) => r.data),
  changePassword: (dto: ChangePasswordDto) =>
    api.patch("/api/v1/users/me/password", dto).then((r) => r.data),
  deleteMe: () => api.delete<void>("/api/v1/users/me").then((r) => r.data),
  remove: (id: string) => api.delete<void>(`/api/v1/users/${id}`).then((r) => r.data),
  createOfficer: (dto: CreateUserDto) =>
    api.post<User>("/api/v1/users/officers", dto).then((r) => r.data),
  searchOfficer: (email: string) =>
    api.get<User>("/api/v1/users/officers/search", { params: { email } }).then((r) => r.data),
};
