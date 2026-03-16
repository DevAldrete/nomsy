import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { connectTestDB, disconnectTestDB } from "../../lib/db.test.js";
import { User } from "../auth/auth.model.js";
import { Recipe } from "../recipes/recipes.model.js";
import { usersService } from "./users.service.js";

describe("Users Service", () => {
  let testUser: any;

  beforeAll(async () => {
    await connectTestDB();
    await User.deleteMany({});
    await Recipe.deleteMany({});
    testUser = await User.create({
      email: "profile@test.com",
      passwordHash: "hash",
      displayName: "Profile User",
      avatar: "https://example.com/avatar.png",
      username: "profileuser",
    });
    await Recipe.create({
      title: "Test Recipe",
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      createdBy: testUser._id,
      publishedAt: new Date(),
    });
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  test("getPublicProfile returns user with recipe count", async () => {
    const profile = await usersService.getPublicProfile("profileuser");
    expect(profile?.username).toBe("profileuser");
    expect(profile?.displayName).toBe("Profile User");
  });

  test("getPublicProfile returns null for non-existent username", async () => {
    const profile = await usersService.getPublicProfile("nonexistent");
    expect(profile).toBeNull();
  });

  test("updateProfile updates user fields", async () => {
    const updated = await usersService.updateProfile(testUser._id.toString(), {
      displayName: "Updated Name",
      bio: "New bio",
    });
    expect(updated?.displayName).toBe("Updated Name");
    expect(updated?.bio).toBe("New bio");
  });
});
