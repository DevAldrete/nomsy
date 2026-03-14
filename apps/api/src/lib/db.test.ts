import { test, expect } from "bun:test";
import { connectDb } from "./db";

test("connectDb is a function", () => {
  expect(typeof connectDb).toBe("function");
});
