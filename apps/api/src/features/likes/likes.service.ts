import { RecipeLike } from "./likes.model.js";
import { Recipe } from "../recipes/recipes.model.js";

export const likesService = {
  async likeRecipe(userId: string, recipeId: string) {
    const existing = await RecipeLike.findOne({ userId, recipeId });
    if (existing) return { liked: true };

    await RecipeLike.create({ userId, recipeId });
    await Recipe.findByIdAndUpdate(recipeId, { $inc: { likesCount: 1 } });
    return { liked: true };
  },

  async unlikeRecipe(userId: string, recipeId: string) {
    const result = await RecipeLike.findOneAndDelete({ userId, recipeId });
    if (result) {
      await Recipe.findByIdAndUpdate(recipeId, { $inc: { likesCount: -1 } });
    }
    return { liked: false };
  },

  async hasLiked(userId: string, recipeId: string) {
    const like = await RecipeLike.findOne({ userId, recipeId });
    return { liked: !!like };
  },
};
