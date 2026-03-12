import { Recipe } from "./recipes.model.js";
import { AppError } from "../../lib/errors.js";
import type { Types } from "mongoose";

type RecipeInput = {
  title: string;
  description?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  tags?: string[];
  ingredients?: { ingredientId: Types.ObjectId; quantity: number }[];
};

export const recipesService = {
  async list(userId: string) {
    return Recipe.find({ createdBy: userId }).sort({ createdAt: -1 }).lean();
  },

  async create(userId: string, data: RecipeInput) {
    return Recipe.create({
      ...data,
      createdBy: userId,
    });
  },

  async getById(id: string) {
    const recipe = await Recipe.findById(id).populate("ingredients.ingredientId").lean();
    if (!recipe) throw new AppError("Recipe not found", 404, "RECIPE_NOT_FOUND");
    return recipe;
  },

  async delete(id: string, userId: string) {
    const recipe = await Recipe.findOne({ _id: id, createdBy: userId });
    if (!recipe) throw new AppError("Recipe not found", 404, "RECIPE_NOT_FOUND");
    await Recipe.deleteOne({ _id: id });
  },
};
