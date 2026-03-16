# User Profiles and Recipe Likes/Stars Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user profiles with display name, avatar, bio, and username. Make profiles discoverable via published recipes. Add likes and star ratings to recipes with popularity-based sorting.

**Architecture:**

- API: Extend User model, add RecipeLike/RecipeStar models, new user routes, update recipe routes
- Frontend: Add profile pages (public /@:username, private /profile), update recipe cards with like/star UI, add sorting to discover

**Tech Stack:** Express API, React + Vite, MongoDB/Mongoose

---

## Chunk 1: Backend - User Profile Models and Routes

### Task 1: Update User Model

**Files:**

- Modify: `apps/api/src/features/auth/auth.model.ts`
- Test: `apps/api/src/features/auth/auth.model.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```typescript
// apps/api/src/features/auth/auth.model.test.ts
import { describe, test, expect, beforeAll } from "bun:test";
import { User } from "./auth.model.js";
import { connectTestDB, disconnectTestDB } from "../../../lib/db.test.js";

describe("User Model", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  test("should have displayName, avatar, bio, username fields", async () => {
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && bun test src/features/auth/auth.model.test.ts`
Expected: FAIL - import errors, model doesn't have fields

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/api/src/features/auth/auth.model.ts
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, maxlength: 50 },
    avatar: { type: String, required: true }, // URL
    bio: { type: String, maxlength: 500 },
    username: {
      type: String,
      unique: true,
      sparse: true,
      maxlength: 30,
      match: /^[a-zA-Z0-9_]{3,30}$/,
    },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 });

export const User = mongoose.model("User", userSchema);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && bun test src/features/auth/auth.model.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
jj add apps/api/src/features/auth/auth.model.ts apps/api/src/features/auth/auth.model.test.ts
jj commit -m "feat(api): add profile fields to User model with validation"
```

---

### Task 2: Create User Routes and Service

**Files:**

- Create: `apps/api/src/features/users/users.service.ts`
- Create: `apps/api/src/features/users/users.controller.ts`
- Create: `apps/api/src/features/users/users.routes.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/api/src/features/users/users.test.ts
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { connectTestDB, disconnectTestDB } from "../../../lib/db.test.js";
import { User } from "../auth/auth.model.js";
import { usersService } from "./users.service.js";

describe("Users Service", () => {
  let testUser: any;

  beforeAll(async () => {
    await connectTestDB();
    await User.deleteMany({});
    testUser = await User.create({
      email: "profile@test.com",
      passwordHash: "hash",
      displayName: "Profile User",
      avatar: "https://example.com/avatar.png",
      username: "profileuser",
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && bun test src/features/users/users.test.ts`
Expected: FAIL - module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// apps/api/src/features/users/users.service.ts
import { User } from "../auth/auth.model.js";
import { Recipe } from "../recipes/recipes.model.js";
import { AppError } from "../../lib/errors.js";

export const usersService = {
  async getPublicProfile(username: string) {
    const user = await User.findOne({ username });
    if (!user) return null;

    const recipeCount = await Recipe.countDocuments({
      createdBy: user._id,
      publishedAt: { $ne: null },
    });

    if (recipeCount === 0) return null;

    return {
      id: user._id.toString(),
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      username: user.username,
      createdAt: user.createdAt,
      recipeCount,
    };
  },

  async getUserRecipes(
    username: string,
    page = 1,
    limit = 20,
    tag?: string,
    sort = "recent",
  ) {
    const user = await User.findOne({ username });
    if (!user) return null;

    const query: any = { createdBy: user._id, publishedAt: { $ne: null } };
    if (tag) query.tags = tag;

    let sortOption: any = { publishedAt: -1 };
    if (sort === "mostLiked") sortOption = { likesCount: -1 };
    if (sort === "highestRated") sortOption = { starsSum: -1 };

    const [recipes, total] = await Promise.all([
      Recipe.find(query)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit),
      Recipe.countDocuments(query),
    ]);

    return { recipes, total, page, limit };
  },

  async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    return {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio,
      username: user.username,
    };
  },

  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      avatar?: string;
      bio?: string;
      username?: string;
    },
  ) {
    if (data.username) {
      const existing = await User.findOne({
        username: data.username,
        _id: { $ne: userId },
      });
      if (existing)
        throw new AppError("Username already taken", 409, "USERNAME_TAKEN");
    }

    const user = await User.findByIdAndUpdate(userId, data, { new: true });
    if (!user) throw new AppError("User not found", 404);
    return user;
  },

  async getDrafts(userId: string, page = 1, limit = 20) {
    const [recipes, total] = await Promise.all([
      Recipe.find({ createdBy: userId, publishedAt: null })
        .skip((page - 1) * limit)
        .limit(limit),
      Recipe.countDocuments({ createdBy: userId, publishedAt: null }),
    ]);
    return { recipes, total, page, limit };
  },

  async getFavorites(userId: string, page = 1, limit = 20) {
    const { UserFavorite } = await import("../favorites/favorites.model.js");
    const favorites = await UserFavorite.find({ userId })
      .populate("recipeId")
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await UserFavorite.countDocuments({ userId });
    const recipes = favorites.map((f) => f.recipeId).filter(Boolean);
    return { recipes, total, page, limit };
  },
};
```

```typescript
// apps/api/src/features/users/users.controller.ts
import { Request, Response } from "express";
import { usersService } from "./users.service.js";
import { requireAuth } from "../../lib/middleware/auth.middleware.js";

