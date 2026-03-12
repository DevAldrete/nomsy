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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading recipes…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
        <div className="mt-4 space-y-2">
          {recipes.length === 0 ? (
            <p className="text-gray-600">No recipes yet.</p>
          ) : (
            recipes.map((r) => <RecipeCard key={r._id} id={r._id} title={r.title} />)
          )}
        </div>
        <Link to="/" className="mt-6 inline-block text-sm text-blue-600 hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
