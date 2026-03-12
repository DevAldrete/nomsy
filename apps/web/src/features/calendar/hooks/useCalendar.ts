import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../auth/hooks/useAuth";

type CalendarEntry = {
  _id: string;
  userId: string;
  recipeId: { _id: string; title: string };
  date: string;
  mealType: string;
};

function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return {
    start: monday.toISOString(),
    end: sunday.toISOString(),
  };
}

export function useCalendar(weekStart?: Date) {
  const { getToken } = useAuth();
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const start = weekStart ?? new Date();
  const { start: startStr, end: endStr } = getWeekRange(start);

  const refetch = useCallback(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<CalendarEntry[]>(`/calendar/week?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`, { token })
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [getToken, startStr, endStr]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addEntry = useCallback(
    async (recipeId: string, date: string, mealType: string) => {
      const token = getToken();
      if (!token) return;
      await api("/calendar", {
        method: "POST",
        token,
        body: JSON.stringify({ recipeId, date, mealType }),
      });
      refetch();
    },
    [getToken, refetch]
  );

  const removeEntry = useCallback(
    async (id: string) => {
      const token = getToken();
      if (!token) return;
      await api(`/calendar/${id}`, { method: "DELETE", token });
      refetch();
    },
    [getToken, refetch]
  );

  return { entries, loading, addEntry, removeEntry, weekStart: startStr, weekEnd: endStr };
}
