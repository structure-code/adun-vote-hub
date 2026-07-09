import { api } from "./axios";
import type {
  AdminLoginDto,
  AuthResponse,
  StudentLoginDto,
  StudentRegisterDto,
  User,
} from "@/types/api";

export const authApi = {
  adminLogin: (dto: AdminLoginDto) =>
    api.post<AuthResponse>("/api/v1/auth/admin/login", dto).then((r) => r.data),

  studentLogin: (dto: StudentLoginDto) =>
    api.post<AuthResponse>("/api/v1/auth/student/login", dto).then((r) => r.data),

  studentRegister: (dto: StudentRegisterDto) =>
    api.post<AuthResponse>("/api/v1/auth/student/register", dto).then((r) => r.data),

  refresh: () => api.post<AuthResponse>("/api/v1/auth/refresh").then((r) => r.data),

  logout: () => api.post("/api/v1/auth/logout").then((r) => r.data),

  me: () => api.get<User>("/api/v1/users/me").then((r) => r.data),
};