import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { User } from "./auth.model.js";
import type { AuthUser } from "../../lib/middleware/auth.middleware.js";

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required", code: "VALIDATION_ERROR" });
    return;
  }
  const result = await authService.register(email, password);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required", code: "VALIDATION_ERROR" });
    return;
  }
  const result = await authService.login(email, password);
  res.json(result);
}

export async function me(req: Request, res: Response): Promise<void> {
  const { userId } = (req as Request & { user: AuthUser }).user;
  const user = await User.findById(userId).select("email _id");
  if (!user) {
    res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
    return;
  }
  res.json({ id: user._id.toString(), email: user.email });
}
