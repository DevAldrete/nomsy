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
    const user = requireAuth(req);
    const { page = "1", limit = "20" } = req.query;
    const result = await usersService.getFavorites(
      user.userId,
      parseInt(page as string),
      parseInt(limit as string),
    );
    res.json(result);
  },
};
