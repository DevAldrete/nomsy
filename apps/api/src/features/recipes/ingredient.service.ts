import { Ingredient } from "./ingredient.model.js";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export async function findOrCreateIngredient(name: string, unit: string = "g"): Promise<string> {
  const n = normalizeName(name);
  if (!n) throw new Error("Ingredient name required");
  let ing = await Ingredient.findOne({ name: n });
  if (!ing) {
    ing = await Ingredient.create({ name: n, unit, shelfLifeDays: 7 });
  }
  return ing._id.toString();
}
