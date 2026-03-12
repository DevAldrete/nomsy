import { useEffect, useState } from "react";
import { api } from "../../../lib/api-client";
import { useAuth } from "./useAuth";

type User = { id: string; email: string } | null;

export function useCurrentUser() {
  const { getToken } = useAuth();
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api<{ id: string; email: string }>("/auth/me", { token })
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [getToken]);

  return { user, loading };
}
