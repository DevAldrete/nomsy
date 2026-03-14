# Recipe CRUD & Calendar Week Picker — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add full recipe CRUD (create form, edit form, delete with confirm) and a calendar week picker (prev/next + go to date), per design in `docs/plans/2026-03-12-recipe-crud-and-calendar-week-picker-design.md`.

**Architecture:** API: extend recipes service to accept ingredients as `{ quantity, unit, name }`, resolve to Ingredient refs via find-or-create; add PATCH and Recipe schema field `publishedAt`. Web: new routes `/recipes/new` and `/recipes/$recipeId/edit`, shared form component, delete on detail page; calendar hook holds selected week, WeekView shows prev/next and date picker.

**Tech Stack:** Express 5, Mongoose 9, MongoDB, React 19, Vite 7, TanStack Router, Tailwind (existing design tokens). Bun for tests.

**Reference:** Design doc `docs/plans/2026-03-12-recipe-crud-and-calendar-week-picker-design.md`.

---

## Phase 1 — API: Recipe update & ingredient-by-name

### Task 1: Add `publishedAt` to Recipe schema

**Files:**
- Modify: `apps/api/src/features/recipes/recipes.model.ts`

**Step 1:** Add optional field to schema (after `createdBy`):

```typescript
publishedAt: { type: Date, default: null },
```

**Step 2:** Commit (use `jj describe -m "..."` if using Jujutsu, or `git add` + `git commit`):

```bash
git add apps/api/src/features/recipes/recipes.model.ts
git commit -m "feat(api): add publishedAt to Recipe schema for future marketplace"
```

---

### Task 2: Ingredient find-or-create helper

**Files:**
- Create: `apps/api/src/features/recipes/ingredient.service.ts`
- Create: `apps/api/src/features/recipes/ingredient.service.test.ts`

**Step 1: Write failing test**

In `apps/api/src/features/recipes/ingredient.service.test.ts`:

```typescript
import { test, expect } from "bun:test";
import { findOrCreateIngredient } from "./ingredient.service";

test("findOrCreateIngredient is a function", () => {
  expect(typeof findOrCreateIngredient).toBe("function");
});
```

**Step 2: Run test (expect fail)**

Run: `cd apps/api && bun test src/features/recipes/ingredient.service.test.ts`  
Expected: FAIL (module/function not found).

**Step 3: Implement**

In `apps/api/src/features/recipes/ingredient.service.ts`:

```typescript
import { Ingredient } from "./ingredient.model.js";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export async function findOrCreateIngredient(name: string, unit: string = "g"): Promise<string> {
  const n = normalizeName(name);
  if (!n) throw new Error("Ingredient name required");
  let ing = await Ingredient.findOne({ name: n });
  if (!ing) {
    ing = await Ingredient.create({ name: n, unit, shelfLifeDays: 7 });
  }
  return ing._id.toString();
}
```

**Step 4: Run test (expect pass)**

Run: `cd apps/api && bun test src/features/recipes/ingredient.service.test.ts`

**Step 5: Commit**

```bash
git add apps/api/src/features/recipes/ingredient.service.ts apps/api/src/features/recipes/ingredient.service.test.ts
git commit -m "feat(api): add findOrCreateIngredient helper"
```

---

### Task 3: Recipes service — accept ingredient { quantity, unit, name } and add update

**Files:**
- Modify: `apps/api/src/features/recipes/recipes.service.ts`

**Step 1:** Define input type that allows either ref or name-based shape:

```typescript
type IngredientInput = { ingredientId?: Types.ObjectId; quantity: number; unit?: string; name?: string };
type RecipeInput = {
  title: string;
  description?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  tags?: string[];
  ingredients?: IngredientInput[];
};
```

**Step 2:** Add helper that resolves ingredients array to `{ ingredientId, quantity }[]` using `findOrCreateIngredient` when `name` is provided. If only `ingredientId` + `quantity` are provided, keep as-is.

**Step 3:** In `create`, resolve ingredients (when provided) then call `Recipe.create` with resolved list. Validate: title required; if ingredients present, at least one with `name` or `ingredientId`; prep/cook >= 0.

**Step 4:** Add `async update(recipeId: string, userId: string, data: Partial<RecipeInput>)`: find recipe by id and createdBy; if not found throw RECIPE_NOT_FOUND. Resolve ingredients if provided. Apply only provided fields (title, description, prepTimeMinutes, cookTimeMinutes, tags, ingredients). Save and return updated recipe (e.g. findByIdAndUpdate with runValidators and new: true, or fetch after update).

**Step 5:** Run existing tests: `cd apps/api && bun test src/features/recipes/`

**Step 6: Commit**

