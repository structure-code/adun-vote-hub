import { api } from "./axios";
import type { CreateVoteDto, VoteReceipt } from "@/types/api";

export const votingApi = {
  cast: (dto: CreateVoteDto) => api.post<VoteReceipt>("/api/v1/voting", dto).then((r) => r.data),
};
