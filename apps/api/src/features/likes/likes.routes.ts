import { Router, type Request, type Response } from "express";
import { likesService } from "./likes.service.js";
import { authMiddleware, requireAuth } from "../../lib/middleware/auth.middleware.js";

export const likesRoutes = Router();

function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
) {
  return (req: Request, res: Response, next: (err?: unknown) => void) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

likesRoutes.post(
  "/recipes/:id/like",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const result = await likesService.likeRecipe(user.userId, req.params.id);
    res.json(result);
  }),
);

likesRoutes.delete(
  "/recipes/:id/like",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const result = await likesService.unlikeRecipe(user.userId, req.params.id);
    res.json(result);
  }),
);

likesRoutes.get(
  "/recipes/:id/like",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const result = await likesService.hasLiked(user.userId, req.params.id);
    res.json(result);
  }),
);
