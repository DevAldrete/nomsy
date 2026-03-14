import mongoose from "mongoose";

const userFavoriteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true },
  },
  { timestamps: true }
);

userFavoriteSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

export const UserFavorite = mongoose.model("UserFavorite", userFavoriteSchema);
