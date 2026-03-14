import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "dev-secret";

export function signToken(payload: { userId: string }): string {
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, secret) as { userId: string };
  return decoded;
}
