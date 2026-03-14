import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../auth/hooks/useAuth";

export type CalendarEntry = {
  _id: string;
  userId: string;
  recipeId: { _id: string; title: string };
  date: string;
  mealType: string;
};

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

function groupEntriesByMealType(entries: CalendarEntry[]): Record<MealType, CalendarEntry[]> {
  const grouped = MEAL_TYPES.reduce(
    (acc, mt) => {
      acc[mt] = [];
      return acc;
    },
    {} as Record<MealType, CalendarEntry[]>,
  );
  for (const e of entries) {
    if (MEAL_TYPES.includes(e.mealType as MealType)) {
      grouped[e.mealType as MealType].push(e);
    }
  }
  return grouped;
}

export function useDayCalendar(dateStr: string) {
  const { getToken } = useAuth();
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const start = dateStr;
  const end = `${dateStr}T23:59:59.999Z`;

  const refetch = useCallback(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<CalendarEntry[]>(
      `/calendar/week?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
      { token },
    )
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [getToken, start, end]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addEntry = useCallback(
    async (recipeId: string, mealType: string) => {
      const token = getToken();
      if (!token) return;
      await api("/calendar", {
        method: "POST",
        token,
        body: JSON.stringify({ recipeId, date: dateStr, mealType }),
      });
      refetch();
    },
    [getToken, dateStr, refetch],
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

  const entriesByMealType = groupEntriesByMealType(entries);

  return {
    entries,
    entriesByMealType,
    loading,
    refetch,
    addEntry,
    removeEntry,
  };
}
