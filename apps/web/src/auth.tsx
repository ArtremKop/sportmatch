import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";
import { disconnectSocket } from "./socket";
import type { User } from "./types";

type AuthCtx = {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (u: User | null) => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setReady(true);
      return;
    }
    api<{ user: User }>("/auth/me")
      .then((r) => setUser(r.user))
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      })
      .finally(() => setReady(true));
  }, []);

  async function login(email: string, password: string) {
    const r = await api<{ user: User; accessToken: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    localStorage.setItem("accessToken", r.accessToken);
    localStorage.setItem("refreshToken", r.refreshToken);
    setUser(r.user);
  }

  async function register(name: string, email: string, password: string) {
    const r = await api<{ user: User; accessToken: string; refreshToken: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
      skipAuth: true,
    });
    localStorage.setItem("accessToken", r.accessToken);
    localStorage.setItem("refreshToken", r.refreshToken);
    setUser(r.user);
  }

  function logout() {
    const refreshToken = localStorage.getItem("refreshToken");
    api("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }).catch(() => {});
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    disconnectSocket();
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, ready, login, register, logout, setUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
