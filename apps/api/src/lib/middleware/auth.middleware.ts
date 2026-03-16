import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../jwt.js";
import { AppError } from "../errors.js";

export type AuthUser = { userId: string };

export function requireAuth(req: Request): AuthUser {
  const user = (req as Request & { user?: AuthUser }).user;
  if (!user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  return user;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = verifyToken(token);
    (req as Request & { user: AuthUser }).user = { userId: decoded.userId };
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401, "UNAUTHORIZED"));
  }
}

/** Sets req.user when valid Bearer token present; does not 401 when missing or invalid. */
export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }
  const token = authHeader.slice(7);
  try {
    const decoded = verifyToken(token);
    (req as Request & { user?: AuthUser }).user = { userId: decoded.userId };
  } catch {
    // leave req.user undefined
  }
  next();
}
