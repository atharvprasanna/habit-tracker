import { useCallback, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

const MOCK_USER = {
  id: 1,
  openId: "local-user",
  name: "Habit Tracker User",
  role: "admin" as const,
};

export function useAuth(options?: UseAuthOptions) {
  const logout = useCallback(async () => {
    console.log("Logout is not required in standalone mode.");
  }, []);

  const state = useMemo(() => {
    return {
      user: MOCK_USER,
      loading: false,
      error: null,
      isAuthenticated: true,
    };
  }, []);

  return {
    ...state,
    refresh: () => Promise.resolve(),
    logout,
  };
}
