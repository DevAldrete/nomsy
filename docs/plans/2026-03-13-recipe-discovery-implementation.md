# Recipe Discovery — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement recipe discovery so users can browse published recipes, favorite them, save a copy to “My recipes”, add to calendar (copy-if-not-owned then add), and publish/unpublish their own recipes. Day view “Add recipe” gains a “Discover” option with optional addToDate/mealType context.

**Architecture:** API: new discover endpoint (list recipes where publishedAt set, optional search/tags); favorites (UserFavorite model + CRUD under /api/favorites); copy recipe (POST /api/recipes/:id/copy); extend PATCH recipes to allow publishedAt. Web: /discover page with recipe list and cards (Save, Favorite, Add to calendar); recipe detail shows discovery actions when viewing another user’s recipe; day view “Add recipe” offers “From my recipes” | “Discover” and passes query params when opening Discover.

**Tech Stack:** Express 5, Mongoose 9, MongoDB, React 19, Vite 7, TanStack Router, Tailwind (existing design tokens). Bun for tests.

**Reference:** Design doc `docs/plans/2026-03-13-day-view-and-discovery-design.md` (Section 3).

---

## Phase 1 — API: Discover, Publish, Copy

### Task 1: Recipe index for discover and discover service method

**Files:**
- Modify: `apps/api/src/features/recipes/recipes.model.ts`
- Modify: `apps/api/src/features/recipes/recipes.service.ts`

**Step 1:** Add index on `publishedAt` for efficient discover queries.

In `apps/api/src/features/recipes/recipes.model.ts`, after the existing index:

```typescript
recipeSchema.index({ publishedAt: 1, createdAt: -1 });
```

**Step 2:** Add `discover` method to recipes service.

In `apps/api/src/features/recipes/recipes.service.ts`:
- Add `async discover(filters?: { search?: string; tags?: string[] })`: query `Recipe.find({ publishedAt: { $ne: null } })`. If `filters.search` is present, add text match on title/description (e.g. `$or: [{ title: new RegExp(escape(filters.search), 'i') }, { description: new RegExp(escape(filters.search), 'i') }]`). If `filters.tags` is present and non-empty, add `tags: { $in: filters.tags }`. Sort by `createdAt: -1` or `publishedAt: -1`. Use `.populate("ingredients.ingredientId")` and `.lean()`. Return array. Escape regex special chars for search.

**Step 3:** Commit

```bash
git add apps/api/src/features/recipes/recipes.model.ts apps/api/src/features/recipes/recipes.service.ts
git commit -m "feat(api): recipe index for discover; add discover() to recipes service"
```

---

### Task 2: Discover and publish controller + routes

**Files:**
- Modify: `apps/api/src/features/recipes/recipes.controller.ts`
- Modify: `apps/api/src/features/recipes/recipes.routes.ts`

**Step 1:** Add controller `discover(req, res)`: read query `search`, `tags` (comma-separated or array). Call `recipesService.discover({ search, tags })`. Return JSON. No auth required (public).

**Step 2:** Add controller `publish(req, res)` and `unpublish(req, res)` (or a single `setPublish(req, res)` with body `{ published: boolean }`). Require auth; ensure recipe is owned by userId. Set `publishedAt: new Date()` or `publishedAt: null` on the recipe. Use `Recipe.findByIdAndUpdate(recipeId, { publishedAt: ... }, { runValidators: true })` and return updated recipe, or add `publish`/`unpublish` methods to service. 404 if not found or not owner.

**Step 3:** In routes, register (order matters): `router.get("/", ...)`, `router.post("/", ...)`, then **`router.get("/discover", asyncHandler(discover))`** (must be before `/:id` so "discover" is not parsed as an id), then `router.get("/:id", ...)`, `router.patch("/:id", ...)`, etc. For publish/unpublish: either extend PATCH to accept `publishedAt` in the body (recommended), or add `router.post("/:id/publish", authMiddleware, asyncHandler(publish))` and `router.post("/:id/unpublish", authMiddleware, asyncHandler(unpublish))`. If using PATCH, add handling in update controller and service for `data.publishedAt` (Date | null).

