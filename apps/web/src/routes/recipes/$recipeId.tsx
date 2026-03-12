import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "../../lib/api-client";
import { RequireAuth } from "../../components/RequireAuth";
import { useAuth } from "../../features/auth/hooks/useAuth";

export const Route = createFileRoute("/recipes/$recipeId")({
  component: () => (
    <RequireAuth>
      <RecipeDetailPage />
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

function RecipeDetailPage() {
  const { recipeId } = Route.useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api<RecipeDetail>(`/recipes/${recipeId}`)
      .then(setRecipe)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [recipeId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-display text-lg" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="font-medium" style={{ color: "var(--error)" }}>
          {error}
        </p>
        <Link to="/recipes" className="mt-4 inline-block text-sm" style={{ color: "var(--accent)" }}>
          ← Back to recipes
        </Link>
      </div>
    );
  }
  const handleDelete = async () => {
    if (!window.confirm("Delete this recipe? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");
      await api(`/recipes/${recipeId}`, { method: "DELETE", token });
      navigate({ to: "/recipes" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (!recipe) return null;

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="animate-in opacity-0 flex items-center justify-between gap-4">
        <div>
          <Link to="/recipes" className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            ← Recipes
          </Link>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
            {recipe.title}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/recipes/$recipeId/edit"
            params={{ recipeId }}
            className="rounded-lg border px-3 py-2 text-sm font-medium"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border px-3 py-2 text-sm font-medium"
            style={{ borderColor: "var(--error)", color: "var(--error)" }}
          >
            {deleting ? "Deleting…" : "Delete recipe"}
          </button>
        </div>
      </div>
      <div className="animate-in opacity-0">
        {(recipe.prepTimeMinutes != null || recipe.cookTimeMinutes != null) && (
          <p className="mt-2 text-sm" style={{ color: "var(--text-faint)" }}>
            {[recipe.prepTimeMinutes != null && `Prep ${recipe.prepTimeMinutes} min`, recipe.cookTimeMinutes != null && `Cook ${recipe.cookTimeMinutes} min`].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      {recipe.description && (
        <p className="animate-in opacity-0 mt-6 leading-relaxed stagger-1" style={{ color: "var(--text-muted)" }}>
          {recipe.description}
        </p>
      )}
      {recipe.tags?.length ? (
        <div className="animate-in opacity-0 mt-6 flex flex-wrap gap-2 stagger-2">
          {recipe.tags.map((t) => (
            <span
              key={t}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
      {recipe.ingredients?.length ? (
        <div className="animate-in opacity-0 mt-10 stagger-3">
          <h2 className="font-display text-lg font-semibold" style={{ color: "var(--text)" }}>
            Ingredients
          </h2>
          <ul className="mt-4 space-y-2" style={{ color: "var(--text-muted)" }}>
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span className="h-px flex-1 shrink-0 border-b border-dotted border-[var(--border)]" aria-hidden />
                <span className="shrink-0">
                  {ing.quantity} {typeof ing.ingredientId === "object" && ing.ingredientId?.name
                    ? `${ing.ingredientId.unit} ${ing.ingredientId.name}`
                    : "ingredient"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
