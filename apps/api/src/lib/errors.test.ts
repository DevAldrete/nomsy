import { test, expect } from "bun:test";
import { AppError } from "./errors";

test("AppError has message, statusCode, code", () => {
  const err = new AppError("Bad request", 400, "BAD_REQUEST");
  expect(err.message).toBe("Bad request");
  expect(err.statusCode).toBe(400);
  expect(err.code).toBe("BAD_REQUEST");
  expect(err).toBeInstanceOf(Error);
});