export const usersController = {
  async getPublicProfile(req: Request, res: Response) {
    const { username } = req.params;
    const profile = await usersService.getPublicProfile(username);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(profile);
  },

  async getUserRecipes(req: Request, res: Response) {
    const { username } = req.params;
    const { page = "1", limit = "20", tag, sort = "recent" } = req.query;
    const result = await usersService.getUserRecipes(
      username,
      parseInt(page as string),
      parseInt(limit as string),
      tag as string | undefined,
      sort as string,
    );
    if (!result) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result);
  },

  async getProfile(req: Request, res: Response) {
    const user = requireAuth(req);
    const profile = await usersService.getProfile(user.userId);
    res.json(profile);
  },

  async updateProfile(req: Request, res: Response) {
    const user = requireAuth(req);
    const { displayName, avatar, bio, username } = req.body;
    const updated = await usersService.updateProfile(user.userId, {
      displayName,
      avatar,
      bio,
      username,
    });
    res.json({
      id: updated._id.toString(),
      email: updated.email,
      displayName: updated.displayName,
      avatar: updated.avatar,
      bio: updated.bio,
      username: updated.username,
    });
  },

  async getDrafts(req: Request, res: Response) {
    const user = requireAuth(req);
    const { page = "1", limit = "20" } = req.query;
    const result = await usersService.getDrafts(
      user.userId,
      parseInt(page as string),
      parseInt(limit as string),
    );
    res.json(result);
  },

  async getFavorites(req: Request, res: Response) {
    // Implemented in existing favorites feature - this endpoint just exposes it
    const user = requireAuth(req);
    const { page = "1", limit = "20" } = req.query;
    // Will call favorites service
    const result = await usersService.getFavorites(
      user.userId,
      parseInt(page as string),
      parseInt(limit as string),
    );
    res.json(result);
  },
};
```

```typescript
// apps/api/src/features/users/users.routes.ts
import { Router } from "express";
import { usersController } from "./users.controller.js";
import { requireAuth } from "../../lib/middleware/auth.middleware.js";

export const usersRoutes = Router();

