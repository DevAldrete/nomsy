import { test, expect } from "bun:test";
import { recipesService } from "./recipes.service";

test("recipesService has list, create, getById, delete", () => {
  expect(typeof recipesService.list).toBe("function");
  expect(typeof recipesService.create).toBe("function");
  expect(typeof recipesService.getById).toBe("function");
  expect(typeof recipesService.delete).toBe("function");
});
