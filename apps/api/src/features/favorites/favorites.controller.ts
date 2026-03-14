import type { Request, Response } from "express";
import { favoritesService } from "./favorites.service.js";
import type { AuthUser } from "../../lib/middleware/auth.middleware.js";

export async function listFavorites(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: AuthUser }).user;
  const list = await favoritesService.list(userId);
  res.json(list);
}

export async function addFavorite(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: AuthUser }).user;
  const favorite = await favoritesService.add(userId, req.params.recipeId);
  res.status(201).json(favorite);
}

export async function removeFavorite(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: AuthUser }).user;
  await favoritesService.remove(userId, req.params.recipeId);
  res.status(204).send();
}