usersRoutes.get("/users/:username", usersController.getPublicProfile);
usersRoutes.get("/users/:username/recipes", usersController.getUserRecipes);
usersRoutes.get("/profile", requireAuth, usersController.getProfile);
usersRoutes.put("/profile", requireAuth, usersController.updateProfile);
usersRoutes.get("/profile/drafts", requireAuth, usersController.getDrafts);
usersRoutes.get(
  "/profile/favorites",
  requireAuth,
  usersController.getFavorites,
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && bun test src/features/users/users.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
jj add apps/api/src/features/users/users.service.ts apps/api/src/features/users/users.controller.ts apps/api/src/features/users/users.routes.ts
jj commit -m "feat(api): add users service and routes for profiles"
```

---

### Task 3: Update app.ts to include users routes

**Files:**

- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Add import and route**

```typescript
// In app.ts, add import:
import { usersRoutes } from "./features/users/users.routes.js";

// Add route:
app.use("/api", usersRoutes);
```

- [ ] **Step 2: Commit**

```bash
jj add apps/api/src/app.ts
jj commit -m "feat(api): mount users routes"
```

---

## Chunk 2: Backend - Recipe Likes and Stars

### Task 4: Create RecipeLike and RecipeStar Models

**Files:**

- Create: `apps/api/src/features/likes/likes.model.ts`
- Create: `apps/api/src/features/stars/stars.model.ts`
- Modify: `apps/api/src/features/recipes/recipes.model.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// apps/api/src/features/likes/likes.model.test.ts
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { connectTestDB, disconnectTestDB } from "../../../lib/db.test.js";
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

  test("should create and find like", async () => {
    const like = await RecipeLike.create({
      userId: user._id,
      recipeId: recipe._id,
    });
    expect(like.userId.toString()).toBe(user._id.toString());
  });

  test("unique constraint prevents duplicate likes", async () => {
    await RecipeLike.create({ userId: user._id, recipeId: recipe._id });
    await expect(
      RecipeLike.create({ userId: user._id, recipeId: recipe._id }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/api && bun test src/features/likes/likes.model.test.ts src/features/stars/stars.model.test.ts`
Expected: FAIL - modules don't exist

- [ ] **Step 3: Write implementations**

```typescript
// apps/api/src/features/likes/likes.model.ts
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
```

```typescript
// apps/api/src/features/stars/stars.model.ts
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
```

- [ ] **Step 4: Update Recipe model**

```typescript
// In apps/api/src/features/recipes/recipes.model.ts, add fields:
likesCount: { type: Number, default: 0 },
starsSum: { type: Number, default: 0 },
starsCount: { type: Number, default: 0 },
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd apps/api && bun test src/features/likes/likes.model.test.ts src/features/stars/stars.model.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
jj add apps/api/src/features/likes/likes.model.ts apps/api/src/features/stars/stars.model.ts apps/api/src/features/recipes/recipes.model.ts
jj commit -m "feat(api): add RecipeLike and RecipeStar models, update Recipe with counts"
```

---

### Task 5: Create Likes and Stars Service

**Files:**

- Create: `apps/api/src/features/likes/likes.service.ts`
- Create: `apps/api/src/features/stars/stars.service.ts`
- Modify: `apps/api/src/features/recipes/recipes.service.ts`

- [ ] **Step 1: Write service implementations**

```typescript
// apps/api/src/features/likes/likes.service.ts
import { RecipeLike } from "./likes.model.js";
import { Recipe } from "../recipes/recipes.model.js";

export const likesService = {
  async likeRecipe(userId: string, recipeId: string) {
    const existing = await RecipeLike.findOne({ userId, recipeId });
    if (existing) return { liked: true };

    await RecipeLike.create({ userId, recipeId });
    await Recipe.findByIdAndUpdate(recipeId, { $inc: { likesCount: 1 } });
    return { liked: true };
  },

  async unlikeRecipe(userId: string, recipeId: string) {
    const result = await RecipeLike.findOneAndDelete({ userId, recipeId });
    if (result) {
      await Recipe.findByIdAndUpdate(recipeId, { $inc: { likesCount: -1 } });
    }
    return { liked: false };
  },

  async hasLiked(userId: string, recipeId: string) {
    const like = await RecipeLike.findOne({ userId, recipeId });
    return { liked: !!like };
  },
};
```

```typescript
// apps/api/src/features/stars/stars.service.ts
import { RecipeStar } from "./stars.model.js";
import { Recipe } from "../recipes/recipes.model.js";
import { AppError } from "../../lib/errors.js";

export const starsService = {
  async setRating(userId: string, recipeId: string, rating: number) {
    if (rating < 1 || rating > 5) {
      throw new AppError(
        "Rating must be between 1 and 5",
        400,
        "INVALID_RATING",
      );
    }

    const existing = await RecipeStar.findOne({ userId, recipeId });

    if (existing) {
      // Calculate diff and update atomically
      const diff = rating - existing.rating;
      await Recipe.findByIdAndUpdate(recipeId, { $inc: { starsSum: diff } });
      existing.rating = rating;
      await existing.save();
    } else {
      await RecipeStar.create({ userId, recipeId, rating });
      await Recipe.findByIdAndUpdate(recipeId, {
        $inc: { starsSum: rating, starsCount: 1 },
      });
    }

    return { rating };
  },

  async removeRating(userId: string, recipeId: string) {
    const existing = await RecipeStar.findOne({ userId, recipeId });
    if (existing) {
      await Recipe.findByIdAndUpdate(recipeId, {
        $inc: { starsSum: -existing.rating, starsCount: -1 },
      });
      await RecipeStar.deleteOne({ _id: existing._id });
    }
    return { rating: null };
  },

  async getUserRating(userId: string, recipeId: string) {
    const star = await RecipeStar.findOne({ userId, recipeId });
    return { rating: star?.rating ?? null };
  },
};
```

- [ ] **Step 2: Commit**

```bash
jj add apps/api/src/features/likes/likes.service.ts apps/api/src/features/stars/stars.service.ts
jj commit -m "feat(api): add likes and stars services"
```

---

### Task 6: Add Likes/Stars Routes

**Files:**

- Create: `apps/api/src/features/likes/likes.routes.ts`
- Create: `apps/api/src/features/stars/stars.routes.ts`
- Modify: `apps/api/src/app.ts`

- [ ] **Step 1: Create route files**

```typescript
// apps/api/src/features/likes/likes.routes.ts
import { Router } from "express";
import { likesService } from "./likes.service.js";
import { requireAuth } from "../../lib/middleware/auth.middleware.js";

export const likesRoutes = Router();

likesRoutes.post("/recipes/:id/like", requireAuth, async (req, res) => {
  const user = requireAuth(req);
  const result = await likesService.likeRecipe(user.userId, req.params.id);
  res.json(result);
});

likesRoutes.delete("/recipes/:id/like", requireAuth, async (req, res) => {
  const user = requireAuth(req);
  const result = await likesService.unlikeRecipe(user.userId, req.params.id);
  res.json(result);
});

likesRoutes.get("/recipes/:id/like", requireAuth, async (req, res) => {
  const user = requireAuth(req);
  const result = await likesService.hasLiked(user.userId, req.params.id);
  res.json(result);
});
```

```typescript
// apps/api/src/features/stars/stars.routes.ts
import { Router } from "express";
import { starsService } from "./stars.service.js";
import { requireAuth } from "../../lib/middleware/auth.middleware.js";

export const starsRoutes = Router();

starsRoutes.post("/recipes/:id/stars", requireAuth, async (req, res) => {
  const user = requireAuth(req);
  const { rating } = req.body;
  const result = await starsService.setRating(
    user.userId,
    req.params.id,
    rating,
  );
  res.json(result);
});

starsRoutes.delete("/recipes/:id/stars", requireAuth, async (req, res) => {
  const user = requireAuth(req);
  const result = await starsService.removeRating(user.userId, req.params.id);
  res.json(result);
});

starsRoutes.get("/recipes/:id/stars", requireAuth, async (req, res) => {
  const user = requireAuth(req);
  const result = await starsService.getUserRating(user.userId, req.params.id);
  res.json(result);
});
```

- [ ] **Step 2: Update app.ts**

```typescript
// Add imports and routes in app.ts:
import { likesRoutes } from "./features/likes/likes.routes.js";
import { starsRoutes } from "./features/stars/stars.routes.js";

app.use("/api", likesRoutes);
app.use("/api", starsRoutes);
```

- [ ] **Step 3: Commit**

```bash
jj add apps/api/src/features/likes/likes.routes.ts apps/api/src/features/stars/stars.routes.ts apps/api/src/app.ts
jj commit -m "feat(api): add likes and stars routes"
```

---

### Task 7: Update Recipe Service to Include Engagement Data

**Files:**

- Modify: `apps/api/src/features/recipes/recipes.service.ts`

- [ ] **Step 1: Add method to get recipe with engagement data**

```typescript
// Add to recipes.service.ts:
async getWithEngagement(recipeId: string, userId?: string) {
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) return null;

  const recipeObj = recipe.toObject();
  recipeObj.averageStars = recipe.starsCount > 0 ? recipe.starsSum / recipe.starsCount : null;

  if (userId) {
    const [like, star] = await Promise.all([
      RecipeLike.findOne({ userId, recipeId }),
      RecipeStar.findOne({ userId, recipeId }),
    ]);
    recipeObj.userHasLiked = !!like;
    recipeObj.userStarRating = star?.rating ?? null;
  }

  return recipeObj;
}
```

- [ ] **Step 2: Update recipe controller to use this method**

In `apps/api/src/features/recipes/recipes.controller.ts`, update the `getRecipe` method to use `getWithEngagement`:

```typescript
async getRecipe(req: Request, res: Response) {
  const { id } = req.params;
  const user = req.user; // from requireAuth middleware if present

  const recipe = await recipesService.getWithEngagement(id, user?.userId);
  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }
  res.json(recipe);
}
```

Also update the `getRecipes` method in the index route to include engagement data for authenticated users.

- [ ] **Step 3: Commit**

```bash
jj add apps/api/src/features/recipes/recipes.service.ts
jj commit -m "feat(api): add engagement data to recipe responses"
```

---

## Chunk 3: Frontend - Profile Pages

### Task 8: Create Profile Hook and API Client

**Files:**

- Create: `apps/web/src/features/profile/hooks/useProfile.ts`
- Create: `apps/web/src/features/profile/hooks/useUserRecipes.ts`
- Create: `apps/web/src/features/profile/hooks/usePublicProfile.ts`

- [ ] **Step 1: Create public profile hook**

```typescript
// apps/web/src/features/profile/hooks/usePublicProfile.ts
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api-client";

export type PublicProfile = {
  id: string;
  displayName: string;
  avatar: string;
  bio?: string;
  username: string;
  createdAt: string;
  recipeCount: number;
};

export function usePublicProfile(username: string) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    api<PublicProfile>(`/users/${username}`)
      .then(setProfile)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load");
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, loading, error, refetch };
}
```

- [ ] **Step 2: Create hooks**

```typescript
// apps/web/src/features/profile/hooks/useProfile.ts
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api-client";
import { getToken } from "../../../lib/api-client";

export type Profile = {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  bio?: string;
  username?: string;
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api<Profile>("/profile", { token })
      .then(setProfile)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateProfile = async (data: Partial<Profile>) => {
    const token = getToken()!;
    const updated = await api<Profile>("/profile", {
      token,
      method: "PUT",
      body: data,
    });
    setProfile(updated);
    return updated;
  };

  return { profile, loading, error, refetch, updateProfile };
}
```

```typescript
// apps/web/src/features/profile/hooks/useUserRecipes.ts
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api-client";

export type UserRecipe = {
  _id: string;
  title: string;
  description?: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  tags?: string[];
  publishedAt?: string | null;
  likesCount?: number;
  averageStars?: number | null;
  starsCount?: number;
};

type RecipeListResponse = {
  recipes: UserRecipe[];
  total: number;
  page: number;
  limit: number;
};

export function useUserRecipes(
  username: string,
  options?: { page?: number; tag?: string; sort?: string },
) {
  const [recipes, setRecipes] = useState<UserRecipe[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = options?.page ?? 1;
  const tag = options?.tag;
  const sort = options?.sort ?? "recent";

  const refetch = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", page.toString());
    if (tag) params.set("tag", tag);
    if (sort) params.set("sort", sort);

    api<RecipeListResponse>(`/users/${username}/recipes?${params}`)
      .then((res) => {
        setRecipes(res.recipes);
        setTotal(res.total);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, [username, page, tag, sort]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { recipes, total, loading, error, refetch };
}
```

- [ ] **Step 2: Commit**

```bash
jj add apps/web/src/features/profile/hooks/useProfile.ts apps/web/src/features/profile/hooks/useUserRecipes.ts apps/web/src/features/profile/hooks/usePublicProfile.ts
jj commit -m "feat(web): add profile and user recipes hooks"
```

---

### Task 9: Create Profile Routes

**Files:**

- Create: `apps/web/src/routes/profile.tsx`
- Create: `apps/web/src/routes/@$username.tsx`

- [ ] **Step 1: Create public profile page**

```tsx
// apps/web/src/routes/@$username.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useUserRecipes } from "../features/profile/hooks/useUserRecipes";
import { usePublicProfile } from "../features/profile/hooks/usePublicProfile";

export const Route = createFileRoute("/$username")({
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { profile, loading: profileLoading } = usePublicProfile(username);
  const {
    recipes,
    loading: recipesLoading,
    error,
    total,
  } = useUserRecipes(username);

  const loading = profileLoading || recipesLoading;
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error || !profile)
    return (
      <div className="p-8 text-center text-red-500">
        {error ?? "Profile not found"}
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-8">
        <img
          src={profile.avatar}
          alt={profile.displayName}
          className="w-24 h-24 rounded-full mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold">{profile.displayName}</h1>
        {profile.bio && <p className="text-gray-500 mt-2">{profile.bio}</p>}
        <p className="text-gray-400 mt-1">{total} published recipes</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recipes.map((recipe) => (
          <div key={recipe._id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{recipe.title}</h3>
            <p className="text-sm text-gray-500">{recipe.description}</p>
            <div className="flex gap-2 mt-2">
              {recipe.likesCount ? <span>❤️ {recipe.likesCount}</span> : null}
              {recipe.averageStars ? (
                <span>⭐ {recipe.averageStars.toFixed(1)}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create private profile page**

```tsx
// apps/web/src/routes/profile.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useProfile } from "../features/profile/hooks/useProfile";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

type Tab = "overview" | "drafts" | "favorites" | "settings";

function ProfilePage() {
  const { profile, loading, error, updateProfile } = useProfile();
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: profile?.displayName ?? "",
    avatar: profile?.avatar ?? "",
    bio: profile?.bio ?? "",
    username: profile?.username ?? "",
  });

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setForm({
        displayName: profile.displayName ?? "",
        avatar: profile.avatar ?? "",
        bio: profile.bio ?? "",
        username: profile.username ?? "",
      });
    }
  }, [profile]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!profile) return <div className="p-8 text-center">Please log in</div>;

  const handleSave = async () => {
    await updateProfile(form);
    setEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-4 mb-8">
        <img
          src={profile.avatar}
          alt={profile.displayName}
          className="w-20 h-20 rounded-full"
        />
        <div>
          <h1 className="text-2xl font-bold">{profile.displayName}</h1>
          {profile.username && (
            <p className="text-gray-500">@{profile.username}</p>
          )}
        </div>
      </div>

      <div className="flex gap-4 border-b mb-4">
        {(["overview", "drafts", "favorites", "settings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 ${tab === t ? "border-b-2 border-blue-500" : ""}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "settings" && (
        <div className="space-y-4">
          <input
            placeholder="Display Name"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            className="border p-2 w-full"
          />
          <input
            placeholder="Avatar URL"
            value={form.avatar}
            onChange={(e) => setForm({ ...form, avatar: e.target.value })}
            className="border p-2 w-full"
          />
          <textarea
            placeholder="Bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="border p-2 w-full"
          />
          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="border p-2 w-full"
          />
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
jj add apps/web/src/routes/profile.tsx apps/web/src/routes/$username.tsx
jj commit -m "feat(web): add profile pages - public and private"
```

---

## Chunk 4: Frontend - Recipe Cards with Likes/Stars

### Task 10: Update Recipe Card Component

**Files:**

- Modify: `apps/web/src/features/recipes/components/RecipeCard.tsx`
- Modify: `apps/web/src/features/discover/components/DiscoverRecipeCard.tsx`

- [ ] **Step 1: Add like/star functionality**

```tsx
// Add to RecipeCard.tsx - add props for engagement and handlers:
interface RecipeCardProps {
  // ... existing props
  likesCount?: number;
  averageStars?: number | null;
  starsCount?: number;
  userHasLiked?: boolean;
  userStarRating?: number | null;
  onLike?: () => void;
  onStar?: (rating: number) => void;
}

// Add UI elements in the component:
<div className="flex items-center gap-2">
  <button
    onClick={onLike}
    className={userHasLiked ? "text-red-500" : "text-gray-400"}
  >
    {userHasLiked ? "❤️" : "🤍"} {likesCount}
  </button>
  <span>
    ⭐ {averageStars?.toFixed(1) ?? "-"} ({starsCount})
  </span>
</div>;
```

- [ ] **Step 2: Commit**

```bash
jj add apps/web/src/features/recipes/components/RecipeCard.tsx
jj commit -m "feat(web): add like/star display to RecipeCard"
```

---

### Task 11: Add Sorting to Discover Page

**Files:**

- Modify: `apps/web/src/routes/discover.tsx`
- Modify: `apps/web/src/features/discover/hooks/useDiscover.ts`

- [ ] **Step 1: Update hooks and page**

```typescript
// In useDiscover.ts - add sort parameter:
type DiscoverFilters = { search?: string; tags?: string[]; sort?: string };

// Add to params:
if (filters?.sort) params.set("sort", filters.sort);

// In discover.tsx - add sort selector:
<select onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
  <option value="recent">Recent</option>
  <option value="mostLiked">Most Liked</option>
  <option value="highestRated">Highest Rated</option>
</select>
```

- [ ] **Step 2: Commit**

```bash
jj add apps/web/src/routes/discover.tsx apps/web/src/features/discover/hooks/useDiscover.ts
jj commit -m "feat(web): add sorting to discover page"
```

---

## Chunk 5: Integration

### Task 12: Update Registration to Include Profile Fields

**Files:**

- Modify: `apps/api/src/features/auth/auth.service.ts`
- Modify: `apps/web/src/features/auth/hooks/useAuth.ts`

- [ ] **Step 1: Update service**

```typescript
// In auth.service.ts register method:
// Generate default displayName from email and a default avatar URL
const emailName = email.split("@")[0];
const defaultDisplayName =
  emailName.charAt(0).toUpperCase() + emailName.slice(1);
const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(defaultDisplayName)}`;

const user = await User.create({
  email,
  passwordHash,
  displayName: defaultDisplayName,
  avatar: defaultAvatar,
});
```

- [ ] **Step 2: Commit**

```bash
jj add apps/api/src/features/auth/auth.service.ts
jj commit -m "feat(api): add default profile fields on registration"
```

---

### Task 13: Final Integration Testing

- [ ] **Step 1: Run all tests**

```bash
cd apps/api && bun test
cd apps/web && bun run lint
```

- [ ] **Step 2: Manual testing**

- Register new user and verify profile created
- Update profile and verify changes
- Create recipe and publish it
- Visit public profile at /@username
- Like and star own recipe
- Check discover page sorting works

- [ ] **Step 3: Commit**

```bash
jj commit -m "feat: complete user profiles and recipe likes/stars feature"
```
