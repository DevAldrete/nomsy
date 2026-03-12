import { useState } from "react";
import { useCalendar } from "../hooks/useCalendar";
import { useRecipes } from "../../recipes/hooks/useRecipes";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export function WeekView() {
  const { entries, loading, addEntry, removeEntry, weekStart } = useCalendar();
  const { recipes } = useRecipes();
  const [addingSlot, setAddingSlot] = useState<{ date: string; mealType: string } | null>(null);

  const weekDays = (() => {
    const start = new Date(weekStart);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  })();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="font-display text-lg" style={{ color: "var(--text-muted)" }}>
          Loading calendar…
        </p>
      </div>
    );
  }

  const getEntriesFor = (date: Date, mealType: string) => {
    const dateStr = date.toISOString().slice(0, 10);
    return entries.filter((e) => e.date.startsWith(dateStr) && e.mealType === mealType);
  };

  return (
    <div className="animate-in opacity-0 space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight" style={{ color: "var(--text)" }}>
          This week
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Add recipes to each slot. Tap a meal to remove it.
        </p>
      </div>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)]" style={{ borderColor: "var(--border)" }}>
        <table className="min-w-full border-collapse">
          <thead>
            <tr style={{ background: "var(--bg-subtle)" }}>
              <th className="sticky left-0 z-10 min-w-[120px] border-b border-r px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                Day
              </th>
              {MEAL_TYPES.map((mt) => (
                <th key={mt} className="min-w-[100px] border-b px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider sm:min-w-[120px]" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  {mt}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekDays.map((day) => (
              <tr key={day.toISOString()} className="border-b transition-colors hover:bg-[var(--surface-hover)]/50" style={{ borderColor: "var(--border)" }}>
                <td className="sticky left-0 z-10 border-r bg-[var(--surface)] px-4 py-3 text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                  {day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </td>
                {MEAL_TYPES.map((mealType) => {
                  const slotEntries = getEntriesFor(day, mealType);
                  const dateStr = day.toISOString().slice(0, 10);
                  const isAdding = addingSlot?.date === dateStr && addingSlot?.mealType === mealType;
                  return (
                    <td key={mealType} className="align-top px-3 py-2" style={{ borderColor: "var(--border)" }}>
                      <div className="min-h-[72px] space-y-1.5">
                        {slotEntries.map((e) => (
                          <div
                            key={e._id}
                            className="group flex items-center justify-between gap-2 rounded-[var(--radius)] px-2.5 py-1.5 text-sm transition-colors"
                            style={{ background: "var(--accent-soft)" }}
                          >
                            <span className="truncate font-medium" style={{ color: "var(--text)" }}>
                              {typeof e.recipeId === "object" && e.recipeId?.title ? e.recipeId.title : "Recipe"}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeEntry(e._id)}
                              className="shrink-0 rounded p-0.5 text-[var(--text-faint)] transition-colors hover:bg-[var(--accent-muted)]/50 hover:text-[var(--error)]"
                              aria-label="Remove from calendar"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {isAdding ? (
                          <select
                            className="w-full rounded-[var(--radius)] border bg-[var(--surface)] px-2 py-1.5 text-sm focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                            style={{ borderColor: "var(--border)", color: "var(--text)" }}
                            onChange={(ev) => {
                              const id = ev.target.value;
                              if (id) {
                                addEntry(id, dateStr, mealType);
                                setAddingSlot(null);
                              }
                            }}
                            onBlur={() => setAddingSlot(null)}
                            autoFocus
                          >
                            <option value="">Choose recipe…</option>
                            {recipes.map((r) => (
                              <option key={r._id} value={r._id}>
                                {r.title}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setAddingSlot({ date: dateStr, mealType })}
                            className="w-full rounded-[var(--radius)] border border-dashed px-2 py-2 text-xs font-medium transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/50"
                            style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
