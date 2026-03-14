# Day View & Recipe Discovery — Design

**Date:** 2026-03-13  
**Status:** Draft (pending your sign-off)  
**Scope:** (A) Per-day calendar view (“Today” + generic day detail) for a polished MVP; (C) Recipe discovery (browse, favorite, save to my recipes, add to calendar) and how it plugs into the day view.

**Prerequisites:** Recipe CRUD and calendar week picker are implemented (see `2026-03-12-recipe-crud-and-calendar-week-picker-design.md`).

---

## 1. Product decisions (from brainstorming)

- **Day view:** One unified “day” experience: a **Today** dashboard (when viewing today) and a **generic day detail** when viewing any other day. Same component and route shape; entry points are “Today” in nav and clicking a day in the week calendar.
- **Discovery (C):** Users can browse **published** recipes from others, **favorite** them, **save a copy to “My recipes”**, and **add to calendar** (date + meal slot). Discovery is a separate phase after the day-view MVP; this doc defines how it plugs into the day view so we don’t block or rework later.
- **Meal tracker (what you actually ate):** Out of scope for this design; the day view reserves a small future hook (e.g. “Mark as done”) without full tracking behavior.

---

## 2. Day view (Approach 1 — single component, two entry points)

### 2.1 Routes and entry points

| Route | Purpose |
|-------|--------|
| `/calendar/today` | Today’s dashboard (date = start of current day in local TZ). |
| `/calendar/day/:date` | Day detail for any day; `date` = `YYYY-MM-DD`. |

**Entry points:**

- **Nav:** “Today” link → `/calendar/today`. Visible from any page.
- **Week view:** Clicking a day cell (column) in the calendar week table → navigate to `/calendar/day/:date` for that day.

So “Today” is just a shortcut to `/calendar/day/2026-03-13` when today is 2026-03-13; one component renders both.

### 2.2 API usage (no new endpoints)

- **Load day’s entries:** Reuse `GET /api/calendar/week?start=...&end=...` with `start` = 00:00:00 of the selected date and `end` = 23:59:59 of the same date (or next day 00:00 depending on backend convention). Response is the same list of calendar entries (with populated recipe); filter or group by `mealType` on the client.
- **Add recipe to day:** Existing `POST /api/calendar` with `recipeId`, `date`, `mealType`.
- **Remove from day:** Existing `DELETE /api/calendar/:entryId` (or equivalent).

No new calendar API is required.

### 2.3 Day view UI

**Header**

- Title: human date, e.g. “Monday, March 16, 2026”.
- When the displayed date is **today**: show a small badge/chip “Today”.
- Controls:
  - “← Previous day” / “Next day →” (adjust date by ±1 day, update route to `/calendar/day/:newDate`).
  - “Back to week” → navigate to `/calendar` with week state set to the week containing the current day (so the user lands on the right week).

**Planned meals (by meal slot)**

- **Meal types:** breakfast, lunch, dinner, snack (match existing `CalendarEntry.mealType`).
- For each meal type, a section:
  - Section label, e.g. “Breakfast”, “Lunch”, “Dinner”, “Snacks”.
  - List of entries for that day + meal type: each entry shows recipe title, optional short description or tags (e.g. “20 min”), and actions:
    - **Mark as done** (optional for MVP): visual only or stub for future meal tracking (no API yet).
    - **Move to another day:** opens a small date/week picker; on confirm, create new calendar entry for chosen date + same mealType and delete current entry (or future “move” API).
    - **Remove from day:** call remove calendar API.
  - **“+ Add recipe”** for that meal slot: opens a flow to choose a recipe and add it to this day + mealType.
    - **MVP:** “Add recipe” opens a **“My recipes”** picker (list or search of user’s recipes); on select → POST to calendar with current `date` and selected `mealType`, then refresh day view.
    - **When Discovery (C) exists:** same “+ Add recipe” can offer two options: **“From my recipes”** and **“Discover”** (navigate to Discover with optional context: “add to this day/meal” so that “Add to calendar” in Discover can pre-fill date and mealType).

**Reserved space (no implementation in day-view MVP)**

- A small “What you had” or “Done” area can be added later for meal tracking; “Mark as done” can move the recipe there. Not specified further in this phase.

### 2.4 Week view integration

- **Clickable day cells:** In the existing week table, each day column (or each day cell) is clickable. On click, navigate to `/calendar/day/:date` where `date` is that day’s `YYYY-MM-DD`. No change to week API or data model.
- **Optional:** When opening “Go to date” and selecting a date, consider navigating to day view for that date instead of (or in addition to) jumping the week; product preference can be decided in implementation.

### 2.5 Data flow summary (day view)

- User opens **Today** or **Day** → app resolves date → `GET /api/calendar/week?start=&end=` for that single day → group entries by `mealType` → render sections with actions.
- Add recipe: user selects recipe (from “My recipes” picker) → `POST /api/calendar` with `date`, `mealType`, `recipeId` → refetch day.
- Remove: `DELETE /api/calendar/:id` → refetch.
- Move (optional for MVP): delete + add with new date (or dedicated move endpoint later).

---

## 3. Recipe discovery (feature C) — how it plugs in

Discovery is a **later phase**. This section defines its scope and, importantly, **how it connects to the day view** so that the day-view “Add recipe” flow doesn’t need to change again when C ships.

### 3.1 Discovery entry points

| Entry point | Behavior |
|-------------|----------|
| **Nav** | “Discover” → `/discover` (browse public recipes). |
| **Day view** | “+ Add recipe” → in C phase: choice “From my recipes” vs “Discover”; “Discover” can open `/discover?addToDate=YYYY-MM-DD&mealType=...` so that “Add to calendar” in Discover pre-fills date and meal. |
| **Recipe detail (discovered)** | Actions: “Save to my recipes”, “Add to calendar”, “Favorite” (when C is implemented). |