```bash
git add apps/api/src/features/recipes/recipes.service.ts
git commit -m "feat(api): recipes create/update accept ingredient name; add update()"
```

---

### Task 4: PATCH /api/recipes/:id route and controller

**Files:**
- Modify: `apps/api/src/features/recipes/recipes.controller.ts`
- Modify: `apps/api/src/features/recipes/recipes.routes.ts`

**Step 1:** In controller, add:

```typescript
export async function update(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: AuthUser }).user;
  const recipe = await recipesService.update(req.params.id, userId, req.body);
  res.json(recipe);
}
```

**Step 2:** In routes, add:

```typescript
router.patch("/:id", authMiddleware, asyncHandler(update));
```

Import `update` in routes.

**Step 3:** Run API tests: `cd apps/api && bun test src/features/recipes/`

**Step 4: Commit**

```bash
git add apps/api/src/features/recipes/recipes.controller.ts apps/api/src/features/recipes/recipes.routes.ts
git commit -m "feat(api): add PATCH /api/recipes/:id"
```

---

### Task 5: API integration test for create with ingredient names and update

**Files:**
- Modify: `apps/api/src/features/recipes/recipes.test.ts`

**Step 1:** Add test: register, get token, POST /api/recipes with body containing `ingredients: [{ quantity: 2, unit: "cups", name: "flour" }]`. Assert 201 and recipe has ingredients array with populated or refs.

**Step 2:** Add test: create recipe, then PATCH /api/recipes/:id with `{ title: "Updated Title" }`. Assert 200 and title is "Updated Title".

**Step 3:** Add test: PATCH with invalid id or other user's recipe returns 404.

**Step 4:** Run: `cd apps/api && TEST_MONGO_URI=... bun test src/features/recipes/recipes.test.ts` (requires MongoDB).

**Step 5: Commit**

```bash
git add apps/api/src/features/recipes/recipes.test.ts
git commit -m "test(api): integration tests for recipe create with name and PATCH"
```

---

## Phase 2 — Web: Recipe CRUD UI

### Task 6: RecipeForm component (shared for new/edit)

**Files:**
- Create: `apps/web/src/features/recipes/components/RecipeForm.tsx`

**Step 1:** Create form with state: title, description, prepTimeMinutes, cookTimeMinutes, tags (string array or comma-separated), ingredients (array of { quantity, unit, name }). Use design tokens (var(--border), var(--accent), etc.).

**Step 2:** Fields: title (input required), description (textarea), prep (number min 0), cook (number min 0), tags (input or chips), ingredients: list of rows with quantity (number), unit (input), name (input). Buttons: "Add ingredient", and per-row remove. At least one ingredient required on submit.

**Step 3:** Props: `initialData?: { title, description, prepTimeMinutes, cookTimeMinutes, tags?, ingredients? }`, `onSubmit: (data) => void`, `loading?: boolean`, `submitLabel?: string`. If initialData present, prefill; otherwise empty.

**Step 4:** On submit, call onSubmit with object matching API (ingredients as { quantity, unit, name }).

**Step 5: Commit**

```bash
git add apps/web/src/features/recipes/components/RecipeForm.tsx
git commit -m "feat(web): add RecipeForm component for create/edit"
```

---

### Task 7: Create recipe page — /recipes/new

**Files:**
- Create: `apps/web/src/routes/recipes/new.tsx`

**Step 1:** Route: `createFileRoute("/recipes/new")`. Component wrapped in RequireAuth. Render RecipeForm with no initialData, submitLabel "Create recipe". On submit: POST /api/recipes with token, body = form data. On success redirect to `/recipes/${recipe._id}`. On error set error state and show message.

**Step 2:** Regenerate route tree: run `cd apps/web && ./node_modules/.bin/vite build` once so routeTree.gen includes /recipes/new. Then run full build: `bun run build`.

**Step 3: Commit**

```bash
git add apps/web/src/routes/recipes/new.tsx
git commit -m "feat(web): add Create recipe page at /recipes/new"
```

---

### Task 8: Edit recipe page — /recipes/:id/edit

**Files:**
- Create: `apps/web/src/routes/recipes/$recipeId.edit.tsx` (or `$recipeId/edit.tsx` per TanStack Router convention; if single file use `$recipeId.edit.tsx` for path `/recipes/$recipeId/edit`).

**Step 1:** Route for `/recipes/$recipeId/edit`. Load recipe with GET /api/recipes/:id. Map to form shape: `ingredients = recipe.ingredients.map(ing => ({ quantity: ing.quantity, unit: ing.ingredientId?.unit ?? 'g', name: ing.ingredientId?.name ?? '' }))`. If 404 or error, redirect to /recipes or show error.

