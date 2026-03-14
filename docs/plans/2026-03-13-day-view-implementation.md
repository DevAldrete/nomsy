# Day View (Calendar) — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a per-day calendar view so users can open “Today” or any day from the week, see planned meals by slot (breakfast/lunch/dinner/snack), add recipes from “My recipes”, remove entries, and return to the week. No new API; reuse existing calendar week and add/remove endpoints.

**Architecture:** Single `DayView` component driven by route param `date` (YYYY-MM-DD). Routes: `/calendar/today` (redirect to `/calendar/day/:today`) and `/calendar/day/:date`. A `useDayCalendar(date)` hook fetches one day via existing `GET /api/calendar/week?start=&end=` and groups entries by `mealType`; add/remove reuse existing API. Week view’s day column becomes a link to the day view; nav gains “Today”.

**Tech Stack:** React 19, Vite 7, TanStack Router (file-based), Tailwind, existing design tokens and `api`/`useAuth`. Bun for tests.

**Reference:** Design doc `docs/plans/2026-03-13-day-view-and-discovery-design.md`.

---

## Phase 1 — Calendar routes (layout + index + today + day)

### Task 1: Calendar layout and index route

**Files:**
- Modify: `apps/web/src/routes/calendar.tsx`
- Create: `apps/web/src/routes/calendar/index.tsx`

**Step 1: Convert calendar route to a layout with Outlet**

In `apps/web/src/routes/calendar.tsx`: change the component to render only the auth wrapper and an `<Outlet />` so child routes (index, today, day) can render under `/calendar`. Keep `RequireAuth` around the layout.

```tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireAuth } from "../components/RequireAuth";

export const Route = createFileRoute("/calendar")({
  component: () => (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  ),
});
```

**Step 2: Create calendar index (week view) at /calendar**

Create `apps/web/src/routes/calendar/index.tsx` with the current calendar page content (WeekView and helper text):

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { WeekView } from "../../features/calendar/components/WeekView";

export const Route = createFileRoute("/calendar/")({
  component: CalendarIndexPage,
});

function CalendarIndexPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <WeekView />
      <p className="mt-8 text-sm" style={{ color: "var(--text-faint)" }}>
        Week runs Monday–Sunday. Add recipes from your list to plan meals.
      </p>
    </div>
  );
}
```

**Step 3: Regenerate route tree**

Run: `cd apps/web && bun run build`  
Expected: build succeeds; `routeTree.gen.ts` should now include the calendar index route (plugin may auto-run during build).

**Step 4: Manual check**

Open `/calendar` in the app; week view should still render. If the app uses a different way to generate routes (e.g. dev server only), run the dev server and confirm `/calendar` shows the week.

**Step 5: Commit**

```bash
git add apps/web/src/routes/calendar.tsx apps/web/src/routes/calendar/index.tsx
git commit -m "feat(web): calendar layout and index route for week view"
```

---

### Task 2: Today redirect route

**Files:**
- Create: `apps/web/src/routes/calendar/today.tsx`

**Step 1: Implement redirect to /calendar/day/:date**

Create `apps/web/src/routes/calendar/today.tsx`:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const Route = createFileRoute("/calendar/today")({
  component: CalendarTodayPage,
});

function CalendarTodayPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/calendar/day/$date", params: { date: getTodayDateString() } });
  }, [navigate]);
  return null; // or a brief "Redirecting…" message
}
```

**Step 2: Regenerate route tree and verify**

Run: `cd apps/web && bun run build`. Fix any route path: TanStack Router may expect `params` key `date` and path `/calendar/day/$date`. Confirm `createFileRoute("/calendar/today")` exists in route tree after build.

**Step 3: Commit**

```bash
git add apps/web/src/routes/calendar/today.tsx
git commit -m "feat(web): /calendar/today redirects to day view for today"
```

---

### Task 3: Day view route and placeholder

**Files:**
- Create: `apps/web/src/routes/calendar/day.$date.tsx`

**Step 1: Create day route with date param**

Create `apps/web/src/routes/calendar/day.$date.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/calendar/day/$date")({
  component: CalendarDayPage,
});

function CalendarDayPage() {
  const { date } = Route.useParams();
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <p className="font-display text-lg" style={{ color: "var(--text)" }}>
        Day: {date}
      </p>
    </div>
  );
}
```

Note: Parent route `calendar.tsx` already wraps with `RequireAuth`, so no duplicate wrapper here.

**Step 2: Regenerate route tree**

Run: `cd apps/web && bun run build`. Ensure route is registered (e.g. `/calendar/day/$date`).

