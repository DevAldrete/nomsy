import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useDayCalendar, type MealType } from "../hooks/useDayCalendar";
import { useRecipes } from "../../recipes/hooks/useRecipes";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

function formatDayTitle(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type DayViewProps = { date: string };

export function DayView({ date }: DayViewProps) {
  const navigate = useNavigate();
  const { entriesByMealType, loading, addEntry, removeEntry } = useDayCalendar(date);
  const { recipes } = useRecipes();
  const [addingMealType, setAddingMealType] = useState<MealType | null>(null);
  const [showPickerForMealType, setShowPickerForMealType] = useState<MealType | null>(null);

  const isToday = date === getTodayDateString();
  const prevDate = addDays(date, -1);
  const nextDate = addDays(date, 1);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-display text-lg" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div className="animate-in opacity-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
              {formatDayTitle(date)}
            </h2>
            {isToday && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                Today
              </span>
            )}
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Planned meals for this day. Add or remove recipes below.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/calendar"
            className="rounded-[var(--radius)] border px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-hover)]"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            Back to week
          </Link>
          <div className="flex rounded-[var(--radius)] border" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              onClick={() => navigate({ to: "/calendar/day/$date", params: { date: prevDate } })}
              className="px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-hover)]"
              style={{ color: "var(--text)" }}
              aria-label="Previous day"
            >
              ← Previous day
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/calendar/day/$date", params: { date: nextDate } })}
              className="border-l px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-hover)]"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
              aria-label="Next day"
            >
              Next day →
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {MEAL_TYPES.map((mealType) => {
          const entries = entriesByMealType[mealType];
          const isAdding = addingMealType === mealType;
          const showPicker = showPickerForMealType === mealType;
          return (
            <section
              key={mealType}
              className="rounded-[var(--radius-lg)] border p-4"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                {MEAL_LABELS[mealType]}
              </h3>
              <div className="space-y-2">
                {entries.map((e) => (
                  <div
                    key={e._id}
                    className="group flex items-center justify-between gap-2 rounded-[var(--radius)] px-3 py-2 transition-colors"
                    style={{ background: "var(--accent-soft)" }}
                  >
                    <span className="truncate font-medium" style={{ color: "var(--text)" }}>
                      {typeof e.recipeId === "object" && e.recipeId?.title ? e.recipeId.title : "Recipe"}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeEntry(e._id)}
                      className="shrink-0 rounded p-0.5 text-[var(--text-faint)] transition-colors hover:bg-[var(--accent-muted)]/50 hover:text-[var(--error)]"
                      aria-label="Remove from day"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {isAdding && showPicker ? (
                  <select
                    className="w-full rounded-[var(--radius)] border bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                    style={{ borderColor: "var(--border)", color: "var(--text)" }}
                    onChange={(ev) => {
                      const id = ev.target.value;
                      if (id) {
                        addEntry(id, mealType);
                        setAddingMealType(null);
                        setShowPickerForMealType(null);
                      }
                    }}
                    onBlur={() => {
                      setAddingMealType(null);
                      setShowPickerForMealType(null);
                    }}
                    autoFocus
                  >
                    <option value="">Choose recipe…</option>
                    {recipes.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                ) : isAdding ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPickerForMealType(mealType)}
                      className="rounded-[var(--radius)] border px-3 py-2 text-sm font-medium"
                      style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
                    >
                      From my recipes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigate({ to: "/discover", search: { addToDate: date, mealType } });
                        setAddingMealType(null);
                      }}
                      className="rounded-[var(--radius)] border px-3 py-2 text-sm font-medium"
                      style={{ borderColor: "var(--border)", color: "var(--text)" }}
                    >
                      Discover
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingMealType(mealType)}
                    className="w-full rounded-[var(--radius)] border border-dashed px-3 py-2 text-sm font-medium transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/50"
                    style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
                  >
                    + Add recipe
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
