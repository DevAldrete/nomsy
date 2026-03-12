import { test, expect, beforeAll, afterAll } from "bun:test";
import { connectDb } from "../../lib/db.js";
import app from "../../app.js";

let baseUrl: string = "http://127.0.0.1:0";
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
});

afterAll(async () => {
  if (typeof close === "function") await close();
});

test("POST /api/auth/register returns 201 and token", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "auth-test@example.com", password: "password123" }),
  });
  expect(res.status).toBe(201);
  const data = (await res.json()) as { token?: string; user?: { id: string; email: string } };
  expect(typeof data.token).toBe("string");
  expect(data.user?.email).toBe("auth-test@example.com");
});

test("POST /api/auth/register with same email returns 409", async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "auth-test@example.com", password: "other" }),
  });
  expect(res.status).toBe(409);
  const data = (await res.json()) as { code?: string };
  expect(data.code).toBe("AUTH_EMAIL_TAKEN");
});

test("POST /api/auth/login returns 200 and token", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "auth-test@example.com", password: "password123" }),
  });
  expect(res.status).toBe(200);
  const data = (await res.json()) as { token?: string; user?: { email: string } };
  expect(typeof data.token).toBe("string");
  expect(data.user?.email).toBe("auth-test@example.com");
});

test("POST /api/auth/login invalid credentials returns 401", async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "auth-test@example.com", password: "wrong" }),
  });
  expect(res.status).toBe(401);
  const data = (await res.json()) as { code?: string };
  expect(data.code).toBe("AUTH_INVALID_CREDENTIALS");
});

test("GET /api/auth/me with valid token returns user", async () => {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "auth-test@example.com", password: "password123" }),
  });
  const { token } = (await loginRes.json()) as { token: string };
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(meRes.status).toBe(200);
  const me = (await meRes.json()) as { id: string; email: string };
  expect(me.email).toBe("auth-test@example.com");
});

test("GET /api/auth/me without token returns 401", async () => {
  const res = await fetch(`${baseUrl}/api/auth/me`);
  expect(res.status).toBe(401);
});
