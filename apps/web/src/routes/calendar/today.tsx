import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const Route = createFileRoute("/calendar/today")({
  component: CalendarTodayPage,
});

function CalendarTodayPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/calendar/day/$date", params: { date: getTodayDateString() } });
  }, [navigate]);
  return null;
}
