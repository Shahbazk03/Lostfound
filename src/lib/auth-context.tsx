"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar?: string | null;
  hasSubscription?: boolean;
  verified?: boolean;
}

/** Reads a JSON body without throwing on empty or non-JSON responses. */
async function readJson(res: Response): Promise<Record<string, any>> {
  return res.json().catch(() => ({}));
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    phone?: string
  ) => Promise<{ requireVerification: boolean }>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Callbacks are memoized so consumers can safely use them as effect deps.
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await readJson(res);
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      // Includes 429 rate-limit responses, which carry a readable { error }.
      const data = await readJson(res);
      throw new Error(data.error || "Login failed");
    }

    const data = await readJson(res);
    setUser(data.user);
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    name: string,
    phone?: string
  ) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, phone }),
    });

    if (!res.ok) {
      // Includes 429 rate-limit responses, which carry a readable { error }.
      const data = await readJson(res);
      throw new Error(data.error || "Registration failed");
    }

    const data = await readJson(res);
    return { requireVerification: data.requireVerification };
  }, []);

  const verifyOTP = useCallback(async (email: string, otp: string) => {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    if (!res.ok) {
      // Includes 429 rate-limit responses, which carry a readable { error }.
      const data = await readJson(res);
      throw new Error(data.error || "Verification failed");
    }

    const data = await readJson(res);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, verifyOTP, logout, refreshUser }),
    [user, loading, login, register, verifyOTP, logout, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
