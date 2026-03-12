import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "../../lib/api-client";
import { Link } from "@tanstack/react-router";
import { RequireAuth } from "../../components/RequireAuth";

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
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  if (!recipe) return null;

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="animate-in opacity-0">
        <Link to="/recipes" className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          ← Recipes
        </Link>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
          {recipe.title}
        </h1>
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
