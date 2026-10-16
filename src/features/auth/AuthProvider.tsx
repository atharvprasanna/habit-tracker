import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { setStorageUser } from "../../lib/storage";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface AuthCtx {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AUTH_KEY = "habit-tracker-auth-user";

function getPersistedUser(): AuthUser | null {
  try {
    const s = localStorage.getItem(AUTH_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = getPersistedUser();
    if (stored) setStorageUser(stored.id);
    return stored;
  });

  const login = useCallback((googleUser: AuthUser) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(googleUser));
    setStorageUser(googleUser.id);
    setUser(googleUser);
  }, []);

  const logout = useCallback(() => {
    // Revoke Google token if GIS is loaded
    if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.disableAutoSelect();
    }
    localStorage.removeItem(AUTH_KEY);
    setStorageUser("default");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
