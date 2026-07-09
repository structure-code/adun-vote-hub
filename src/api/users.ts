import { api } from "./axios";
import type { CreateUserDto, User } from "@/types/api";

export const usersApi = {
  me: () => api.get<User>("/api/v1/users/me").then((r) => r.data),
  createOfficer: (dto: CreateUserDto) =>
    api.post<User>("/api/v1/users/officers", dto).then((r) => r.data),
};