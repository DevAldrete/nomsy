import { test, expect } from "bun:test";
import { findOrCreateIngredient } from "./ingredient.service";

test("findOrCreateIngredient is a function", () => {
  expect(typeof findOrCreateIngredient).toBe("function");
});
