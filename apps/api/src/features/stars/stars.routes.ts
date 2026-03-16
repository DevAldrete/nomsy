import { Router, type Request, type Response } from "express";
import { starsService } from "./stars.service.js";
import { authMiddleware, requireAuth } from "../../lib/middleware/auth.middleware.js";

export const starsRoutes = Router();

function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
) {
  return (req: Request, res: Response, next: (err?: unknown) => void) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}

starsRoutes.post(
  "/recipes/:id/stars",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const { rating } = req.body;
    const result = await starsService.setRating(
      user.userId,
      req.params.id,
      rating,
    );
    res.json(result);
  }),
);

starsRoutes.delete(
  "/recipes/:id/stars",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const result = await starsService.removeRating(user.userId, req.params.id);
    res.json(result);
  }),
);

starsRoutes.get(
  "/recipes/:id/stars",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const result = await starsService.getUserRating(user.userId, req.params.id);
    res.json(result);
  }),
);
