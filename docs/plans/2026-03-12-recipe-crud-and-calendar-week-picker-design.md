# Recipe CRUD & Calendar Week Picker — Design

**Date:** 2026-03-12  
**Status:** Approved (pending your sign-off below)  
**Scope:** Recipe creation/editing/deletion UI and API (full CRUD); calendar week picker (prev/next + go to date). Future: marketplace (publish/discover) and paginated calendar history are out of scope but the data model is kept compatible.

---

## 1. Product decisions (from brainstorming)

- **Recipe source now:** Users create their own recipes only (no curated catalog). We add full CRUD: Create, Read, Update, Delete.
- **Recipe source later:** Marketplace (users can publish recipes for others to discover) — not in this phase; add optional `publishedAt` or `visibility` on Recipe so we don’t block it.
- **Calendar navigation now:** Week picker — user sees one week at a time, with “Previous week” / “Next week” and a way to “Go to date” (jump to that week). Default = current week.
- **Calendar later:** Paginated history (list of weeks) can be added later; current schema already supports it (entries by `userId` + `date`).

---

## 2. Recipe CRUD

### 2.1 API

- **Create:** Already exists — `POST /api/recipes` (auth). Body: title, description?, prepTimeMinutes?, cookTimeMinutes?, tags?, ingredients?. For ingredients we support a **minimal** shape: `{ quantity: number, unit: string, name: string }`. Backend creates or finds an `Ingredient` by `name` (normalized), then stores `{ ingredientId, quantity }` on the recipe. No requirement to pre-create ingredients.
- **Read:** Already exists — `GET /api/recipes` (auth, list), `GET /api/recipes/:id` (public detail).
- **Update:** **Add** `PATCH /api/recipes/:id` (auth, owner only). Body: same as create (partial OK). Reuse the same create/find-ingredient logic for any new/changed ingredients. Returns updated recipe.
- **Delete:** Already exists — `DELETE /api/recipes/:id` (auth, owner only). No change.

**Validation:** Title required; prep/cook ≥ 0; at least one ingredient with `name` on create; on update, partial updates allowed (e.g. only title).

**Future-proofing (no UI in this phase):** Add optional field to Recipe schema: `publishedAt: Date | null` (or `visibility: 'private' | 'public'`). Default `null` / `'private'`. Enables “C later” (marketplace) without a migration.

### 2.2 Web — Recipe Create

- **Route:** `/recipes/new`.
- **Form fields:** Title (required), Description (optional textarea), Prep time (minutes), Cook time (minutes), Tags (optional, comma-separated or repeatable chips), Ingredients: repeatable rows with Quantity, Unit, Name (at least one required).
- **Submit:** POST to `/api/recipes`. On success, redirect to `/recipes/:id`. On validation/API error, show message and keep form state.

### 2.3 Web — Recipe Update

- **Route:** `/recipes/:id/edit` (or reuse `/recipes/new` with `:id` for edit mode).
- **Load:** GET `/api/recipes/:id` to prefill form. If 404 or not owner, redirect or show error.
- **Form:** Same fields as create, prefilled. Submit sends `PATCH /api/recipes/:id`. On success, redirect to `/recipes/:id`.

### 2.4 Web — Recipe Delete

- **Place:** Recipe detail page (`/recipes/:id`). Add a “Delete recipe” button (secondary/danger style).
- **Flow:** On click, confirm (e.g. `confirm()` or a small modal: “Delete this recipe? This can’t be undone.”). On confirm, `DELETE /api/recipes/:id`, then redirect to `/recipes`. If not owner, API returns 404 — button can be hidden for non-owners when we add public recipes later.

Optional: also a delete action on the recipe list (e.g. per-card menu or icon) with same confirmation and redirect to list after delete.

---

## 3. Calendar week picker

### 3.1 Behavior

- **Default view:** Current week (Monday–Sunday of the week containing today).
- **Navigation:** “Previous week” and “Next week” buttons; label shows e.g. “Week of Mar 10 – 16, 2026”.
- **Jump to date:** A “Go to date” control (date input or “Week of [date]” picker). Choosing a date loads the week that contains that date.
- **API:** No change. Existing `GET /api/calendar/week?start=...&end=...` already accepts any week range; frontend computes `start`/`end` from the chosen week (Mon 00:00 – Sun 23:59 or equivalent) and passes them.

### 3.2 Web

- **State:** Calendar page (or `useCalendar`) holds “selected week” (e.g. Monday of that week as a Date or ISO string). Default = current week.
- **UI:** Week label + “← Previous” / “Next →” + optional “Go to date” input. When user changes week, refetch entries with new `start`/`end`.
- **URL (optional):** Consider encoding the week in the URL (e.g. `?week=2026-03-10`) so “this week” is shareable and back/forward work. Can be added in implementation.

### 3.3 Data model (future C)

- No schema change. Calendar entries are already per-user, per-date. A future “paginated history” can be implemented by an endpoint that returns distinct week ranges for a user, or by the client requesting past/future weeks with the same `start`/`end` API.

---

## 4. Error handling & edge cases

- **Recipe create/update:** 400 for validation (missing title, invalid numbers). Show field-level or inline message.
- **Recipe update/delete:** 404 if not found or not owner. Redirect to list or show “Recipe not found.”
- **Calendar:** Invalid or missing `start`/`end` → 400; backend already validates. Frontend always sends a valid week range.

---

## 5. Out of scope (this phase)

- Marketplace: publish recipe, discover public recipes, “Save to my recipes” from another user’s recipe.
- Paginated calendar history UI (list of past/future weeks).
- NLP / paste-from-URL recipe parsing.
- Ingredient typeahead from global Ingredient list (we do create/find by name on submit only).

---

## 6. Implementation order (suggested)

1. **API:** Add `PATCH /api/recipes/:id` and ingredient create/find-by-name for both create and update; add `publishedAt` (or `visibility`) to Recipe schema, default private.
2. **Web — Recipe CRUD:** Create recipe form (`/recipes/new`), then edit form (`/recipes/:id/edit`), then delete button + confirm on detail page.
3. **Web — Calendar:** Week state, Prev/Next, “Week of …” label, optional “Go to date”; refetch when week changes.

If this design looks good, the next step is to invoke the **writing-plans** skill to produce a detailed implementation plan (tasks, files, tests, commits).
