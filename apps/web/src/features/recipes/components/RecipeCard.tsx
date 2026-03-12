import { Link } from "@tanstack/react-router";

type Props = { title: string; id: string };

export function RecipeCard({ title, id }: Props) {
  return (
    <Link
      to="/recipes/$recipeId"
      params={{ recipeId: id }}
      className="block p-4 border rounded-lg hover:bg-gray-50"
    >
      <h3 className="font-medium text-gray-900">{title}</h3>
    </Link>
  );
}
