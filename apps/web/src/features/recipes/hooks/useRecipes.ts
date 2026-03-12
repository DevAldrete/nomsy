import { useEffect, useState } from "react";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../auth/hooks/useAuth";

export function useRecipes() {
  const { getToken } = useAuth();
  const [recipes, setRecipes] = useState<{ _id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api<{ _id: string; title: string }[]>("/recipes", { token })
      .then(setRecipes)
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  }, [getToken]);

  return { recipes, loading };
}
