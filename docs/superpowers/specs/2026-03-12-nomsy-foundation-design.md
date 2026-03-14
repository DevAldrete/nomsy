# Nomsy Foundation Design

**Date:** 2026-03-12  
**Status:** Approved  
**Scope:** Foundation layer — repository structure, database schema, API skeleton, testing infrastructure, and conventions. Feature implementation (recommendations engine, calendar, shopping list, NLP parsing) is out of scope for this phase.

---

## Overview

Nomsy is a situational meal recommender and calendar-based meal planner. This document covers the architectural foundation required before feature work begins: folder structure, data models, API routing conventions, testing setup, and error handling patterns.

The goal is to establish a solid, testable, and navigable codebase that all future features can build on without accumulating early technical debt.

---

## Stack

| Layer            | Technology                                            |
| ---------------- | ----------------------------------------------------- |
| Monorepo tooling | Turborepo + Bun workspaces                            |
| Frontend         | React 19 + Vite 7 + TanStack Router + Tailwind CSS v4 |
| Backend          | Express 5 + Mongoose 9 + MongoDB (Docker)             |
| Runtime          | Bun                                                   |
| Authentication   | Email/password + JWT                                  |
| Testing          | Bun test (unit + integration)                         |

---

## 1. Folder Structure

### `apps/api`

Feature-folder architecture. Each feature owns its routes, controller, service, model, and tests. Shared infrastructure lives in `src/lib/`.

```
apps/api/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts       # Express Router for /api/auth
│   │   │   ├── auth.controller.ts   # Request/response handling
│   │   │   ├── auth.service.ts      # Business logic
│   │   │   ├── auth.model.ts        # User Mongoose schema/model
│   │   │   └── auth.test.ts         # Tests (unit + integration)
│   │   ├── recipes/
│   │   │   ├── recipes.routes.ts
│   │   │   ├── recipes.controller.ts
│   │   │   ├── recipes.service.ts
│   │   │   ├── recipes.model.ts
│   │   │   └── recipes.test.ts
│   │   └── calendar/                # Stub directory, no logic yet
│   ├── lib/
│   │   ├── db.ts                    # Mongoose connection factory
│   │   ├── jwt.ts                   # JWT sign/verify helpers
│   │   ├── errors.ts                # AppError class + error codes
│   │   └── middleware/
│   │       ├── auth.middleware.ts   # JWT verification → req.user
│   │       └── error.middleware.ts  # Centralized error handler
│   └── app.ts                       # Express app setup (no listen)
├── index.ts                         # Server entry point (binds port)
├── .env.example                     # Committed template
├── CLAUDE.md                        # Updated to reflect Express stack
└── package.json
```

### `apps/web`

Feature-folder architecture mirroring the API. TanStack Router uses file-based routing under `src/routes/`.

```
apps/web/src/
├── routes/
│   ├── __root.tsx                   # Root layout
│   ├── index.tsx                    # Home / landing page
│   └── _auth/
│       ├── login.tsx
│       └── register.tsx
├── features/
│   ├── auth/
│   │   ├── components/              # LoginForm, RegisterForm
│   │   └── hooks/                  # useAuth, useCurrentUser
│   └── recipes/
│       ├── components/              # RecipeCard (stub)
│       └── hooks/                  # useRecipes (stub)
├── lib/
│   └── api-client.ts               # Typed fetch wrapper for all API calls
└── main.tsx
```

---

## 2. Database Schema

Four Mongoose models covering all planned core features.

### User

```typescript
{
  email: string; // unique, indexed (sparse: false)
  passwordHash: string;
  createdAt: Date;
}
// Indexes: { email: 1 } unique
```

### Ingredient

```typescript
{
  name: string; // unique, e.g. "chicken breast"
  unit: string; // e.g. "g", "ml", "piece"
  shelfLifeDays: number; // for pantry triage feature
}
// Indexes: { name: 1 } unique
```

### Recipe

```typescript
{
  title: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  tags: string[];         // e.g. ["warm", "quick", "spicy"]
  ingredients: Array<{
    ingredientId: ObjectId;  // ref: Ingredient
    quantity: number;
  }>;
  createdBy: ObjectId;   // ref: User
  createdAt: Date;
}
// Indexes: { createdBy: 1 }
```

### CalendarEntry

