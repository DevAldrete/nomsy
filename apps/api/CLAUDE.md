---
description: Use Bun as runtime for package management and testing. Use Express for API server.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

## Package Manager

Use Bun for package management:

- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bun add <package>` instead of `npm install <package>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

Use Express for the API server. This project uses Express with TypeScript.

- Install packages: `bun add express cors helmet zod express-rate-limit`
- Install types: `bun add -d @types/express @types/cors`
- Use `bun test` to run tests (see Testing section below)

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

The frontend uses React + Vite (separate app in `apps/web/`).

For the API, use Express with TypeScript:

```ts#index.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

## Project Structure

```
apps/
  api/          # Express API server
  web/          # React + Vite frontend
packages/
  ui/           # Shared UI components
  eslint-config # ESLint configuration
  typescript-config # TypeScript configuration
```
