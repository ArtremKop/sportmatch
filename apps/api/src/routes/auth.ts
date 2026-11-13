import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "db";
import { ApiError } from "../httpError";
import { auth, AuthedRequest } from "../middleware/auth";
import { hashToken, makeRefreshToken, REFRESH_MS, signAccess } from "../lib/tokens";

const router = Router();

const registerBody = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(80),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string(),
});

async function issueTokens(userId: string) {
  const refresh = makeRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refresh),
      expiresAt: new Date(Date.now() + REFRESH_MS),
    },
  });
  return { accessToken: signAccess(userId), refreshToken: refresh };
}

function publicUser(u: { id: string; email: string; name: string; city: string | null }) {
  return { id: u.id, email: u.email, name: u.name, city: u.city };
}

router.post("/register", async (req, res, next) => {
  try {
    const data = registerBody.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (exists) throw new ApiError(409, "Email already registered");

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: await bcrypt.hash(data.password, 10),
        name: data.name,
      },
    });
    const tokens = await issueTokens(user.id);
    res.status(201).json({ user: publicUser(user), ...tokens });
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginBody.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user) throw new ApiError(401, "Wrong email or password");
    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) throw new ApiError(401, "Wrong email or password");
    const tokens = await issueTokens(user.id);
    res.json({ user: publicUser(user), ...tokens });
  } catch (e) {
    next(e);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const token = z.string().min(10).parse(req.body.refreshToken);
    const tokenHash = hashToken(token);
    const row = await prisma.refreshToken.findFirst({ where: { tokenHash } });
    if (!row || row.expiresAt < new Date()) {
      throw new ApiError(401, "Need to log in again");
    }
    await prisma.refreshToken.delete({ where: { id: row.id } });
    const tokens = await issueTokens(row.userId);
    res.json(tokens);
  } catch (e) {
    next(e);
  }
});

router.post("/logout", auth, async (req, res, next) => {
  try {
    const token = req.body.refreshToken as string | undefined;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { tokenHash: hashToken(token) } });
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.get("/me", auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as AuthedRequest).userId },
    });
    if (!user) throw new ApiError(401, "Not logged in");
    res.json({ user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

export default router;
