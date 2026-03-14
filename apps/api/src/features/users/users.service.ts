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

    const query: Record<string, unknown> = {
      createdBy: user._id,
      publishedAt: { $ne: null },
    };
    if (tag) query.tags = tag;

    let sortOption: Record<string, 1 | -1> = { publishedAt: -1 };
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

    const user = await User.findByIdAndUpdate(userId, data, {
  returnDocument: "after",
});
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
