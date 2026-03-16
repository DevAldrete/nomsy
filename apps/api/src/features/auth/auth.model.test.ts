import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { User } from "./auth.model.js";
import { connectTestDB, disconnectTestDB } from "../../lib/db.test.js";

describe("User Model", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  test("should have displayName, avatar, bio, username fields", async () => {
    await User.deleteMany({});
    const user = await User.create({
      email: "test@example.com",
      passwordHash: "hash",
      displayName: "Test User",
      avatar: "https://example.com/avatar.png",
      bio: "Hello world",
      username: "testuser",
    });
    expect(user.displayName).toBe("Test User");
    expect(user.avatar).toBe("https://example.com/avatar.png");
    expect(user.bio).toBe("Hello world");
    expect(user.username).toBe("testuser");
  });

  test("username should be unique", async () => {
    await User.deleteMany({});
    await User.create({
      email: "one@example.com",
      passwordHash: "hash",
      displayName: "One",
      avatar: "https://example.com/1.png",
      username: "duplicate",
    });
    await expect(
      User.create({
        email: "two@example.com",
        passwordHash: "hash",
        displayName: "Two",
        avatar: "https://example.com/2.png",
        username: "duplicate",
      }),
    ).rejects.toThrow();
  });
});
