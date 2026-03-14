import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { RequireAuth } from "../../components/RequireAuth";
import { RecipeForm } from "../../features/recipes/components/RecipeForm";
import type { RecipeFormData } from "../../features/recipes/components/RecipeForm";
import { api } from "../../lib/api-client";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/recipes/new")({
  component: () => (
    <RequireAuth>
      <NewRecipePage />
    </RequireAuth>
  ),
});

function NewRecipePage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: RecipeFormData) => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");
      const recipe = await api<{ _id: string }>("/recipes", {
        method: "POST",
        token,
        body: JSON.stringify({
          title: data.title,
          description: data.description || undefined,
          prepTimeMinutes: data.prepTimeMinutes,
          cookTimeMinutes: data.cookTimeMinutes,
          tags: data.tags.length ? data.tags : undefined,
          ingredients: data.ingredients,
        }),
      });
      navigate({ to: "/recipes/$recipeId", params: { recipeId: recipe._id } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <Link to="/recipes" className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
        ← Recipes
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
        New recipe
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        Add a recipe to your collection. You can add it to your calendar from the recipe page.
      </p>
      <div className="mt-8">
        <RecipeForm onSubmit={handleSubmit} loading={loading} submitLabel="Create recipe" />
      </div>
    </div>
  );
}
