import { createFileRoute } from "@tanstack/react-router";
import { WeekView } from "../features/calendar/components/WeekView";
import { RequireAuth } from "../components/RequireAuth";

export const Route = createFileRoute("/calendar")({
  component: () => (
    <RequireAuth>
      <CalendarPage />
    </RequireAuth>
  ),
});

function CalendarPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <WeekView />
      <p className="mt-8 text-sm" style={{ color: "var(--text-faint)" }}>
        Week runs Monday–Sunday. Add recipes from your list to plan meals.
      </p>
    </div>
  );
}
