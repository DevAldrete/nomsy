import { test, expect, beforeAll, afterAll } from "bun:test";
import { connectDb } from "../../lib/db.js";
import app from "../../app.js";

let baseUrl: string = "http://127.0.0.1:0";
let token: string = "";
let close: () => Promise<void> = async () => {};

beforeAll(async () => {
  process.env.JWT_SECRET = "test-secret";
  process.env.MONGO_URI = process.env.TEST_MONGO_URI || "mongodb://admin:secretpassword@localhost:27017/nomsydb_test?authSource=admin";
  await connectDb(process.env.MONGO_URI);
  const server = app.listen(0);
  const addr = server.address();
  const port = typeof addr === "object" && addr?.port ? addr.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
  close = () =>
    new Promise((resolve) => {
      server.close(() => resolve());
    });
  const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `recipes-test-${Date.now()}@example.com`, password: "password123" }),
  });
  const data = (await registerRes.json()) as { token?: string };
  if (!data.token) throw new Error("Register failed: no token");
  token = data.token;
});

afterAll(async () => {
  if (typeof close === "function") await close();
});

test("POST /api/recipes creates recipe and returns 201", async () => {
  const res = await fetch(`${baseUrl}/api/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: "Test Recipe", description: "A test", prepTimeMinutes: 5, cookTimeMinutes: 10 }),
  });
  expect(res.status).toBe(201);
  const recipe = (await res.json()) as { _id: string; title: string };
  expect(recipe.title).toBe("Test Recipe");
  expect(recipe._id).toBeDefined();
});

test("POST /api/recipes with ingredients by name creates recipe with ingredients", async () => {
  const res = await fetch(`${baseUrl}/api/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      title: "Recipe With Flour",
      ingredients: [{ quantity: 2, unit: "cups", name: "flour" }],
    }),
  });
  expect(res.status).toBe(201);
  const recipe = (await res.json()) as { _id: string; ingredients?: unknown[] };
  expect(recipe.ingredients).toBeDefined();
  expect(Array.isArray(recipe.ingredients)).toBe(true);
  expect(recipe.ingredients!.length).toBe(1);
});

test("PATCH /api/recipes/:id updates recipe", async () => {
  const createRes = await fetch(`${baseUrl}/api/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: "Original Title", prepTimeMinutes: 0, cookTimeMinutes: 0 }),
  });
  const created = (await createRes.json()) as { _id: string };
  const res = await fetch(`${baseUrl}/api/recipes/${created._id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: "Updated Title" }),
  });
  expect(res.status).toBe(200);
  const updated = (await res.json()) as { title: string };
  expect(updated.title).toBe("Updated Title");
});

test("PATCH /api/recipes/:id with other user returns 404", async () => {
  const createRes = await fetch(`${baseUrl}/api/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: "Mine", prepTimeMinutes: 0, cookTimeMinutes: 0 }),
  });
  const created = (await createRes.json()) as { _id: string };
  const otherRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `other-${Date.now()}@example.com`, password: "password123" }),
  });
  const otherData = (await otherRes.json()) as { token?: string };
  const otherToken = otherData.token!;
  const res = await fetch(`${baseUrl}/api/recipes/${created._id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${otherToken}` },
    body: JSON.stringify({ title: "Hacked" }),
  });
  expect(res.status).toBe(404);
});

test("GET /api/recipes returns list for user", async () => {
  const res = await fetch(`${baseUrl}/api/recipes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status).toBe(200);
  const list = (await res.json()) as { _id: string; title: string }[];
  expect(Array.isArray(list)).toBe(true);
  expect(list.some((r) => r.title === "Test Recipe")).toBe(true);
});

test("GET /api/recipes/:id returns recipe (public)", async () => {
  const listRes = await fetch(`${baseUrl}/api/recipes`, { headers: { Authorization: `Bearer ${token}` } });
  const list = (await listRes.json()) as { _id: string }[];
  const id = list[0]._id;
  const res = await fetch(`${baseUrl}/api/recipes/${id}`);
  expect(res.status).toBe(200);
  const recipe = (await res.json()) as { title: string };
  expect(recipe.title).toBeDefined();
});

test("DELETE /api/recipes/:id returns 204 and GET then returns 404", async () => {
  const listRes = await fetch(`${baseUrl}/api/recipes`, { headers: { Authorization: `Bearer ${token}` } });
  const list = (await listRes.json()) as { _id: string }[];
  const id = list[0]._id;
  const delRes = await fetch(`${baseUrl}/api/recipes/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(delRes.status).toBe(204);
  const getRes = await fetch(`${baseUrl}/api/recipes/${id}`);
  expect(getRes.status).toBe(404);
});
