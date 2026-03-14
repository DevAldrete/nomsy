import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "../components/RequireAuth";

export const Route = createFileRoute("/discover")({
  component: () => (
    <RequireAuth>
      <DiscoverPage />
    </RequireAuth>
  ),
});

function DiscoverPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-display text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
        Discover recipes
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
        Browse published recipes from the community.
      </p>
    </div>
  );
}
