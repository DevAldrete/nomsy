import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  unit: { type: String, required: true, default: "g" },
  shelfLifeDays: { type: Number, required: true, default: 7 },
});

ingredientSchema.index({ name: 1 }, { unique: true });

export const Ingredient = mongoose.model("Ingredient", ingredientSchema);
