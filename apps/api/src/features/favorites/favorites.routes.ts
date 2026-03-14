import { Router } from "express";
import { listFavorites, addFavorite, removeFavorite } from "./favorites.controller.js";
import { authMiddleware } from "../../lib/middleware/auth.middleware.js";

const router = Router();

function asyncHandler(
  fn: (req: import("express").Request, res: import("express").Response) => Promise<void>
) {
  return (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

router.get("/", authMiddleware, asyncHandler(listFavorites));
router.post("/:recipeId", authMiddleware, asyncHandler(addFavorite));
router.delete("/:recipeId", authMiddleware, asyncHandler(removeFavorite));

export const favoritesRoutes = router;
