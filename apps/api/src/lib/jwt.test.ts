import { test, expect } from "bun:test";
import { signToken, verifyToken } from "./jwt";

test("signToken and verifyToken roundtrip", () => {
  const payload = { userId: "507f1f77bcf86cd799439011" };
  const token = signToken(payload);
  expect(typeof token).toBe("string");
  const decoded = verifyToken(token);
  expect(decoded.userId).toBe(payload.userId);
});
