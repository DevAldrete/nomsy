import mongoose, { type Types } from "mongoose";
import { Recipe } from "./recipes.model.js";
import { RecipeLike } from "../likes/likes.model.js";
import { RecipeStar } from "../stars/stars.model.js";
import { AppError } from "../../lib/errors.js";
import { findOrCreateIngredient } from "./ingredient.service.js";

type IngredientInput = {
  ingredientId?: Types.ObjectId;
  quantity: number;
  unit?: string;
  name?: string;
};
type RecipeInput = {
  title: string;
  description?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  tags?: string[];
  ingredients?: IngredientInput[];
};

async function resolveIngredients(
  inputs: IngredientInput[],
): Promise<{ ingredientId: Types.ObjectId; quantity: number }[]> {
  const result: { ingredientId: Types.ObjectId; quantity: number }[] = [];
  for (const ing of inputs) {
    if (ing.name != null && ing.name.trim() !== "") {
      const id = await findOrCreateIngredient(ing.name, ing.unit ?? "g");
      result.push({
        ingredientId: new mongoose.Types.ObjectId(id),
        quantity: Number(ing.quantity) || 0,
      });
    } else if (ing.ingredientId) {
      result.push({
        ingredientId: ing.ingredientId,
        quantity: Number(ing.quantity) || 0,
      });
    }
  }
  return result;
}

