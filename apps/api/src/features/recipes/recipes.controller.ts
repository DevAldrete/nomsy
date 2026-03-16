import type { Request, Response } from "express";
import { recipesService } from "./recipes.service.js";
import type { AuthUser } from "../../lib/middleware/auth.middleware.js";

type RequestWithUser = Request & { user?: AuthUser };

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

export async function discover(req: Request, res: Response): Promise<void> {
  const search = (req.query.search as string)?.trim() || undefined;
  const tagsParam = req.query.tags;
  const tags = Array.isArray(tagsParam)
    ? (tagsParam as string[]).filter(Boolean)
    : typeof tagsParam === "string"
      ? tagsParam
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;
  const recipes = await recipesService.discover({ search, tags });
  res.json(recipes);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = (req as RequestWithUser).user?.userId;
  const recipe = await recipesService.getWithEngagement(id, userId);
  if (!recipe) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }
  res.json(recipe);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: AuthUser }).user;
  const recipe = await recipesService.update(
    req.params.id as string,
    userId,
    req.body,
  );
  res.json(recipe);
}

export async function deleteRecipe(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: AuthUser }).user;
  await recipesService.delete(req.params.id as string, userId);
  res.status(204).send();
}

export async function copyRecipe(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: AuthUser }).user;
  const recipe = await recipesService.copy(req.params.id as string, userId);
  res.status(201).json(recipe);
}
