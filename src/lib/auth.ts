import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET!;

export function signToken(payload: { adminId: string; email: string }) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "24h",
  });
}

export function verifyToken(token: string): { adminId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { adminId: string; email: string };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
