import { Router } from "express";
import { list, create, getById, update, deleteRecipe } from "./recipes.controller.js";
import { authMiddleware } from "../../lib/middleware/auth.middleware.js";

const router = Router();

function asyncHandler(
  fn: (req: import("express").Request, res: import("express").Response) => Promise<void>
) {
  return (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

router.get("/", authMiddleware, asyncHandler(list));
router.post("/", authMiddleware, asyncHandler(create));
router.get("/:id", asyncHandler(getById));
router.patch("/:id", authMiddleware, asyncHandler(update));
router.delete("/:id", authMiddleware, asyncHandler(deleteRecipe));

export const recipesRoutes = router;
