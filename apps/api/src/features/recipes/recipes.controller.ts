import type { Request, Response } from "express";
import { recipesService } from "./recipes.service.js";
import type { AuthUser } from "../../lib/middleware/auth.middleware.js";

export async function list(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: AuthUser }).user;
  const recipes = await recipesService.list(userId);
  res.json(recipes);
}

export async function create(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: AuthUser }).user;
  const recipe = await recipesService.create(userId, req.body);
  res.status(201).json(recipe);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const recipe = await recipesService.getById(req.params.id);
  res.json(recipe);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: AuthUser }).user;
  const recipe = await recipesService.update(req.params.id, userId, req.body);
  res.json(recipe);
}

export async function deleteRecipe(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: AuthUser }).user;
  await recipesService.delete(req.params.id, userId);
  res.status(204).send();
}
