import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api-client";

export type DiscoverRecipe = {
  _id: string;
  title: string;
  description?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  tags?: string[];
  createdBy?: string;
  publishedAt?: string | null;
};

type DiscoverFilters = { search?: string; tags?: string[] };

export function useDiscover(filters?: DiscoverFilters) {
  const [recipes, setRecipes] = useState<DiscoverRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filters?.search?.trim()) params.set("search", filters.search.trim());
    if (filters?.tags?.length) params.set("tags", filters.tags!.join(","));
    const qs = params.toString();
    api<DiscoverRecipe[]>(`/recipes/discover${qs ? `?${qs}` : ""}`)
      .then(setRecipes)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load");
        setRecipes([]);
      })
      .finally(() => setLoading(false));
  }, [filters?.search, filters?.tags?.join(",")]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { recipes, loading, error, refetch };
}
