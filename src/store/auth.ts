import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setTokens } from "@/api/axios";
import type { AuthResponse, Role, User } from "@/types/api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  setHydrated: () => void;
  setSession: (payload: AuthResponse) => void;
  setUser: (user: User | null) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
  hasRole: (roles: Role | Role[]) => boolean;
  isAdmin: () => boolean;
}

function extractTokens(payload: AuthResponse) {
  const accessToken =
    payload.accessToken ?? payload.data?.accessToken ?? payload.token ?? null;
  const refreshToken = payload.refreshToken ?? payload.data?.refreshToken ?? null;
  const user = (payload.user ?? payload.data?.user ?? null) as User | null;
  return { accessToken, refreshToken, user };
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setSession: (payload) => {
        const { accessToken, refreshToken, user } = extractTokens(payload);
        setTokens({ accessToken, refreshToken });
        set((prev) => ({
          accessToken,
          refreshToken: refreshToken ?? prev.refreshToken,
          user: user ?? prev.user,
        }));
      },
      setUser: (user) => set({ user }),
      clear: () => {
        setTokens({ accessToken: null, refreshToken: null });
        set({ user: null, accessToken: null, refreshToken: null });
      },
      isAuthenticated: () => !!get().accessToken,
      hasRole: (roles) => {
        const list = Array.isArray(roles) ? roles : [roles];
        return !!get().user && list.includes(get().user!.role);
      },
      isAdmin: () => {
        const r = get().user?.role;
        return r === "ADMIN" || r === "SUPER_ADMIN" || r === "ELECTION_OFFICER";
      },
    }),
    {
      name: "adun-auth",
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          setTokens({
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
          });
          state.setHydrated();
        }
      },
    },
  ),
);