function validateCreate(data: RecipeInput): void {
  if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
    throw new AppError("Title is required", 400, "VALIDATION_ERROR");
  }
  if (
    data.prepTimeMinutes != null &&
    (typeof data.prepTimeMinutes !== "number" || data.prepTimeMinutes < 0)
  ) {
    throw new AppError(
      "prepTimeMinutes must be a non-negative number",
      400,
      "VALIDATION_ERROR",
    );
  }
  if (
    data.cookTimeMinutes != null &&
    (typeof data.cookTimeMinutes !== "number" || data.cookTimeMinutes < 0)
  ) {
    throw new AppError(
      "cookTimeMinutes must be a non-negative number",
      400,
      "VALIDATION_ERROR",
    );
  }
  if (data.ingredients != null && data.ingredients.length > 0) {
    const hasValid = data.ingredients.some(
      (i) => (i.name != null && i.name.trim() !== "") || i.ingredientId,
    );
    if (!hasValid) {
      throw new AppError(
        "At least one ingredient must have a name",
        400,
        "VALIDATION_ERROR",
      );
    }
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const recipesService = {
  async list(userId: string) {
    return Recipe.find({ createdBy: userId }).sort({ createdAt: -1 }).lean();
  },

  async create(userId: string, data: RecipeInput) {
    validateCreate(data);
    let ingredients:
      | { ingredientId: Types.ObjectId; quantity: number }[]
      | undefined;
    if (data.ingredients != null && data.ingredients.length > 0) {
      ingredients = await resolveIngredients(data.ingredients);
    }
    const { ingredients: _ingredients, ...rest } = data;
    return Recipe.create({
      ...rest,
      ...(ingredients != null && ingredients.length > 0 ? { ingredients } : {}),
      createdBy: userId,
    });
  },

  async getById(id: string) {
    const recipe = await Recipe.findById(id)
      .populate("ingredients.ingredientId")
      .lean();
    if (!recipe)
      throw new AppError("Recipe not found", 404, "RECIPE_NOT_FOUND");
    return recipe;
  },

  async getWithEngagement(
    recipeId: string,
    userId?: string,
  ): Promise<Record<string, unknown> | null> {
    const recipe = await Recipe.findById(recipeId).populate(
      "ingredients.ingredientId",
    );
    if (!recipe) return null;

    const recipeObj = recipe.toObject() as Record<string, unknown>;
    const starsCount = (recipe as { starsCount?: number }).starsCount ?? 0;
    const starsSum = (recipe as { starsSum?: number }).starsSum ?? 0;
    recipeObj.averageStars =
      starsCount > 0 ? starsSum / starsCount : null;

    if (userId) {
      const [like, star] = await Promise.all([
        RecipeLike.findOne({ userId, recipeId }),
        RecipeStar.findOne({ userId, recipeId }),
      ]);
      recipeObj.userHasLiked = !!like;
      recipeObj.userStarRating = star?.rating ?? null;
    }

    return recipeObj;
  },

  async discover(filters?: { search?: string; tags?: string[] }) {
    const query: Record<string, unknown> = { publishedAt: { $ne: null } };
    if (filters?.search?.trim()) {
      const escaped = escapeRegex(filters.search.trim());
      const re = new RegExp(escaped, "i");
      query.$or = [{ title: re }, { description: re }];
    }
    if (filters?.tags != null && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
    return Recipe.find(query)
      .sort({ publishedAt: -1 })
      .populate("ingredients.ingredientId")
      .lean();
  },

  async update(
    recipeId: string,
    userId: string,
    data: Partial<RecipeInput> & { publishedAt?: Date | null },
  ) {
    const recipe = await Recipe.findOne({ _id: recipeId, createdBy: userId });
    if (!recipe)
      throw new AppError("Recipe not found", 404, "RECIPE_NOT_FOUND");
    if (
      data.prepTimeMinutes != null &&
      (typeof data.prepTimeMinutes !== "number" || data.prepTimeMinutes < 0)
    ) {
      throw new AppError(
        "prepTimeMinutes must be a non-negative number",
        400,
        "VALIDATION_ERROR",
      );
    }
    if (
      data.cookTimeMinutes != null &&
      (typeof data.cookTimeMinutes !== "number" || data.cookTimeMinutes < 0)
    ) {
      throw new AppError(
        "cookTimeMinutes must be a non-negative number",
        400,
        "VALIDATION_ERROR",
      );
    }
    let ingredients:
      | { ingredientId: Types.ObjectId; quantity: number }[]
      | undefined;
    if (data.ingredients != null) {
      ingredients =
        data.ingredients.length > 0
          ? await resolveIngredients(data.ingredients)
          : [];
    }
    const updates: Record<string, unknown> = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.prepTimeMinutes !== undefined)
      updates.prepTimeMinutes = data.prepTimeMinutes;
    if (data.cookTimeMinutes !== undefined)
      updates.cookTimeMinutes = data.cookTimeMinutes;
    if (data.tags !== undefined) updates.tags = data.tags;
    if (data.publishedAt !== undefined) updates.publishedAt = data.publishedAt;
    if (ingredients !== undefined) updates.ingredients = ingredients;
    const updated = await Recipe.findByIdAndUpdate(
      recipeId,
      { $set: updates },
      { returnDocument: "after", runValidators: true },
    )
      .populate("ingredients.ingredientId")
      .lean();
    if (!updated)
      throw new AppError("Recipe not found", 404, "RECIPE_NOT_FOUND");
    return updated;
  },

  async delete(id: string, userId: string) {
    const recipe = await Recipe.findOne({ _id: id, createdBy: userId });
    if (!recipe)
      throw new AppError("Recipe not found", 404, "RECIPE_NOT_FOUND");
    await Recipe.deleteOne({ _id: id });
  },

  async copy(recipeId: string, userId: string) {
    const recipe = await Recipe.findById(recipeId).lean();
    if (!recipe)
      throw new AppError("Recipe not found", 404, "RECIPE_NOT_FOUND");
    const newRecipe = await Recipe.create({
      title: recipe.title,
      description: recipe.description ?? "",
      prepTimeMinutes: recipe.prepTimeMinutes ?? 0,
      cookTimeMinutes: recipe.cookTimeMinutes ?? 0,
      tags: recipe.tags ?? [],
      ingredients: recipe.ingredients ?? [],
      createdBy: userId,
      publishedAt: null,
    });
    const populated = await Recipe.findById(newRecipe._id)
      .populate("ingredients.ingredientId")
      .lean();
    if (!populated)
      throw new AppError("Recipe not found", 404, "RECIPE_NOT_FOUND");
    return populated;
  },
};
