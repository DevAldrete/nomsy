import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../auth/hooks/useAuth";

export type Profile = {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  bio?: string;
  username?: string;
};

export function useProfile() {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    const token = getToken();
    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api<Profile>("/profile", { token })
      .then(setProfile)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load");
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, [getToken]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateProfile = useCallback(
    async (data: Partial<Profile>) => {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");
      const updated = await api<Profile>("/profile", {
        token,
        method: "PUT",
        body: JSON.stringify(data),
      });
      setProfile(updated);
      return updated;
    },
    [getToken],
  );

  return { profile, loading, error, refetch, updateProfile };
}
