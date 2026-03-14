import mongoose from "mongoose";
import { UserFavorite } from "./favorites.model.js";
import { AppError } from "../../lib/errors.js";

export const favoritesService = {
  async list(userId: string) {
    return UserFavorite.find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate("recipeId")
      .sort({ createdAt: -1 })
      .lean();
  },

  async add(userId: string, recipeId: string) {
    const existing = await UserFavorite.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      recipeId: new mongoose.Types.ObjectId(recipeId),
    });
    if (existing) return existing;
    return UserFavorite.create({
      userId: new mongoose.Types.ObjectId(userId),
      recipeId: new mongoose.Types.ObjectId(recipeId),
    });
  },

  async remove(userId: string, recipeId: string) {
    const result = await UserFavorite.deleteOne({
      userId: new mongoose.Types.ObjectId(userId),
      recipeId: new mongoose.Types.ObjectId(recipeId),
    });
    if (result.deletedCount === 0) {
      throw new AppError("Favorite not found", 404, "NOT_FOUND");
    }
  },
};