**Step 3: Commit**

```bash
git add apps/web/src/routes/calendar/day.$date.tsx
git commit -m "feat(web): add /calendar/day/:date route placeholder"
```

---

## Phase 2 — Day view data and UI

### Task 4: useDayCalendar hook

**Files:**
- Create: `apps/web/src/features/calendar/hooks/useDayCalendar.ts`

**Step 1: Implement hook that fetches one day and groups by mealType**

Create `apps/web/src/features/calendar/hooks/useDayCalendar.ts`:

- Accept `dateStr: string` (YYYY-MM-DD).
- Call existing API: `GET /api/calendar/week?start=${dateStr}&end=${dateStr}T23:59:59.999Z` (or `end` as start of next day if backend expects exclusive end; current API uses `$lte` so same-day end is fine). Use `api<CalendarEntry[]>(...)` with `token` from `useAuth().getToken`.
- Return `{ entries, entriesByMealType, loading, refetch, addEntry, removeEntry }` where `entriesByMealType` is `Record<"breakfast"|"lunch"|"dinner"|"snack", CalendarEntry[]>` (group entries by `mealType`). Use same `CalendarEntry` shape as in `useCalendar.ts` (e.g. `_id`, `recipeId`, `date`, `mealType`).
- `addEntry(recipeId, mealType)` should POST to `/calendar` with body `{ recipeId, date: dateStr, mealType }` then call `refetch`.
- `removeEntry(id)` should DELETE `/calendar/:id` then `refetch`.
- Reuse the same `api` and `useAuth` from the codebase.

Reference `apps/web/src/features/calendar/hooks/useCalendar.ts` for API URL shape, types, and add/remove implementation.

**Step 2: Export and use in day page**

Ensure the hook is exported. We will use it in the next task in `DayView`.

**Step 3: Commit**

```bash
git add apps/web/src/features/calendar/hooks/useDayCalendar.ts
git commit -m "feat(web): add useDayCalendar hook for single-day entries"
```

---

### Task 5: DayView component (header + meal sections + remove + add recipe)

**Files:**
- Create: `apps/web/src/features/calendar/components/DayView.tsx`
- Modify: `apps/web/src/routes/calendar/day.$date.tsx`

**Step 1: Implement DayView**

Create `apps/web/src/features/calendar/components/DayView.tsx`:

- Props: `date: string` (YYYY-MM-DD).
- Use `useDayCalendar(date)` for `entriesByMealType`, `loading`, `refetch`, `addEntry`, `removeEntry`.
- **Header:**
  - Title: format date as “Monday, March 16, 2026” (use `new Date(date + 'T12:00:00')` or parse date for weekday).
  - If `date` equals today’s date (compare YYYY-MM-DD strings), show a “Today” badge/chip.
  - “← Previous day” / “Next day →”: compute prev/next date (subtract/add 1 day in local time), navigate to `/calendar/day/$date` with the new date (use `useNavigate` and `Link` or `navigate({ to: '/calendar/day/$date', params: { date } })`).
  - “Back to week” link to `/calendar` (and optionally set week to contain this date via search params or global state; optional for MVP).
- **Meal sections:** For each `mealType` in `["breakfast", "lunch", "dinner", "snack"]`, render a section:
  - Label: “Breakfast”, “Lunch”, “Dinner”, “Snacks” (capitalize).
  - List entries from `entriesByMealType[mealType]`: recipe title (from `entry.recipeId.title`), and a “Remove” button that calls `removeEntry(entry._id)`.
  - “+ Add recipe” button: when clicked, show a simple picker (dropdown or modal) of user’s recipes (use `useRecipes()`); on select, call `addEntry(recipeId, mealType)` and close picker.
- Use existing design tokens: `var(--text)`, `var(--text-muted)`, `var(--border)`, `var(--accent)`, `var(--surface)`, etc. Match WeekView styling where appropriate.
- Loading state: show “Loading…” while `loading` is true.

**Step 2: Wire DayView into day route**

In `apps/web/src/routes/calendar/day.$date.tsx`: import `DayView`, get `date` from `Route.useParams()`, validate that `date` looks like YYYY-MM-DD (optional: redirect to today if invalid). Render `<DayView date={date} />` inside the page container (same max-w-5xl wrapper as calendar index).

**Step 3: Commit**

```bash
git add apps/web/src/features/calendar/components/DayView.tsx apps/web/src/routes/calendar/day.$date.tsx
git commit -m "feat(web): DayView with header, meal sections, remove, add recipe picker"
```

