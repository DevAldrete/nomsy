import { Router } from "express";
import { register, login, me } from "./auth.controller.js";
import { authMiddleware } from "../../lib/middleware/auth.middleware.js";

const router = Router();

function asyncHandler(
  fn: (req: import("express").Request, res: import("express").Response) => Promise<void>
) {
  return (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.get("/me", authMiddleware, asyncHandler(me));

export const authRoutes = router;