So the day view only gains a second option in the “Add recipe” flow when Discovery exists; no change to day view routes or component structure.

### 3.2 Discovery capabilities (for phase C)

- **Browse:** List (and optionally search/filter) recipes where `publishedAt` is set (already on Recipe model). Public endpoint, e.g. `GET /api/recipes/discover?search=&tags=&...`.
- **Favorite:** User-specific list of recipe refs (e.g. `UserFavorite` model: `userId`, `recipeId`). Endpoints: e.g. `GET /api/users/me/favorites`, `POST /api/users/me/favorites/:recipeId`, `DELETE /api/users/me/favorites/:recipeId`. Favorites are for quick access and “saved for later”; they do not copy the recipe into “My recipes”.
- **Save to my recipes:** Create a **copy** of a discovered recipe owned by the current user. New recipe document with same title, description, ingredients, tags, times, but `createdBy` = current user, `publishedAt` = null (private). API: e.g. `POST /api/recipes/:id/copy` (auth) → returns new recipe id. Then the user can edit it and add it to the calendar like any of their recipes.
- **Add to calendar:** For a recipe the user **already owns**, use existing `POST /api/calendar` with `recipeId`, `date`, `mealType`. For a **discovered** (not owned) recipe, two options: (1) “Add to calendar” first runs “Save to my recipes” then adds the new recipe to the chosen date/meal; or (2) API supports adding a “foreign” recipeId to the user’s calendar (read-only ref). This design **recommends (1)** so calendar entries always refer to recipes the user can edit and so we don’t need to handle deleted/shared-recipe edge cases in the calendar. So “Add to calendar” from Discover = copy (if not owned) + add to calendar.

### 3.3 Publish (authors)

- Authors **publish** a recipe so it appears in Discover. Use existing `publishedAt`: set it when the user chooses “Publish” (e.g. from recipe detail or edit). API: e.g. `PATCH /api/recipes/:id` with `{ publishedAt: new Date() }` or a dedicated `POST /api/recipes/:id/publish`. Unpublish = set `publishedAt` to null.

### 3.4 Data flow summary (Discovery)

- **Discover list:** `GET /api/recipes/discover` (public or auth-optional) → recipes with `publishedAt` set, optionally filtered.
- **Favorite:** Store refs in UserFavorite (or similar); list favorites for “My favorites” or merge into discover UX.
- **Save to my recipes:** `POST /api/recipes/:id/copy` → new recipe, `createdBy` = current user → redirect or open new recipe.
- **Add to calendar from Discover:** If not owner → copy first (or prompt “Save to my recipes first?” then add). Then `POST /api/calendar` with `recipeId` (owned), `date`, `mealType`. If day view passed `addToDate` and `mealType`, pre-fill the add-to-calendar modal or use them as defaults.

### 3.5 Day view ↔ Discovery integration (concrete)

- **MVP (day view only):** “+ Add recipe” → only “My recipes” picker → add to this day/meal.
- **When C ships:** “+ Add recipe” → “From my recipes” | “Discover”. If “Discover”:
  - Navigate to `/discover?addToDate=:date&mealType=:mealType` (current day view date and the slot user clicked).
  - Discover page shows “Add to calendar” (or “Add to this day”) with date/meal pre-filled; on confirm, copy-if-needed then POST calendar, then redirect back to day view or show success and stay on Discover.

No change to day view API or day view route structure; only the “Add recipe” modal or flow gains a second source (Discover).

---

## 4. Implementation order (suggested)

**Phase A — Day view (polished MVP)**

1. **Routes:** Add `/calendar/today` (redirect or direct render) and `/calendar/day/:date`. Single day view component that accepts `date` (from route) and fetches that day’s entries via existing week API.
2. **Day view UI:** Header (date, “Today” badge, prev/next day, “Back to week”), sections by mealType, list entries with Remove (and optional Move, Mark done stub). “+ Add recipe” per slot → “My recipes” picker → add to calendar.
3. **Week view:** Make day cells clickable → navigate to `/calendar/day/:date`.
4. **Nav:** Add “Today” link to main nav → `/calendar/today`.

**Phase C — Discovery (later)**

1. **API:** Discover list (public recipes by `publishedAt`), optional search/filter; Favorites CRUD; Copy recipe; Publish/unpublish.
2. **Web:** Discover page, recipe cards with “Save to my recipes”, “Add to calendar”, “Favorite”; “Add recipe” in day view gains “Discover” option and passes `addToDate`/`mealType` when opening Discover.

---

## 5. Out of scope (this design)

- Full **meal tracker** (what you actually ate, logs, analytics). Only a lightweight “Mark as done” stub or reserved area is in scope for the day view.
- **Paginated calendar history** (list of past weeks).
- **NLP / paste-from-URL** recipe parsing.
- **Social** features beyond publish + discover + favorite + copy (no comments, no follow graph).

---

## 6. Success criteria

- **Day view:** User can open “Today” or any day from the week, see planned meals by slot, add from “My recipes”, remove or move (if implemented), and return to the week without confusion.
- **Discovery (when built):** User can discover published recipes, favorite them, save a copy to “My recipes”, and add to calendar; from the day view, “Add recipe” can optionally open Discover with date/meal pre-filled.

If this design looks good, the next step is to produce a **detailed implementation plan** for **Phase A (day view)** only, then later a separate plan for Phase C (discovery).
