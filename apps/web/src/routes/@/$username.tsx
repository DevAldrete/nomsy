import { createFileRoute, Link } from "@tanstack/react-router";
import { useUserRecipes } from "../../features/profile/hooks/useUserRecipes";
import { usePublicProfile } from "../../features/profile/hooks/usePublicProfile";

export const Route = createFileRoute("/@/$username")({
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { username } = Route.useParams();
  const { profile, loading: profileLoading } = usePublicProfile(username);
  const {
    recipes,
    loading: recipesLoading,
    error,
    total,
  } = useUserRecipes(username);

  const loading = profileLoading || recipesLoading;
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error || !profile)
    return (
      <div className="p-8 text-center text-red-500">
        {error ?? "Profile not found"}
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-8 text-center">
        <img
          src={profile.avatar}
          alt={profile.displayName}
          className="mx-auto mb-4 h-24 w-24 rounded-full"
        />
        <h1 className="text-2xl font-bold">{profile.displayName}</h1>
        {profile.bio && (
          <p className="mt-2 text-gray-500">{profile.bio}</p>
        )}
        <p className="mt-1 text-gray-400">{total} published recipes</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {recipes.map((recipe) => (
          <Link
            key={recipe._id}
            to="/recipes/$recipeId"
            params={{ recipeId: recipe._id }}
            className="rounded-lg border p-4 transition hover:bg-gray-50"
          >
            <h3 className="font-semibold">{recipe.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">
              {recipe.description}
            </p>
            <div className="mt-2 flex gap-2">
              {recipe.likesCount != null && recipe.likesCount > 0 ? (
                <span>❤️ {recipe.likesCount}</span>
              ) : null}
              {recipe.averageStars != null ? (
                <span>⭐ {recipe.averageStars.toFixed(1)}</span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