**Step 2:** Render RecipeForm with initialData from recipe, submitLabel "Save changes". On submit: PATCH /api/recipes/:id with token. On success redirect to /recipes/:id.

**Step 3:** Build and fix route tree if needed.

**Step 4: Commit**

```bash
git add apps/web/src/routes/recipes/$recipeId.edit.tsx
git commit -m "feat(web): add Edit recipe page at /recipes/:id/edit"
```

---

### Task 9: Delete recipe on detail page

**Files:**
- Modify: `apps/web/src/routes/recipes/$recipeId.tsx`

**Step 1:** Add "Delete recipe" button (danger/secondary style using design tokens). On click: if `confirm("Delete this recipe? This can't be undone.")` then call DELETE /api/recipes/:id with token, then navigate to /recipes. On 404 treat as success (redirect anyway). Use useAuth getToken and api(), and useNavigate.

**Step 2:** Optional: only show Delete for owner. Current API returns 404 for non-owner; for now showing for all authenticated users on detail is fine (they can only delete own recipes).

**Step 3: Commit**

```bash
git add apps/web/src/routes/recipes/$recipeId.tsx
git commit -m "feat(web): add Delete recipe with confirm on detail page"
```

---

### Task 10: Link to New recipe and Edit from list and detail

**Files:**
- Modify: `apps/web/src/routes/recipes/index.tsx`
- Modify: `apps/web/src/routes/recipes/$recipeId.tsx`

**Step 1:** On recipes list page, add a primary link/button "New recipe" linking to /recipes/new (above or below the list).

**Step 2:** On recipe detail page, add an "Edit" link/button linking to /recipes/:id/edit.

**Step 3: Commit**

```bash
git add apps/web/src/routes/recipes/index.tsx apps/web/src/routes/recipes/$recipeId.tsx
git commit -m "feat(web): add New recipe and Edit links"
```

---

## Phase 3 — Calendar week picker

### Task 11: useCalendar selected-week state and prev/next

**Files:**
- Modify: `apps/web/src/features/calendar/hooks/useCalendar.ts`

**Step 1:** Change API: instead of `useCalendar(weekStart?: Date)`, have the hook own state: `const [selectedWeekMonday, setSelectedWeekMonday] = useState<Date>(() => getMondayOfWeek(new Date()))`. Export a helper `getMondayOfWeek(date: Date): Date` (Monday 00:00 of the week containing date; use same logic as current getWeekRange).

**Step 2:** Compute start/end from selectedWeekMonday using existing getWeekRange logic. Pass start/end to API. Expose: entries, loading, addEntry, removeEntry, weekStart (string or Date for label), weekEnd, and **goToWeek(monday: Date)**, **goToPreviousWeek()**, **goToNextWeek()**, **goToWeekContaining(date: Date)**.

**Step 3:** goToPreviousWeek: setSelectedWeekMonday to monday - 7 days. goToNextWeek: +7 days. goToWeekContaining: setSelectedWeekMonday to getMondayOfWeek(date).

**Step 4:** Default selectedWeekMonday = getMondayOfWeek(new Date()).

**Step 5: Commit**

```bash
git add apps/web/src/features/calendar/hooks/useCalendar.ts
git commit -m "feat(web): calendar hook selected week state and prev/next/goTo"
```

---

### Task 12: WeekView — week label, Previous/Next, Go to date

**Files:**
- Modify: `apps/web/src/features/calendar/components/WeekView.tsx`

**Step 1:** Use useCalendar(); destructure goToPreviousWeek, goToNextWeek, goToWeekContaining, and weekStart (or selectedWeekMonday) for display.

**Step 2:** Above the table, add a row: left: "Week of {formatted range}" (e.g. "Mar 10 – 16, 2026"). Center or right: "← Previous" and "Next →" buttons that call goToPreviousWeek and goToNextWeek. Add a "Go to date" date input; on change, call goToWeekContaining(selectedDate). Style with design tokens.

**Step 3:** Ensure refetch runs when selected week changes (useCalendar already depends on start/end derived from selectedWeekMonday).

**Step 4: Commit**

```bash
git add apps/web/src/features/calendar/components/WeekView.tsx
git commit -m "feat(web): calendar week picker UI (prev/next, go to date)"
```

---

## Verification

- **API:** `cd apps/api && bun test` (unit + integration if MongoDB available).
- **Web:** `cd apps/web && bun run build`. Manual: create recipe, edit, delete; calendar prev/next and go to date.

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-03-12-recipe-crud-week-picker-implementation.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel Session (separate)** — Open new session with executing-plans, batch execution with checkpoints.

Which approach do you want?

- If **Subagent-Driven:** use superpowers:subagent-driven-development in this session.
- If **Parallel Session:** open a new session in the repo and use superpowers:executing-plans there.
