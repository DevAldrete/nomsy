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

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekRange(monday: Date): { start: string; end: string } {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  // Using just the date part ensures we cover the whole day in UTC
  // especially when the API creates dates from YYYY-MM-DD strings at T00:00:00Z
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10) + "T23:59:59.999Z",
  };
}

export function useCalendar() {
  const { getToken } = useAuth();
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeekMonday, setSelectedWeekMonday] = useState<Date>(() =>
    getMondayOfWeek(new Date()),
  );
  const { start: startStr, end: endStr } = getWeekRange(selectedWeekMonday);

  const goToPreviousWeek = useCallback(() => {
    setSelectedWeekMonday((m) => {
      const next = new Date(m);
      next.setDate(m.getDate() - 7);
      return next;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setSelectedWeekMonday((m) => {
      const next = new Date(m);
      next.setDate(m.getDate() + 7);
      return next;
    });
  }, []);

  const goToWeekContaining = useCallback((date: Date) => {
    setSelectedWeekMonday(getMondayOfWeek(date));
  }, []);

  const refetch = useCallback(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<CalendarEntry[]>(
      `/calendar/week?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`,
      { token },
    )
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
    [getToken, refetch],
  );

  const removeEntry = useCallback(
    async (id: string) => {
      const token = getToken();
      if (!token) return;
      await api(`/calendar/${id}`, { method: "DELETE", token });
      refetch();
    },
    [getToken, refetch],
  );

  return {
    entries,
    loading,
    addEntry,
    removeEntry,
    weekStart: startStr,
    weekEnd: endStr,
    selectedWeekMonday,
    goToPreviousWeek,
    goToNextWeek,
    goToWeekContaining,
  };
}