**Step 5:** Commit

```bash
git add apps/api/src/features/recipes/recipes.controller.ts apps/api/src/features/recipes/recipes.routes.ts
git commit -m "feat(api): GET /recipes/discover and publish/unpublish endpoints"
```

---

### Task 3: Copy recipe service and route

**Files:**
- Modify: `apps/api/src/features/recipes/recipes.service.ts`
- Modify: `apps/api/src/features/recipes/recipes.controller.ts`
- Modify: `apps/api/src/features/recipes/recipes.routes.ts`

**Step 1:** Add `async copy(recipeId: string, userId: string)` in recipes service. Find recipe by id (any owner). If not found, throw 404. Create a new recipe with: same title, description, prepTimeMinutes, cookTimeMinutes, tags, and ingredients (same ingredientId + quantity; do not resolve by name). Set `createdBy: userId`, `publishedAt: null`. Return the new recipe (populate ingredients.ingredientId, lean).

**Step 2:** Add controller `copyRecipe(req, res)`: auth required, params.id, call `recipesService.copy(req.params.id, userId)`, return 201 with new recipe.

**Step 3:** Add route `POST /:id/copy`, authMiddleware, asyncHandler(copyRecipe). Place it before `router.get("/:id", ...)` or ensure ":id" does not match "discover" (already handled if discover is first).

**Step 4:** Commit

```bash
git add apps/api/src/features/recipes/recipes.service.ts apps/api/src/features/recipes/recipes.controller.ts apps/api/src/features/recipes/recipes.routes.ts
git commit -m "feat(api): POST /recipes/:id/copy to save discovered recipe to my recipes"
```

---

## Phase 2 — API: Favorites

### Task 4: UserFavorite model

**Files:**
- Create: `apps/api/src/features/favorites/favorites.model.ts`
- Modify: `apps/api/src/app.ts` (register favorites routes in Phase 2 Task 5)

**Step 1:** Create favorites feature folder and model.

In `apps/api/src/features/favorites/favorites.model.ts`:

```typescript
import mongoose from "mongoose";

const userFavoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true },
}, { timestamps: true });

userFavoriteSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

export const UserFavorite = mongoose.model("UserFavorite", userFavoriteSchema);
```

**Step 2:** Commit

```bash
git add apps/api/src/features/favorites/favorites.model.ts
git commit -m "feat(api): add UserFavorite model for recipe favorites"
```

---

### Task 5: Favorites service, controller, routes

**Files:**
- Create: `apps/api/src/features/favorites/favorites.service.ts`
- Create: `apps/api/src/features/favorites/favorites.controller.ts`
- Create: `apps/api/src/features/favorites/favorites.routes.ts`
- Modify: `apps/api/src/app.ts`

**Step 1:** Favorites service: `list(userId)` — find all UserFavorite for userId, populate recipeId, return array. `add(userId, recipeId)` — find or create UserFavorite for userId + recipeId; if already exists return existing. `remove(userId, recipeId)` — delete one by userId and recipeId; 404 if not found.

**Step 2:** Controller: `listFavorites(req, res)` (auth), `addFavorite(req, res)` (auth, params.recipeId), `removeFavorite(req, res)` (auth, params.recipeId). Use asyncHandler and authMiddleware.

**Step 3:** Routes: `GET /`, `POST /:recipeId`, `DELETE /:recipeId`. Mount at `app.use("/api/favorites", authMiddleware, favoritesRoutes)` so all routes require auth.

**Step 4:** Register in app.ts: import favoritesRoutes, app.use("/api/favorites", favoritesRoutes). Apply auth in routes or at mount.

**Step 5:** Commit

```bash
git add apps/api/src/features/favorites/ apps/api/src/app.ts
git commit -m "feat(api): favorites CRUD at /api/favorites"
```

