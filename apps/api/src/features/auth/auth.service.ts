import bcrypt from "bcrypt";
import { User } from "./auth.model.js";
import { AppError } from "../../lib/errors.js";
import { signToken } from "../../lib/jwt.js";

export const authService = {
  async register(email: string, password: string): Promise<{ token: string; user: { id: string; email: string } }> {
    const existing = await User.findOne({ email });
    if (existing) throw new AppError("Email already registered", 409, "AUTH_EMAIL_TAKEN");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });
    const token = signToken({ userId: user._id.toString() });
    return { token, user: { id: user._id.toString(), email: user.email } };
  },

  async login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string } }> {
    const user = await User.findOne({ email });
    if (!user) throw new AppError("Invalid credentials", 401, "AUTH_INVALID_CREDENTIALS");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new AppError("Invalid credentials", 401, "AUTH_INVALID_CREDENTIALS");
    const token = signToken({ userId: user._id.toString() });
    return { token, user: { id: user._id.toString(), email: user.email } };
  },
};
