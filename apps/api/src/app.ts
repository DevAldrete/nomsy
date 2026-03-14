import express from "express";
import cors from "cors";
import { authRoutes } from "./features/auth/auth.routes.js";
import { recipesRoutes } from "./features/recipes/recipes.routes.js";
import { calendarRoutes } from "./features/calendar/calendar.routes.js";
import { favoritesRoutes } from "./features/favorites/favorites.routes.js";
import { errorMiddleware } from "./lib/middleware/error.middleware.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipesRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/favorites", favoritesRoutes);

app.use(errorMiddleware);

export default app;
