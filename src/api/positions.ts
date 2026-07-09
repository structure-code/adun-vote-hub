import { api } from "./axios";
import type { CreatePositionDto, Position, UpdatePositionDto } from "@/types/api";

export const positionsApi = {
  list: (electionId?: string) =>
    api
      .get<Position[]>("/api/v1/positions", { params: electionId ? { electionId } : undefined })
      .then((r) => r.data),
  get: (id: string) => api.get<Position>(`/api/v1/positions/${id}`).then((r) => r.data),
  create: (dto: CreatePositionDto) => api.post<Position>("/api/v1/positions", dto).then((r) => r.data),
  update: (id: string, dto: UpdatePositionDto) =>
    api.patch<Position>(`/api/v1/positions/${id}`, dto).then((r) => r.data),
  remove: (id: string) => api.delete<void>(`/api/v1/positions/${id}`).then((r) => r.data),
};