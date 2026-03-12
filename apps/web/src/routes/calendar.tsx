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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <WeekView />
      </div>
    </div>
  );
}
