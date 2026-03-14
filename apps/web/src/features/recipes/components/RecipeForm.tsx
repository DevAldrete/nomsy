import { useState } from "react";

export type RecipeFormData = {
  title: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  tags: string[];
  ingredients: { quantity: number; unit: string; name: string }[];
};

const inputClass =
  "mt-1.5 block w-full rounded-[var(--radius)] border bg-[var(--surface)] px-4 py-2.5 text-[var(--text)] transition-colors placeholder:text-[var(--text-faint)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]";
const inputStyle = { borderColor: "var(--border)" };
const labelClass = "block text-sm font-medium";
const labelStyle = { color: "var(--text)" };

type Props = {
  initialData?: Partial<RecipeFormData>;
  onSubmit: (data: RecipeFormData) => void | Promise<void>;
  loading?: boolean;
  submitLabel?: string;
};

export function RecipeForm({ initialData, onSubmit, loading = false, submitLabel = "Save" }: Props) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(initialData?.prepTimeMinutes ?? 0);
  const [cookTimeMinutes, setCookTimeMinutes] = useState(initialData?.cookTimeMinutes ?? 0);
  const [tagsStr, setTagsStr] = useState(
    Array.isArray(initialData?.tags) ? initialData.tags.join(", ") : ""
  );
  const [ingredients, setIngredients] = useState<{ quantity: number; unit: string; name: string }[]>(
    initialData?.ingredients?.length
      ? initialData.ingredients.map((i) => ({ quantity: i.quantity ?? 0, unit: i.unit ?? "g", name: i.name ?? "" }))
      : [{ quantity: 0, unit: "g", name: "" }]
  );
  const [error, setError] = useState<string | null>(null);

  const addIngredient = () => {
    setIngredients((prev) => [...prev, { quantity: 0, unit: "g", name: "" }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: "quantity" | "unit" | "name", value: number | string) => {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const titleTrim = title.trim();
    if (!titleTrim) {
      setError("Title is required.");
      return;
    }
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const resolvedIngredients = ingredients
      .map((i) => ({ quantity: Number(i.quantity) || 0, unit: i.unit.trim() || "g", name: i.name.trim() }))
      .filter((i) => i.name !== "");
    if (resolvedIngredients.length === 0) {
      setError("Add at least one ingredient with a name.");
      return;
    }
    try {
      await onSubmit({
        title: titleTrim,
        description: description.trim(),
        prepTimeMinutes: Number(prepTimeMinutes) || 0,
        cookTimeMinutes: Number(cookTimeMinutes) || 0,
        tags,
        ingredients: resolvedIngredients,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="recipe-title" className={labelClass} style={labelStyle}>
          Title *
        </label>
        <input
          id="recipe-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={inputClass}
          style={inputStyle}
          placeholder="e.g. Spaghetti Carbonara"
        />
      </div>
      <div>
        <label htmlFor="recipe-description" className={labelClass} style={labelStyle}>
          Description
        </label>
        <textarea
          id="recipe-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={inputClass}
          style={inputStyle}
          placeholder="Optional description"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="recipe-prep" className={labelClass} style={labelStyle}>
            Prep (min)
          </label>
          <input
            id="recipe-prep"
            type="number"
            min={0}
            value={prepTimeMinutes}
            onChange={(e) => setPrepTimeMinutes(Number(e.target.value) || 0)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="recipe-cook" className={labelClass} style={labelStyle}>
            Cook (min)
          </label>
          <input
            id="recipe-cook"
            type="number"
            min={0}
            value={cookTimeMinutes}
            onChange={(e) => setCookTimeMinutes(Number(e.target.value) || 0)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </div>
      <div>
        <label htmlFor="recipe-tags" className={labelClass} style={labelStyle}>
          Tags (comma-separated)
        </label>
        <input
          id="recipe-tags"
          type="text"
          value={tagsStr}
          onChange={(e) => setTagsStr(e.target.value)}
          className={inputClass}
          style={inputStyle}
          placeholder="quick, vegetarian, ..."
        />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className={labelClass} style={labelStyle}>
            Ingredients *
          </label>
          <button
            type="button"
            onClick={addIngredient}
            className="text-sm font-medium"
            style={{ color: "var(--accent)" }}
          >
            + Add row
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {ingredients.map((ing, index) => (
            <div key={index} className="flex gap-2 items-start">
              <input
                type="number"
                min={0}
                step={0.25}
                value={ing.quantity || ""}
                onChange={(e) => updateIngredient(index, "quantity", Number(e.target.value) || 0)}
                placeholder="Qty"
                className="w-20 rounded-[var(--radius)] border bg-[var(--surface)] px-2 py-2 text-[var(--text)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                style={inputStyle}
              />
              <input
                type="text"
                value={ing.unit}
                onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                placeholder="Unit"
                className="w-20 rounded-[var(--radius)] border bg-[var(--surface)] px-2 py-2 text-[var(--text)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                style={inputStyle}
              />
              <input
                type="text"
                value={ing.name}
                onChange={(e) => updateIngredient(index, "name", e.target.value)}
                placeholder="Ingredient name"
                className="flex-1 rounded-[var(--radius)] border bg-[var(--surface)] px-2 py-2 text-[var(--text)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="shrink-0 rounded p-2 text-[var(--text-faint)] hover:bg-[var(--bg-subtle)]"
                aria-label="Remove ingredient"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
      {error && (
        <p className="text-sm font-medium" style={{ color: "var(--error)" }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full py-3 text-base font-medium transition-opacity disabled:opacity-60"
        style={{ background: "var(--accent)", color: "white" }}
      >
        {loading ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
