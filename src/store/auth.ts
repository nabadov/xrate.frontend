import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthTokens } from "@/types/auth";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  _rehydrated: boolean;
  setTokens: (tokens: AuthTokens) => void;
  clearTokens: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      _rehydrated: false,
      setTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),
      clearTokens: () =>
        set({ accessToken: null, refreshToken: null }),
      isAuthenticated: () =>
        Boolean(get().accessToken && get().refreshToken),
    }),
    {
      name: "xrate-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (_state, err) => {
        useAuthStore.setState({ _rehydrated: true });
      },
    }
  )
);
