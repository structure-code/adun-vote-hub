import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, Role, User } from "@/types/api";

interface AuthState {
  user: User | null;
  authenticated: boolean;
  hydrated: boolean;
  setHydrated: () => void;
  setSession: (payload: AuthResponse) => void;
  setUser: (user: User | null) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
  hasRole: (roles: Role | Role[]) => boolean;
  isAdmin: () => boolean;
}

function extractUser(payload: AuthResponse) {
  return (payload.user ?? payload.data?.user ?? null) as User | null;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      authenticated: false,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      // A successful login means the server installed the HttpOnly cookies.
      // Tokens themselves never enter JavaScript or browser storage.
      setSession: (payload) =>
        set((previous) => ({
          authenticated: true,
          user: extractUser(payload) ?? previous.user,
        })),
      setUser: (user) => set({ user, authenticated: !!user }),
      clear: () => set({ user: null, authenticated: false }),
      isAuthenticated: () => get().authenticated,
      hasRole: (roles) => {
        const list = Array.isArray(roles) ? roles : [roles];
        return !!get().user && list.includes(get().user!.role);
      },
      isAdmin: () => {
        const role = get().user?.role;
        return role === "ADMIN" || role === "SUPER_ADMIN" || role === "ELECTION_OFFICER";
      },
    }),
    {
      name: "adun-auth",
      version: 2,
      partialize: (state) => ({
        user: state.user,
        authenticated: state.authenticated,
      }),
      migrate: (persistedState: unknown, version) => {
        const oldState = persistedState as {
          user?: User | null;
          authenticated?: boolean;
        };
        if (version < 2) {
          return {
            user: oldState.user ?? null,
            authenticated: !!oldState.user,
          };
        }
        return oldState;
      },
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
