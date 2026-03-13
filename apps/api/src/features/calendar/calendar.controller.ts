import type { Request, Response } from "express";
import { calendarService } from "./calendar.service.js";
import type { AuthUser } from "../../lib/middleware/auth.middleware.js";

export async function listWeek(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: AuthUser }).user;
  const start = req.query.start as string;
  const end = req.query.end as string;
  if (!start || !end) {
    res
      .status(400)
      .json({
        error: "start and end query params required",
        code: "VALIDATION_ERROR",
      });
    return;
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  const entries = await calendarService.listWeek(userId, startDate, endDate);
  res.json(entries);
}

export async function add(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: AuthUser }).user;
  const { recipeId, date, mealType } = req.body as {
    recipeId?: string;
    date?: string;
    mealType?: string;
  };
  if (!recipeId || !date || !mealType) {
    res
      .status(400)
      .json({
        error: "recipeId, date, mealType required",
        code: "VALIDATION_ERROR",
      });
    return;
  }
  const validMealTypes = ["breakfast", "lunch", "dinner", "snack"];
  if (!validMealTypes.includes(mealType)) {
    res
      .status(400)
      .json({
        error: "mealType must be breakfast, lunch, dinner, or snack",
        code: "VALIDATION_ERROR",
      });
    return;
  }
  const entry = await calendarService.add(
    userId,
    recipeId,
    new Date(date),
    mealType as "breakfast" | "lunch" | "dinner" | "snack",
  );
  res.status(201).json(entry);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: AuthUser }).user;
  await calendarService.remove(req.params.id as string, userId);
  res.status(204).send();
}
