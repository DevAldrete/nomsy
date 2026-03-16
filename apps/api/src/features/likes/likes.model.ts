import mongoose from "mongoose";

const recipeLikeSchema = new mongoose.Schema(
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
  },
  { timestamps: true },
);

recipeLikeSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

export const RecipeLike = mongoose.model("RecipeLike", recipeLikeSchema);
