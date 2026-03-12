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
    return <p className="text-gray-600">Loading calendar…</p>;
  }

  const getEntriesFor = (date: Date, mealType: string) => {
    const dateStr = date.toISOString().slice(0, 10);
    return entries.filter(
      (e) => e.date.startsWith(dateStr) && e.mealType === mealType
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">This week</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Day</th>
              {MEAL_TYPES.map((mt) => (
                <th key={mt} className="px-3 py-2 text-left text-sm font-medium text-gray-700 capitalize">
                  {mt}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weekDays.map((day) => (
              <tr key={day.toISOString()} className="border-t border-gray-200">
                <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                  {day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </td>
                {MEAL_TYPES.map((mealType) => {
                  const slotEntries = getEntriesFor(day, mealType);
                  const dateStr = day.toISOString().slice(0, 10);
                  const isAdding = addingSlot?.date === dateStr && addingSlot?.mealType === mealType;
                  return (
                    <td key={mealType} className="px-3 py-2 align-top">
                      <div className="min-h-[60px] space-y-1">
                        {slotEntries.map((e) => (
                          <div
                            key={e._id}
                            className="flex items-center justify-between gap-1 rounded bg-blue-50 px-2 py-1 text-sm"
                          >
                            <span className="truncate">
                              {typeof e.recipeId === "object" && e.recipeId?.title ? e.recipeId.title : "Recipe"}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeEntry(e._id)}
                              className="text-red-600 hover:underline"
                              aria-label="Remove"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {isAdding ? (
                          <select
                            className="block w-full text-sm border border-gray-300 rounded px-2 py-1"
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
                            className="text-xs text-blue-600 hover:underline"
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
