import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hasActiveAccess, setHasActiveAccess] = useState(true);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.get("/auth/me");
      setUser(data.user);
      setHasActiveAccess(data.hasActiveAccess);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const data = await api.post("/auth/login", { email, password });
    setToken(data.token);
    setUser(data.user);
    await refresh();
  };

  const register = async (payload) => {
    const data = await api.post("/auth/register", payload);
    setToken(data.token);
    setUser(data.user);
    await refresh();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, hasActiveAccess, loading, login, register, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
