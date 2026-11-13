import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../env";

export function signAccess(userId: string) {
  return jwt.sign({ sub: userId }, env.accessSecret, { expiresIn: "15m" });
}

export function verifyAccess(token: string) {
  const payload = jwt.verify(token, env.accessSecret) as { sub: string };
  return payload.sub;
}

export function makeRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;