---

## Phase 3 — Web: Discover page and list

### Task 6: Discover route and page shell

**Files:**
- Create: `apps/web/src/routes/discover.tsx` (or `discover/index.tsx` if you prefer index)
- Modify: `apps/web/src/routes/__root.tsx` (add Discover nav link in Phase 3 later or in same task)

**Step 1:** Create route for `/discover`. Use createFileRoute("/discover"). Wrap in RequireAuth. Component: page title “Discover recipes” and a placeholder “Browse published recipes from the community.” (no data yet).

**Step 2:** Regenerate route tree: run `cd apps/web && ./node_modules/.bin/vite build` then `bun run build`.

**Step 3:** Add “Discover” link in nav (__root.tsx) next to Recipes/Today/Calendar when user is present. Link to `/discover`.

**Step 4:** Commit

```bash
git add apps/web/src/routes/discover.tsx apps/web/src/routes/__root.tsx apps/web/src/routeTree.gen.ts
git commit -m "feat(web): add Discover route and nav link"
```

---

### Task 7: useDiscover hook and discover list UI

**Files:**
- Create: `apps/web/src/features/discover/hooks/useDiscover.ts`
- Modify: `apps/web/src/routes/discover.tsx`

**Step 1:** useDiscover: call `GET /api/recipes/discover` (no auth required per design, or with auth optional). Optional query params: search, tags. Return `{ recipes, loading, error, refetch }`. Recipe shape: _id, title, description, prepTimeMinutes, cookTimeMinutes, tags, createdBy (optional for attribution), publishedAt.

**Step 2:** Discover page: use useDiscover(), show loading state. Render a list of recipe cards (reuse or adapt RecipeCard). Each card links to `/recipes/:id` (same detail page). For now no “Save” / “Favorite” / “Add to calendar” on the card (add in next tasks).

**Step 3:** Optional: add a simple search input that updates a search state and passes it to useDiscover(search). Debounce or submit on Enter.

**Step 4:** Commit

```bash
git add apps/web/src/features/discover/hooks/useDiscover.ts apps/web/src/routes/discover.tsx
git commit -m "feat(web): useDiscover hook and discover list UI"
```

---

### Task 8: Discover recipe card with Save, Favorite, Add to calendar

**Files:**
- Create: `apps/web/src/features/discover/components/DiscoverRecipeCard.tsx`
- Modify: `apps/web/src/routes/discover.tsx`
- Create or use: `apps/web/src/features/discover/hooks/useFavorites.ts` (optional, or inline API calls)

**Step 1:** useFavorites hook (or inline): GET /api/favorites to list favorite recipe IDs; POST /api/favorites/:recipeId to add; DELETE /api/favorites/:recipeId to remove. Return `{ favoriteIds, loading, addFavorite, removeFavorite, isFavorite(recipeId) }`.

**Step 2:** DiscoverRecipeCard component: props recipe, optional addToDate, optional mealType (from day view context). Show title, description, prep/cook. Actions: “Save to my recipes” (call POST /api/recipes/:id/copy, then navigate to /recipes/:newId or show success); “Favorite” / “Unfavorite” (toggle via favorites API); “Add to calendar” (if not owned: call copy first, then POST /api/calendar with new recipe id and date/mealType; if addToDate/mealType from search params use those, else open a small modal or inline form for date + mealType). Use design tokens. Disable buttons while request in flight.

**Step 3:** Discover page: read search params addToDate and mealType (from TanStack Router useSearch or Route.useSearch). Pass them to each DiscoverRecipeCard so “Add to calendar” can pre-fill.

**Step 4:** Commit

```bash
git add apps/web/src/features/discover/
git commit -m "feat(web): DiscoverRecipeCard with Save, Favorite, Add to calendar"
```

---

### Task 9: Recipe detail — discovery actions when not owner

