import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/calendar/day/$date")({
  component: CalendarDayPage,
});

function CalendarDayPage() {
  const { date } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <p className="font-display text-lg" style={{ color: "var(--text)" }}>
        Day: {date}
      </p>
    </div>
  );
}
