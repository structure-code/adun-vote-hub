import { api } from "./axios";
import type { CreateElectionDto, Election, UpdateElectionDto } from "@/types/api";

export const electionsApi = {
  list: () => api.get<Election[]>("/api/v1/elections").then((r) => r.data),
  get: (id: string) => api.get<Election>(`/api/v1/elections/${id}`).then((r) => r.data),
  create: (dto: CreateElectionDto) => api.post<Election>("/api/v1/elections", dto).then((r) => r.data),
  update: (id: string, dto: UpdateElectionDto) =>
    api.patch<Election>(`/api/v1/elections/${id}`, dto).then((r) => r.data),
  remove: (id: string) => api.delete<void>(`/api/v1/elections/${id}`).then((r) => r.data),
};