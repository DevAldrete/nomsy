import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authRoutes } from "./features/auth/auth.routes.js";
import { usersRoutes } from "./features/users/users.routes.js";
import { recipesRoutes } from "./features/recipes/recipes.routes.js";
import { calendarRoutes } from "./features/calendar/calendar.routes.js";
import { favoritesRoutes } from "./features/favorites/favorites.routes.js";
import { likesRoutes } from "./features/likes/likes.routes.js";
import { starsRoutes } from "./features/stars/stars.routes.js";
import { errorMiddleware } from "./lib/middleware/error.middleware.js";

const app = express();

const isProduction = process.env.NODE_ENV === "production";

app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        }
      : false,
    hsts: isProduction
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? 100 : 1000,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) =>
    req.path === "/health" ||
    req.path === "/api/auth/me" ||
    req.path === "/api/auth/login" ||
    req.path === "/api/auth/register",
});
app.use("/api", limiter);

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", usersRoutes);
app.use("/api", likesRoutes);
app.use("/api", starsRoutes);
app.use("/api/recipes", recipesRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/favorites", favoritesRoutes);

app.use(errorMiddleware);

export default app;
