import { createFileRoute } from "@tanstack/react-router";
import { useRecipes } from "../../features/recipes/hooks/useRecipes";
import { RecipeCard } from "../../features/recipes/components/RecipeCard";
import { Link } from "@tanstack/react-router";
import { RequireAuth } from "../../components/RequireAuth";

export const Route = createFileRoute("/recipes/")({
  component: () => (
    <RequireAuth>
      <RecipesListPage />
    </RequireAuth>
  ),
});

function RecipesListPage() {
  const { recipes, loading } = useRecipes();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-display text-lg" style={{ color: "var(--text-muted)" }}>
          Loading recipes…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="animate-in opacity-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
            Recipes
          </h1>
          <p className="mt-1 text-[var(--text-muted)]">
            Your saved recipes. Tap one to view details or add it to your calendar.
          </p>
        </div>
        <Link
          to="/recipes/new"
          className="shrink-0 rounded-lg border px-3 py-2 text-sm font-medium"
          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
        >
          New recipe
        </Link>
      </div>
      <div className="mt-8">
        {recipes.length === 0 ? (
          <div
            className="animate-in opacity-0 stagger-1 rounded-[var(--radius-lg)] border border-dashed p-12 text-center"
            style={{ borderColor: "var(--border-strong)", animationDelay: "0.05s" }}
          >
            <p className="font-display text-lg font-medium" style={{ color: "var(--text-muted)" }}>
              No recipes yet
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-faint)" }}>
              Recipes you create will show up here. Use the API or a future “New recipe” flow to add your first dish.
            </p>
            <Link
              to="/calendar"
              className="mt-6 inline-block rounded-full px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              Go to calendar
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {recipes.map((r, i) => (
              <li key={r._id} className="animate-in opacity-0" style={{ animationDelay: `${0.05 + i * 0.03}s` }}>
                <RecipeCard
                  id={r._id}
                  title={r.title}
                  description={"description" in r ? String(r.description ?? "") : undefined}
                  prepMin={"prepTimeMinutes" in r ? Number(r.prepTimeMinutes) : undefined}
                  cookMin={"cookTimeMinutes" in r ? Number(r.cookTimeMinutes) : undefined}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link to="/" className="mt-10 inline-block text-sm font-medium" style={{ color: "var(--text-muted)" }}>
        ← Home
      </Link>
    </div>
  );
}
