import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../auth/hooks/useAuth";

type FavoriteItem = { recipeId: { _id: string } };

export function useFavorites() {
  const { getToken } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    const token = getToken();
    if (!token) {
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    api<FavoriteItem[]>("/favorites", { token })
      .then((list) => setFavoriteIds(new Set(list.map((f) => (f.recipeId as { _id: string })._id))))
      .catch(() => setFavoriteIds(new Set()))
      .finally(() => setLoading(false));
  }, [getToken]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addFavorite = useCallback(
    async (recipeId: string) => {
      const token = getToken();
      if (!token) return;
      await api(`/favorites/${recipeId}`, { method: "POST", token });
      setFavoriteIds((prev) => new Set(prev).add(recipeId));
    },
    [getToken]
  );

  const removeFavorite = useCallback(
    async (recipeId: string) => {
      const token = getToken();
      if (!token) return;
      await api(`/favorites/${recipeId}`, { method: "DELETE", token });
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(recipeId);
        return next;
      });
    },
    [getToken]
  );

  const isFavorite = useCallback(
    (recipeId: string) => favoriteIds.has(recipeId),
    [favoriteIds]
  );

  return { favoriteIds, loading, addFavorite, removeFavorite, isFavorite, refetch };
}
