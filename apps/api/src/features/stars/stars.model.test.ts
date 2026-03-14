import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { connectTestDB, disconnectTestDB } from "../../lib/db.test.js";
import { RecipeStar } from "./stars.model.js";
import { User } from "../auth/auth.model.js";
import { Recipe } from "../recipes/recipes.model.js";

describe("RecipeStar Model", () => {
  let user: any, recipe: any;

  beforeAll(async () => {
    await connectTestDB();
    await RecipeStar.deleteMany({});
    user = await User.create({
      email: "star@test.com",
      passwordHash: "hash",
      displayName: "Star",
      avatar: "https://x.com/s.png",
    });
    recipe = await Recipe.create({
      title: "Star Recipe",
      prepTimeMinutes: 5,
      cookTimeMinutes: 15,
      createdBy: user._id,
    });
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  test("should create and find star rating", async () => {
    const star = await RecipeStar.create({
      userId: user._id,
      recipeId: recipe._id,
      rating: 4,
    });
    expect(star.rating).toBe(4);
    expect(star.userId.toString()).toBe(user._id.toString());
  });

  test("unique constraint prevents duplicate ratings per user/recipe", async () => {
    await RecipeStar.deleteMany({});
    await RecipeStar.create({
      userId: user._id,
      recipeId: recipe._id,
      rating: 3,
    });
    await expect(
      RecipeStar.create({
        userId: user._id,
        recipeId: recipe._id,
        rating: 5,
      }),
    ).rejects.toThrow();
  });
});
