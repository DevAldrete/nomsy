import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    prepTimeMinutes: { type: Number, required: true, default: 0 },
    cookTimeMinutes: { type: Number, required: true, default: 0 },
    tags: [{ type: String }],
    ingredients: [
      {
        ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true },
        quantity: { type: Number, required: true },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

recipeSchema.index({ createdBy: 1 });

export const Recipe = mongoose.model("Recipe", recipeSchema);
