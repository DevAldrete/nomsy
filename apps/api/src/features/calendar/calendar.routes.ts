import { Router } from "express";
import { listWeek, add, remove } from "./calendar.controller.js";
import { authMiddleware } from "../../lib/middleware/auth.middleware.js";

const router = Router();

function asyncHandler(
  fn: (req: import("express").Request, res: import("express").Response) => Promise<void>
) {
  return (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

router.get("/week", authMiddleware, asyncHandler(listWeek));
router.post("/", authMiddleware, asyncHandler(add));
router.delete("/:id", authMiddleware, asyncHandler(remove));

export const calendarRoutes = router;
