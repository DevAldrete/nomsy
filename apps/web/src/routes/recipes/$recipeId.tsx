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

  if (loading) return <div className="p-6 text-gray-600">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!recipe) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">{recipe.title}</h1>
        {recipe.description && <p className="mt-2 text-gray-600">{recipe.description}</p>}
        <div className="mt-4 flex gap-4 text-sm text-gray-500">
          {recipe.prepTimeMinutes != null && <span>Prep: {recipe.prepTimeMinutes} min</span>}
          {recipe.cookTimeMinutes != null && <span>Cook: {recipe.cookTimeMinutes} min</span>}
        </div>
        {recipe.tags?.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {recipe.tags.map((t) => (
              <span key={t} className="rounded bg-gray-200 px-2 py-0.5 text-sm text-gray-700">
                {t}
              </span>
            ))}
          </div>
        ) : null}
        {recipe.ingredients?.length ? (
          <div className="mt-6">
            <h2 className="font-semibold text-gray-900">Ingredients</h2>
            <ul className="mt-2 list-disc list-inside text-gray-700">
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>
                  {ing.quantity} {typeof ing.ingredientId === "object" && ing.ingredientId?.name
                    ? `${ing.ingredientId.unit} ${ing.ingredientId.name}`
                    : "ingredient"}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <Link to="/recipes" className="mt-6 inline-block text-sm text-blue-600 hover:underline">
          Back to recipes
        </Link>
      </div>
    </div>
  );
}
