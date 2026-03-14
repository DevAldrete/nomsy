import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RequireAuth } from "../components/RequireAuth";
import { useDiscover } from "../features/discover/hooks/useDiscover";
import { RecipeCard } from "../features/recipes/components/RecipeCard";

export const Route = createFileRoute("/discover")({
  component: () => (
    <RequireAuth>
      <DiscoverPage />
    </RequireAuth>
  ),
});

function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const { recipes, loading, error } = useDiscover(
    submittedSearch ? { search: submittedSearch } : undefined
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(search);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-display text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
        Discover recipes
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
        Browse published recipes from the community.
      </p>
      <form onSubmit={handleSearch} className="mt-4">
        <div className="flex gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes…"
            className="flex-1 rounded-[var(--radius)] border bg-[var(--surface)] px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          />
          <button
            type="submit"
            className="rounded-[var(--radius)] border px-3 py-2 text-sm font-medium"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            Search
          </button>
        </div>
      </form>
      {loading && (
        <p className="mt-6 font-display text-lg" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      )}
      {error && (
        <p className="mt-6 text-sm" style={{ color: "var(--error)" }}>
          {error}
        </p>
      )}
      {!loading && !error && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <RecipeCard
              key={r._id}
              id={r._id}
              title={r.title}
              description={r.description}
              prepMin={r.prepTimeMinutes}
              cookMin={r.cookTimeMinutes}
            />
          ))}
        </div>
      )}
      {!loading && !error && recipes.length === 0 && (
        <p className="mt-6 text-sm" style={{ color: "var(--text-muted)" }}>
          No published recipes yet. Publish one from your recipe page to share it.
        </p>
      )}
    </div>
  );
}
