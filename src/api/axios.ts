import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api-voting.workfromanywhere.name.ng";

// Lightweight token accessor decoupled from the store to avoid circular imports.
// The auth store initializes these on hydrate / login / logout.
let accessToken: string | null = null;
let refreshToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setTokens(tokens: { accessToken?: string | null; refreshToken?: string | null }) {
  if (tokens.accessToken !== undefined) accessToken = tokens.accessToken ?? null;
  if (tokens.refreshToken !== undefined) refreshToken = tokens.refreshToken ?? null;
}

export function getAccessToken() {
  return accessToken;
}
export function getRefreshToken() {
  return refreshToken;
}

export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

// Single-flight refresh
let refreshPromise: Promise<string | null> | null = null;

async function refresh(): Promise<string | null> {
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/api/v1/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } },
    );
    const newAccess = data?.accessToken ?? data?.data?.accessToken ?? data?.token ?? null;
    const newRefresh = data?.refreshToken ?? data?.data?.refreshToken ?? null;
    if (newAccess) {
      setTokens({ accessToken: newAccess, refreshToken: newRefresh ?? refreshToken });
      return newAccess;
    }
  } catch {
    // fallthrough to logout
  }
  return null;
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<{ message?: string | string[] }>) => {
    const status = error.response?.status;
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    // Try token refresh once on 401
    if (
      status === 401 &&
      original &&
      !original._retry &&
      refreshToken &&
      !original.url?.includes("/auth/")
    ) {
      original._retry = true;
      refreshPromise ??= refresh().finally(() => (refreshPromise = null));
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>)["Authorization"] = `Bearer ${newToken}`;
        return api(original);
      }
      // Refresh failed → sign out
      onUnauthorized?.();
      toast.error("Your session expired. Please sign in again.");
      return Promise.reject(error);
    }

    if (status === 401) {
      onUnauthorized?.();
    }

    // Global error toasts (skip for logout / silent endpoints)
    if (!error.config?.headers?.["x-silent"]) {
      const msg =
        (Array.isArray(error.response?.data?.message)
          ? error.response?.data?.message?.join(", ")
          : error.response?.data?.message) ||
        error.message ||
        "Something went wrong";

      if (status && status >= 400 && status !== 401) {
        toast.error(msg);
      } else if (!status) {
        toast.error("Network error. Please check your connection.");
      }
    }

    return Promise.reject(error);
  },
);
