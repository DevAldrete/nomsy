import { RecipeStar } from "./stars.model.js";
import { Recipe } from "../recipes/recipes.model.js";
import { AppError } from "../../lib/errors.js";

export const starsService = {
  async setRating(userId: string, recipeId: string, rating: number) {
    if (rating < 1 || rating > 5) {
      throw new AppError(
        "Rating must be between 1 and 5",
        400,
        "INVALID_RATING",
      );
    }

    const existing = await RecipeStar.findOne({ userId, recipeId });

    if (existing) {
      const diff = rating - existing.rating;
      await Recipe.findByIdAndUpdate(recipeId, { $inc: { starsSum: diff } });
      existing.rating = rating;
      await existing.save();
    } else {
      await RecipeStar.create({ userId, recipeId, rating });
      await Recipe.findByIdAndUpdate(recipeId, {
        $inc: { starsSum: rating, starsCount: 1 },
      });
    }

    return { rating };
  },

  async removeRating(userId: string, recipeId: string) {
    const existing = await RecipeStar.findOne({ userId, recipeId });
    if (existing) {
      await Recipe.findByIdAndUpdate(recipeId, {
        $inc: { starsSum: -existing.rating, starsCount: -1 },
      });
      await RecipeStar.deleteOne({ _id: existing._id });
    }
    return { rating: null };
  },

  async getUserRating(userId: string, recipeId: string) {
    const star = await RecipeStar.findOne({ userId, recipeId });
    return { rating: star?.rating ?? null };
  },
};
