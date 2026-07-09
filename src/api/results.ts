import { api } from "./axios";
import type { ElectionResults } from "@/types/api";

export const resultsApi = {
  get: (electionId: string) =>
    api.get<ElectionResults>(`/api/v1/results/${electionId}`).then((r) => r.data),
};