import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export interface AuthUser {
  id: string;
  email: string;
  roles?: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "ai-reporting-auth";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed.user);
      setToken(parsed.token);
      api.defaults.headers.common.Authorization = `Bearer ${parsed.token}`;
    }
  }, []);

  const login = (newToken: string, newUser: AuthUser) => {
    setUser(newUser);
    setToken(newToken);
    api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: newToken, user: newUser }));
    navigate("/");
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    delete api.defaults.headers.common.Authorization;
    navigate("/login");
  };

  const value = useMemo(() => ({ user, token, login, logout }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
