import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Nomsy</h1>
        <p className="mt-2 text-gray-600">Meal recommender & planner</p>
        <div className="mt-4 flex gap-4 justify-center">
          <a href="/login" className="text-blue-600 hover:underline">Log in</a>
          <a href="/register" className="text-blue-600 hover:underline">Register</a>
        </div>
      </div>
    </div>
  );
}
