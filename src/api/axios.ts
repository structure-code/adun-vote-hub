import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api-voting.workfromanywhere.name.ng";

let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  // Access and refresh tokens are HttpOnly cookies. This makes the browser
  // attach them to every same-origin or CORS credentialed request.
  withCredentials: true,
});

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

const loginPaths = ["/api/v1/auth/admin/login", "/api/v1/auth/student/login"];
const refreshPath = "/api/v1/auth/refresh";

function isLoginRequest(url?: string) {
  return loginPaths.some((path) => url?.includes(path));
}

function isRefreshRequest(url?: string) {
  return url?.includes(refreshPath) ?? false;
}

function errorMessage(error: AxiosError<{ message?: string | string[] }>) {
  const message = error.response?.data?.message;
  return (
    (Array.isArray(message) ? message.join(", ") : message) ||
    error.message ||
    "Something went wrong"
  );
}

// A burst of failed requests should produce only one refresh request.
let refreshPromise: Promise<boolean> | null = null;
let sessionExpiryHandled = false;

async function refreshSession(): Promise<boolean> {
  try {
    await axios.post(
      `${API_BASE_URL}${refreshPath}`,
      {},
      {
        timeout: 20_000,
        withCredentials: true,
      },
    );
    sessionExpiryHandled = false;
    return true;
  } catch {
    return false;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string | string[] }>) => {
    const status = error.response?.status;
    const original = error.config as RetryableRequest | undefined;
    const excludedFromRefresh = isLoginRequest(original?.url) || isRefreshRequest(original?.url);

    if (status === 401 && original && !original._retry && !excludedFromRefresh) {
      original._retry = true;
      refreshPromise ??= refreshSession().finally(() => {
        refreshPromise = null;
      });

      if (await refreshPromise) {
        // The refresh endpoint replaced the access-token cookie. Retrying the
        // original config automatically sends the new cookie.
        return api(original);
      }

      if (!sessionExpiryHandled) {
        sessionExpiryHandled = true;
        onUnauthorized?.();
        toast.error("Your session expired. Please sign in again.");
      }
      return Promise.reject(error);
    }

    // Login and refresh 401s must not recursively refresh or erase an existing
    // local session. Surface their backend message like any other API error.
    if (!error.config?.headers?.["x-silent"]) {
      if (status && status >= 400) {
        toast.error(errorMessage(error));
      } else if (!status) {
        toast.error("Network error. Please check your connection.");
      }
    }

    return Promise.reject(error);
  },
);