**Files:**
- Modify: `apps/web/src/routes/recipes/$recipeId.tsx`

**Step 1:** Load recipe as now. Determine if current user is owner (e.g. recipe.createdBy vs current user id; API may need to return createdBy or a boolean `isOwner`). If not owner and recipe is published (publishedAt set), show discovery actions: “Save to my recipes”, “Add to calendar”, “Favorite” (reuse same logic as DiscoverRecipeCard). If owner, show existing Edit/Delete and add “Publish” / “Unpublish” (call PATCH /api/recipes/:id with { publishedAt: new Date() } or { publishedAt: null }).

**Step 2:** API: ensure GET /recipes/:id returns createdBy (or a computed isOwner when auth is present) so the client can show/hide actions. If GET is public, return createdBy as id only; client compares with useCurrentUser().

**Step 3:** Commit

```bash
git add apps/web/src/routes/recipes/$recipeId.tsx
git commit -m "feat(web): recipe detail discovery actions and publish/unpublish for owner"
```

---

### Task 10: Day view — “Add recipe” → “From my recipes” | “Discover”

**Files:**
- Modify: `apps/web/src/features/calendar/components/DayView.tsx`

**Step 1:** When user clicks “+ Add recipe” for a meal slot, show two options instead of immediately opening the recipe picker: “From my recipes” and “Discover”. “From my recipes” opens the existing dropdown/modal of user recipes and on select calls addEntry(recipeId, mealType). “Discover” navigates to `/discover?addToDate=${date}&mealType=${mealType}` so the Discover page can pre-fill “Add to calendar” with that day and slot.

**Step 2:** Implement as a small inline choice (two buttons or links) before showing the recipe picker; or a single “Add recipe” that opens a modal with two actions. Keep UX simple.

**Step 3:** Commit

```bash
git add apps/web/src/features/calendar/components/DayView.tsx
git commit -m "feat(web): day view Add recipe offers From my recipes | Discover with context"
```

---

## Phase 4 — Polish and verification

### Task 11: Add to calendar from Discover with pre-filled date/meal

**Files:**
- Modify: `apps/web/src/features/discover/components/DiscoverRecipeCard.tsx` (or discover page)

**Step 1:** When addToDate and mealType are present (from URL), “Add to calendar” uses them by default: copy recipe if not owned, then POST /api/calendar with recipeId (owned), date: addToDate, mealType. After success, optionally redirect to `/calendar/day/${addToDate}` or show a success message with link to day view.

**Step 2:** If addToDate/mealType are missing, show a small form (date input + meal type select) or modal before calling calendar API.

**Step 3:** Commit

```bash
git add apps/web/src/features/discover/
git commit -m "feat(web): Add to calendar from Discover uses addToDate/mealType when present"
```

---

### Task 12: (Optional) Publish/unpublish via PATCH only

If you implemented dedicated publish/unpublish endpoints in Task 2, skip this. Otherwise ensure `recipes.service.update()` and the update controller accept `publishedAt` in the request body (Date | null) so the web app can call PATCH with `{ publishedAt: new Date() }` or `{ publishedAt: null }` for publish/unpublish. Commit: `feat(api): allow publishedAt in recipe PATCH`.

---

## Verification

- **API:** Discover returns only recipes with publishedAt set. Copy creates a new recipe with createdBy = current user, publishedAt = null. Favorites CRUD works. Publish/unpublish sets publishedAt.
- **Web:** Discover page lists published recipes. Cards: Save, Favorite, Add to calendar work. Recipe detail shows discovery actions for non-owned published recipes and Publish/Unpublish for owner. Day view “Add recipe” shows “From my recipes” | “Discover”; Discover opens with addToDate and mealType when coming from day view; Add to calendar there uses those values.

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-03-13-recipe-discovery-implementation.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** — Dispatch a fresh subagent per task, review between tasks.
2. **Parallel Session (separate)** — Open a new session and use superpowers:executing-plans there.

Which approach do you want?
