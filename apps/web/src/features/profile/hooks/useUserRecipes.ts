import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api-client";

export type UserRecipe = {
  _id: string;
  title: string;
  description?: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  tags?: string[];
  publishedAt?: string | null;
  likesCount?: number;
  averageStars?: number | null;
  starsCount?: number;
};

type RecipeListResponse = {
  recipes: UserRecipe[];
  total: number;
  page: number;
  limit: number;
};

export function useUserRecipes(
  username: string,
  options?: { page?: number; tag?: string; sort?: string },
) {
  const [recipes, setRecipes] = useState<UserRecipe[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = options?.page ?? 1;
  const tag = options?.tag;
  const sort = options?.sort ?? "recent";

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (tag) params.set("tag", tag);
    if (sort) params.set("sort", sort);

    api<RecipeListResponse>(`/users/${username}/recipes?${params}`)
      .then((res) => {
        setRecipes(res.recipes);
        setTotal(res.total);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load");
        setRecipes([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [username, page, tag, sort]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { recipes, total, loading, error, refetch };
}
