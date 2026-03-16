import { Router } from "express";
import { usersController } from "./users.controller.js";
import { authMiddleware } from "../../lib/middleware/auth.middleware.js";

export const usersRoutes = Router();

usersRoutes.get("/users/:username", usersController.getPublicProfile);
usersRoutes.get("/users/:username/recipes", usersController.getUserRecipes);
usersRoutes.get("/profile", authMiddleware, usersController.getProfile);
usersRoutes.put("/profile", authMiddleware, usersController.updateProfile);
usersRoutes.get("/profile/drafts", authMiddleware, usersController.getDrafts);
usersRoutes.get(
  "/profile/favorites",
  authMiddleware,
  usersController.getFavorites,
);
