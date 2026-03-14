import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "../../lib/api-client";
import { RequireAuth } from "../../components/RequireAuth";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";
import { useFavorites } from "../../features/discover/hooks/useFavorites";

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
  createdBy?: string;
  publishedAt?: string | null;
  ingredients?: { ingredientId: { name: string; unit: string }; quantity: number }[];
};

function RecipeDetailPage() {
  const { recipeId } = Route.useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useCurrentUser();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingCopy, setSavingCopy] = useState(false);
  const [addingToCalendar, setAddingToCalendar] = useState(false);

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
  const isOwner = user?.id && recipe?.createdBy && user.id === recipe.createdBy;
  const isPublished = Boolean(recipe?.publishedAt);
  const showDiscoveryActions = !isOwner && isPublished;

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

  const handlePublish = async () => {
    const token = getToken();
    if (!token) return;
    setPublishing(true);
    try {
      await api(`/recipes/${recipeId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ publishedAt: new Date().toISOString() }),
      });
      setRecipe((prev) => (prev ? { ...prev, publishedAt: new Date().toISOString() } : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    const token = getToken();
    if (!token) return;
    setPublishing(true);
    try {
      await api(`/recipes/${recipeId}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ publishedAt: null }),
      });
      setRecipe((prev) => (prev ? { ...prev, publishedAt: null } : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unpublish failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveToMyRecipes = async () => {
    const token = getToken();
    if (!token) return;
    setSavingCopy(true);
    try {
      const newRecipe = await api<{ _id: string }>(`/recipes/${recipeId}/copy`, { method: "POST", token });
      navigate({ to: "/recipes/$recipeId", params: { recipeId: newRecipe._id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingCopy(false);
    }
  };

  const handleAddToCalendar = async () => {
    const token = getToken();
    if (!token) return;
    const date = prompt("Date (YYYY-MM-DD):");
    const mealType = prompt("Meal (breakfast, lunch, dinner, snack):");
    if (!date || !mealType) return;
    setAddingToCalendar(true);
    try {
      let rid = recipeId;
      try {
        const newRecipe = await api<{ _id: string }>(`/recipes/${recipeId}/copy`, { method: "POST", token });
        rid = newRecipe._id;
      } catch {
        // might already own
      }
      await api("/calendar", { method: "POST", token, body: JSON.stringify({ recipeId: rid, date, mealType }) });
      navigate({ to: "/calendar/day/$date", params: { date } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add to calendar failed");
    } finally {
      setAddingToCalendar(false);
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
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {isOwner && (
            <>
              <Link
                to="/recipes/$recipeId/edit"
                params={{ recipeId }}
                className="rounded-lg border px-3 py-2 text-sm font-medium"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                Edit
              </Link>
              {isPublished ? (
                <button
                  type="button"
                  onClick={handleUnpublish}
                  disabled={publishing}
                  className="rounded-lg border px-3 py-2 text-sm font-medium"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  {publishing ? "…" : "Unpublish"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="rounded-lg border px-3 py-2 text-sm font-medium"
                  style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
                >
                  {publishing ? "…" : "Publish"}
                </button>
              )}
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg border px-3 py-2 text-sm font-medium"
                style={{ borderColor: "var(--error)", color: "var(--error)" }}
              >
                {deleting ? "Deleting…" : "Delete recipe"}
              </button>
            </>
          )}
          {showDiscoveryActions && (
            <>
              <button
                type="button"
                onClick={handleSaveToMyRecipes}
                disabled={savingCopy}
                className="rounded-lg border px-3 py-2 text-sm font-medium"
                style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
              >
                {savingCopy ? "Saving…" : "Save to my recipes"}
              </button>
              <button
                type="button"
                onClick={() => (isFavorite(recipeId) ? removeFavorite(recipeId) : addFavorite(recipeId))}
                className="rounded-lg border px-3 py-2 text-sm font-medium"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                {isFavorite(recipeId) ? "Unfavorite" : "Favorite"}
              </button>
              <button
                type="button"
                onClick={handleAddToCalendar}
                disabled={addingToCalendar}
                className="rounded-lg border px-3 py-2 text-sm font-medium"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                {addingToCalendar ? "Adding…" : "Add to calendar"}
              </button>
            </>
          )}
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