````typescript
{
  userId: ObjectId;       // ref: User
  recipeId: ObjectId;     // ref: Recipe
  date: Date;             // ISO date for the meal slot
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
}
// Indexes: { userId: 1, date: 1 } compound — for efficient weekly calendar queries

---

## 3. API Routes

All routes are prefixed `/api/`. Protected routes require a `Authorization: Bearer <token>` header.

### Auth — `/api/auth`

| Method | Path             | Auth | Description                      |
| ------ | ---------------- | ---- | -------------------------------- |
| POST   | `/auth/register` | No   | Create user, return JWT          |
| POST   | `/auth/login`    | No   | Validate credentials, return JWT |
| GET    | `/auth/me`       | Yes  | Return current user              |

### Recipes — `/api/recipes`

| Method | Path           | Auth | Description                                           |
| ------ | -------------- | ---- | ----------------------------------------------------- |
| GET    | `/recipes`     | Yes  | List all recipes                                      |
| POST   | `/recipes`     | Yes  | Create a recipe                                       |
| GET    | `/recipes/:id` | No   | Get single recipe (intentionally public for browsing) |
| DELETE | `/recipes/:id` | Yes  | Delete recipe (owner only)                            |

Calendar, shopping list, and NLP parsing routes are out of scope for this foundation phase.

---

## 4. Testing Infrastructure

### `apps/api` — Bun test

- **Test runner:** `bun test` (built-in, zero config)
- **Test files:** Co-located with feature code (`*.test.ts` alongside source files)
- **Database:** Tests run against a real MongoDB instance (`nomsydb_test`), configured via `TEST_MONGO_URI` env var
- **Setup/teardown:** Each test file manages its own data via `beforeAll`/`afterAll`

Two test levels:

1. **Unit tests** — service functions, JWT helpers, error utilities (mocked DB calls)
2. **Integration tests** — route handlers via Bun's `fetch` against a running test server. Each test file starts its own app instance on an ephemeral port (`app.listen(0)`) and closes it in `afterAll`, ensuring test isolation with no shared port conflicts.

### `apps/web` — Bun test

- **Test runner:** `bun test`
- **DOM simulation:** `happy-dom` package for browser API simulation
- **Test focus:** Custom hooks and pure utility functions
- Component rendering tests deferred until components contain real logic

### Turborepo `test` task

Added to `turbo.json`:

```json
"test": {
  "dependsOn": ["^build"],
  "outputs": [],
  "cache": false
}
````

Each workspace adds `"test": "bun test"` to its `package.json` scripts.

---

## 5. Error Handling

### API error shape

All error responses return a consistent JSON structure:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE"
}
```

Example codes: `AUTH_INVALID_CREDENTIALS`, `AUTH_EMAIL_TAKEN`, `RECIPE_NOT_FOUND`, `FORBIDDEN`.

### AppError class

A typed `AppError` is thrown from service and middleware layers:

```typescript
class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string,
  ) {
    super(message);
  }
}
```

A single Express error middleware at the bottom of `app.ts` catches all thrown errors and formats them consistently.

### Environment validation

At startup, `index.ts` validates that `JWT_SECRET` and `MONGO_URI` are set. The process exits with a clear error message if either is missing.

---

## 6. Conventions

### AI agent instructions (`CLAUDE.md`)

`apps/api/CLAUDE.md` is updated to:

- Reflect the actual stack (Express 5, Mongoose 9, MongoDB)
- Document the feature-folder convention
- Instruct agents to run `bun test` when verifying changes
- Note that `Bun.serve` / `Bun.sql` are **not** used in this project

### Environment variables

- `.env` is gitignored
- `.env.example` is committed with placeholder values:
  ```
  MONGO_URI=mongodb://admin:secretpassword@localhost:27017/nomsydb?authSource=admin
  TEST_MONGO_URI=mongodb://admin:secretpassword@localhost:27017/nomsydb_test?authSource=admin
  JWT_SECRET=change-me
  PORT=3001
  ```

### TypeScript

Strict mode remains enabled in all workspaces. No `any` unless explicitly suppressed with a comment explaining why.

---

## Out of Scope (Next Phases)

- Situational recommendation engine
- Drag-and-drop weekly calendar UI
- Smart shopping list aggregation
- NLP recipe parsing microservice
- Reinforcement learning engine
- Pantry triage / decay algorithm
- Rust parsing microservice
- End-to-end tests (Playwright)