---

### Task 6: Week view — link day column to day view

**Files:**
- Modify: `apps/web/src/features/calendar/components/WeekView.tsx`

**Step 1: Make the day cell (first column) a link**

In the week table body, the first `<td>` of each row currently shows the day label (e.g. “Mon, Mar 16”). Wrap that content in a `Link` to `/calendar/day/$date` with `params={{ date: dateStr }}` where `dateStr = day.toISOString().slice(0, 10)`. Use `Link` from `@tanstack/react-router`. Style the link so it looks like the current text and is clearly clickable (e.g. underline on hover, or accent color). Keep the cell’s existing styling.

**Step 2: Commit**

```bash
git add apps/web/src/features/calendar/components/WeekView.tsx
git commit -m "feat(web): link week view day column to day view"
```

---

### Task 7: Nav — add “Today” link

**Files:**
- Modify: `apps/web/src/routes/__root.tsx`

**Step 1: Add Today link next to Calendar**

In the nav, after the “Calendar” `Link` (or before), add a “Today” link that goes to `/calendar/today`. Use the same styling as other nav links (e.g. `rounded-md px-3 py-2 text-sm font-medium`, `color: var(--text-muted)`). Only show when `user` is present (same as Recipes and Calendar).

**Step 2: Commit**

```bash
git add apps/web/src/routes/__root.tsx
git commit -m "feat(web): add Today link in nav to day view"
```

---

## Phase 3 — Optional polish and validation

### Task 8: Invalid date handling on day route

**Files:**
- Modify: `apps/web/src/routes/calendar/day.$date.tsx`

**Step 1: Validate date param and redirect if invalid**

Parse `date` from params; if it’s not a valid YYYY-MM-DD or parses to an invalid Date, redirect to `/calendar/today`. Use a simple regex or `new Date(date + 'T12:00:00')` and `!isNaN(getTime())`. Redirect with `<Navigate to="/calendar/today" />` or `navigate({ to: '/calendar/today' })`.

**Step 2: Commit**

```bash
git add apps/web/src/routes/calendar/day.$date.tsx
git commit -m "fix(web): redirect invalid day param to today"
```

---

### Task 9: “Back to week” lands on correct week

**Files:**
- Modify: `apps/web/src/features/calendar/components/DayView.tsx`
- Modify: `apps/web/src/routes/calendar/index.tsx` (or calendar context)

**Step 1: Pass week context when navigating to calendar**

When the user clicks “Back to week”, navigate to `/calendar` with a search param, e.g. `?week=YYYY-MM-DD` (Monday of the week containing the current day). In the calendar index (WeekView), read the search param and, if present, call `goToWeekContaining(new Date(week))` on mount so the week picker shows the correct week. This requires `useCalendar()` to be used in the index page or WeekView to already have `goToWeekContaining`; WeekView already uses it. So: DayView “Back to week” link: `to="/calendar" search={{ week: mondayOfCurrentDay }}` (compute Monday of the week that contains `date`). In WeekView or calendar index, use `Route.useSearch()` and `useEffect` to call `goToWeekContaining` when `search.week` is present. Optional: if the router doesn’t persist search, you can use `navigate({ to: '/calendar', search: { week: ... } })`.

**Step 2: Commit**

```bash
git add apps/web/src/features/calendar/components/DayView.tsx apps/web/src/routes/calendar/index.tsx apps/web/src/features/calendar/components/WeekView.tsx
git commit -m "feat(web): Back to week opens calendar on correct week"
```

Note: If implementing search params requires defining `validateSearch` on the calendar route, add that. Simplify to “Back to week” → `/calendar` without week param if time-boxed; document as follow-up.

---

## Verification

- **Manual:** Open `/calendar/today` → redirects to `/calendar/day/YYYY-MM-DD` (today). Day view shows header, “Today” badge, meal sections, add/remove. Open `/calendar`, click a day in the first column → day view for that date. Nav “Today” goes to day view. “Back to week” returns to calendar (optionally correct week).
- **Build:** `cd apps/web && bun run build` succeeds.
- **API:** No new endpoints; existing calendar week and add/remove are used.

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-03-13-day-view-implementation.md`.

**Two execution options:**

1. **Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Parallel Session (separate)** — Open a new session with executing-plans, batch execution with checkpoints.

Which approach do you want?

- If **Subagent-Driven chosen:** Use superpowers:subagent-driven-development; stay in this session; fresh subagent per task + code review.
- If **Parallel Session chosen:** Open a new session in the repo and use superpowers:executing-plans there.
