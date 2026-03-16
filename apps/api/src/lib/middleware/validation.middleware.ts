import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.union([z.number(), z.string()]).optional(),
  unit: z.string().optional(),
});

export const createRecipeSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  ingredients: z.array(ingredientSchema).optional(),
  instructions: z.array(z.string()).optional(),
  prepTimeMinutes: z.number().optional(),
  cookTimeMinutes: z.number().optional(),
  prepTime: z.number().optional(),
  cookTime: z.number().optional(),
  servings: z.number().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
});

export const updateRecipeSchema = createRecipeSchema.partial();

export function validate<T extends z.ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
