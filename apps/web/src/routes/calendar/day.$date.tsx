import { createFileRoute, Navigate } from "@tanstack/react-router";
import { DayView } from "../../features/calendar/components/DayView";

function isValidDateParam(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + "T12:00:00");
  return !Number.isNaN(d.getTime());
}

export const Route = createFileRoute("/calendar/day/$date")({
  component: CalendarDayPage,
});

function CalendarDayPage() {
  const { date } = Route.useParams();
  if (!isValidDateParam(date)) {
    return <Navigate to="/calendar/today" />;
  }
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <DayView date={date} />
    </div>
  );
}
