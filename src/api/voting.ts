import { api } from "./axios";
import type { CreateVoteDto } from "@/types/api";

export const votingApi = {
  cast: (dto: CreateVoteDto) => api.post("/api/v1/voting", dto).then((r) => r.data),
};