import { api } from "./axios";
import type { Candidate, UpdateCandidateDto } from "@/types/api";

export const candidatesApi = {
  list: () => api.get<Candidate[]>("/api/v1/candidates").then((r) => r.data),
  get: (id: string) => api.get<Candidate>(`/api/v1/candidates/${id}`).then((r) => r.data),
  create: (payload: { userId: string; positionId: string; manifesto?: string; picture?: File }) => {
    const fd = new FormData();
    fd.append("userId", payload.userId);
    fd.append("positionId", payload.positionId);
    if (payload.manifesto) fd.append("manifesto", payload.manifesto);
    if (payload.picture) fd.append("picture", payload.picture);
    return api.post<Candidate>("/api/v1/candidates", fd).then((r) => r.data);
  },
  update: (id: string, dto: UpdateCandidateDto) =>
    api.patch<Candidate>(`/api/v1/candidates/${id}`, dto).then((r) => r.data),
  remove: (id: string) => api.delete<void>(`/api/v1/candidates/${id}`).then((r) => r.data),
};
