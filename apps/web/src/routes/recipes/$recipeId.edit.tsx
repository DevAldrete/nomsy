import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RequireAuth } from "../../components/RequireAuth";
import { RecipeForm } from "../../features/recipes/components/RecipeForm";
import type { RecipeFormData } from "../../features/recipes/components/RecipeForm";
import { api } from "../../lib/api-client";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/recipes/$recipeId/edit")({
  component: () => (
    <RequireAuth>
      <EditRecipePage />
    </RequireAuth>
  ),
});

type RecipeDetail = {
  _id: string;
  title: string;
  description?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  tags?: string[];
  ingredients?: { ingredientId: { name: string; unit: string }; quantity: number }[];
};

function EditRecipePage() {
  const { recipeId } = Route.useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<RecipeFormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api<RecipeDetail>(`/recipes/${recipeId}`, { token })
      .then((recipe) => {
        setInitialData({
          title: recipe.title,
          description: recipe.description ?? "",
          prepTimeMinutes: recipe.prepTimeMinutes ?? 0,
          cookTimeMinutes: recipe.cookTimeMinutes ?? 0,
          tags: recipe.tags ?? [],
          ingredients:
            recipe.ingredients?.map((ing) => ({
              quantity: ing.quantity,
              unit: typeof ing.ingredientId === "object" && ing.ingredientId?.unit ? ing.ingredientId.unit : "g",
              name: typeof ing.ingredientId === "object" && ing.ingredientId?.name ? ing.ingredientId.name : "",
            })) ?? [{ quantity: 0, unit: "g", name: "" }],
        });
      })
      .catch(() => setError("Recipe not found"))
      .finally(() => {});
  }, [recipeId, getToken]);

  const handleSubmit = async (data: RecipeFormData) => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");
      await api(`/recipes/${recipeId}`, {
        method: "PATCH",
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
      navigate({ to: "/recipes/$recipeId", params: { recipeId } });
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="font-medium" style={{ color: "var(--error)" }}>{error}</p>
        <Link to="/recipes" className="mt-4 inline-block text-sm" style={{ color: "var(--accent)" }}>
          ← Back to recipes
        </Link>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-display text-lg" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <Link to="/recipes/$recipeId" params={{ recipeId }} className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
        ← Recipe
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
        Edit recipe
      </h1>
      <div className="mt-8">
        <RecipeForm
          initialData={initialData}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
