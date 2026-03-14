import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "../../../lib/api-client";

const TOKEN_KEY = "nomsy_token";

export function useAuth() {
  const navigate = useNavigate();

  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.token) localStorage.setItem(TOKEN_KEY, res.token);
    navigate({ to: "/" });
  }, [navigate]);

  const register = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.token) localStorage.setItem(TOKEN_KEY, res.token);
    navigate({ to: "/" });
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    navigate({ to: "/login" });
  }, [navigate]);

  return { login, register, logout, getToken };
}
