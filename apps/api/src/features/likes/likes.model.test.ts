import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { connectTestDB, disconnectTestDB } from "../../lib/db.test.js";
import { RecipeLike } from "./likes.model.js";
import { User } from "../auth/auth.model.js";
import { Recipe } from "../recipes/recipes.model.js";

describe("RecipeLike Model", () => {
  let user: any, recipe: any;

  beforeAll(async () => {
    await connectTestDB();
    await RecipeLike.deleteMany({});
    user = await User.create({
      email: "like@test.com",
      passwordHash: "hash",
      displayName: "Like",
      avatar: "https://x.com/a.png",
    });
    recipe = await Recipe.create({
      title: "Test Recipe",
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      createdBy: user._id,
    });
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  test("should create and find like", async () => {
    const like = await RecipeLike.create({
      userId: user._id,
      recipeId: recipe._id,
    });
    expect(like.userId.toString()).toBe(user._id.toString());
  });

  test("unique constraint prevents duplicate likes", async () => {
    await RecipeLike.deleteMany({});
    await RecipeLike.create({ userId: user._id, recipeId: recipe._id });
    await expect(
      RecipeLike.create({ userId: user._id, recipeId: recipe._id }),
    ).rejects.toThrow();
  });
});
