import { api } from "./axios";

export const appApi = {
  hello: () => api.get<string>("/").then((response) => response.data),
};
