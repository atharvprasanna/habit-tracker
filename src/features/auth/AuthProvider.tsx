import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";
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
  /** True while the saved session is being restored on page load */
  loading: boolean;
  /** True after the user opened a password-reset link and must choose a new password */
  recovering: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  /** Resolves `needsConfirmation: true` when Supabase requires the email to be confirmed first */
  signUpWithPassword: (name: string, email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const notConfigured = () => Promise.reject(new Error("Sign-in is not configured."));

const AuthContext = createContext<AuthCtx>({
  user: null,
  isAuthenticated: false,
  loading: false,
  recovering: false,
  signInWithPassword: notConfigured,
  signUpWithPassword: notConfigured,
  sendPasswordReset: notConfigured,
  updatePassword: notConfigured,
  logout: () => Promise.resolve(),
});

function toAuthUser(u: User): AuthUser {
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const email = u.email ?? "";
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    email.split("@")[0] ||
    "User";
  const picture =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    undefined;
  return { id: u.id, name, email, picture };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(!!supabase);
  const [recovering, setRecovering] = useState(false);
  const currentUserId = useRef<string | null>(null);

  useEffect(() => {
    // Old versions kept a profile in localStorage; it is no longer used, so remove it.
    try { localStorage.removeItem("habit-tracker-auth-user"); } catch { /* ignore */ }

    if (!supabase) return;
    const client = supabase;

    const applySession = (session: { user: User } | null) => {
      const nextId = session?.user.id ?? null;
      // Point the storage layer at the right account BEFORE any query can run
      setStorageUser(nextId ?? "default");
      if (currentUserId.current !== nextId) {
        // Never show one account's cached data to another account
        queryClient.clear();
        currentUserId.current = nextId;
      }
      setUser(session ? toAuthUser(session.user) : null);
      if (!session) setRecovering(false);
    };

    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      // Do not call other Supabase methods synchronously inside this callback (deadlock risk)
      setTimeout(() => {
        applySession(session);
        if (event === "PASSWORD_RECOVERY") setRecovering(true);
        if (event === "INITIAL_SESSION") setLoading(false);
      }, 0);
    });

    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Sign-in is not configured.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUpWithPassword = useCallback(async (name: string, email: string, password: string) => {
    if (!supabase) throw new Error("Sign-in is not configured.");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!supabase) throw new Error("Sign-in is not configured.");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!supabase) throw new Error("Sign-in is not configured.");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setRecovering(false);
  }, []);

  const logout = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      recovering,
      signInWithPassword,
      signUpWithPassword,
      sendPasswordReset,
      updatePassword,
      logout,
    }),
    [user, loading, recovering, signInWithPassword, signUpWithPassword, sendPasswordReset, updatePassword, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
