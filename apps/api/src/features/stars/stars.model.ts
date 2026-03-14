import mongoose from "mongoose";

const recipeStarSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true },
);

recipeStarSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

export const RecipeStar = mongoose.model("RecipeStar", recipeStarSchema);
