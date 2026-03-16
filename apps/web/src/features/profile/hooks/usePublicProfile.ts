import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api-client";

export type PublicProfile = {
  id: string;
  displayName: string;
  avatar: string;
  bio?: string;
  username: string;
  createdAt: string;
  recipeCount: number;
};

export function usePublicProfile(username: string) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    api<PublicProfile>(`/users/${username}`)
      .then(setProfile)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load");
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, loading, error, refetch };
}
