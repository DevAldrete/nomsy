import { test, expect } from "bun:test";
import { authService } from "./auth.service";

test("authService has register and login", () => {
  expect(typeof authService.register).toBe("function");
  expect(typeof authService.login).toBe("function");
});
