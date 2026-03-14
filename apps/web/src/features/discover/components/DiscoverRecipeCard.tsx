import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { api } from "../../../lib/api-client";
import { useAuth } from "../../auth/hooks/useAuth";
import type { DiscoverRecipe } from "../hooks/useDiscover";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

type Props = {
  recipe: DiscoverRecipe;
  addToDate?: string;
  mealType?: string;
  isFavorite: boolean;
  onFavorite: (recipeId: string) => void;
  onUnfavorite: (recipeId: string) => void;
};

export function DiscoverRecipeCard({ recipe, addToDate, mealType, isFavorite, onFavorite, onUnfavorite }: Props) {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [saving, setSaving] = useState(false);
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  const [showCalendarForm, setShowCalendarForm] = useState(false);
  const [calendarDate, setCalendarDate] = useState(addToDate ?? "");
  const [calendarMealType, setCalendarMealType] = useState(mealType ?? "dinner");

  const handleSaveToMyRecipes = async () => {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      const newRecipe = await api<{ _id: string }>(`/recipes/${recipe._id}/copy`, { method: "POST", token });
      navigate({ to: "/recipes/$recipeId", params: { recipeId: newRecipe._id } });
    } catch {
      setSaving(false);
    }
  };

  const handleAddToCalendar = async () => {
    const token = getToken();
    if (!token) return;
    const date = addToDate && mealType ? addToDate : calendarDate;
    const mt = addToDate && mealType ? mealType : calendarMealType;
    if (!date || !mt) {
      setShowCalendarForm(true);
      return;
    }
    setAddingToCalendar(true);
    try {
      let recipeId = recipe._id;
      try {
        const newRecipe = await api<{ _id: string }>(`/recipes/${recipe._id}/copy`, { method: "POST", token });
        recipeId = newRecipe._id;
      } catch {
        // might already own it; try adding with original id
      }
      await api("/calendar", {
        method: "POST",
        token,
        body: JSON.stringify({ recipeId, date, mealType: mt }),
      });
      setShowCalendarForm(false);
      if (addToDate) {
        navigate({ to: "/calendar/day/$date", params: { date: addToDate } });
      }
    } finally {
      setAddingToCalendar(false);
    }
  };

  const canAddDirect = Boolean(addToDate && mealType);

  return (
    <div
      className="rounded-[var(--radius-card)] border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
      style={{ borderColor: "var(--border)" }}
    >
      <Link
        to="/recipes/$recipeId"
        params={{ recipeId: recipe._id }}
        className="group block"
      >
        <h3 className="font-display text-lg font-semibold leading-snug transition-colors group-hover:text-[var(--accent)]" style={{ color: "var(--text)" }}>
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="mt-1 line-clamp-2 text-sm" style={{ color: "var(--text-muted)" }}>
            {recipe.description}
          </p>
        )}
        {(recipe.prepTimeMinutes != null || recipe.cookTimeMinutes != null) && (
          <p className="mt-2 text-xs" style={{ color: "var(--text-faint)" }}>
            {[recipe.prepTimeMinutes != null && `Prep ${recipe.prepTimeMinutes} min`, recipe.cookTimeMinutes != null && `Cook ${recipe.cookTimeMinutes} min`].filter(Boolean).join(" · ")}
          </p>
        )}
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSaveToMyRecipes}
          disabled={saving}
          className="rounded-[var(--radius)] border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
          style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
        >
          {saving ? "Saving…" : "Save to my recipes"}
        </button>
        <button
          type="button"
          onClick={() => (isFavorite ? onUnfavorite(recipe._id) : onFavorite(recipe._id))}
          className="rounded-[var(--radius)] border px-2.5 py-1.5 text-xs font-medium"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          {isFavorite ? "Unfavorite" : "Favorite"}
        </button>
        <button
          type="button"
          onClick={canAddDirect ? handleAddToCalendar : () => setShowCalendarForm(!showCalendarForm)}
          disabled={addingToCalendar}
          className="rounded-[var(--radius)] border px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
          style={{ borderColor: "var(--border)", color: "var(--text)" }}
        >
          {addingToCalendar ? "Adding…" : "Add to calendar"}
        </button>
      </div>
      {showCalendarForm && !canAddDirect && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[var(--radius)] border p-2" style={{ borderColor: "var(--border)" }}>
          <input
            type="date"
            value={calendarDate}
            onChange={(e) => setCalendarDate(e.target.value)}
            className="rounded-[var(--radius)] border bg-[var(--surface)] px-2 py-1 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          />
          <select
            value={calendarMealType}
            onChange={(e) => setCalendarMealType(e.target.value)}
            className="rounded-[var(--radius)] border bg-[var(--surface)] px-2 py-1 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          >
            {MEAL_TYPES.map((mt) => (
              <option key={mt} value={mt}>{mt}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddToCalendar}
            disabled={addingToCalendar || !calendarDate}
            className="rounded-[var(--radius)] border px-2 py-1 text-xs font-medium"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
