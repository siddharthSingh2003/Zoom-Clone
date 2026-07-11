"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { getCurrentUser, logout as apiLogout, type AuthUser } from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .catch(() => null)
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    const u = await getCurrentUser().catch(() => null);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout().catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
