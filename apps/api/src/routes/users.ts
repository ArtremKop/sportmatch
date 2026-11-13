import { Router } from "express";
import { z } from "zod";
import { prisma } from "db";
import { auth, AuthedRequest } from "../middleware/auth";
import { ApiError } from "../httpError";

const router = Router();

router.get("/me", auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as AuthedRequest).userId },
      include: { sports: { include: { sport: true } } },
    });
    if (!user) throw new ApiError(404, "User not found");
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        city: user.city,
        sports: user.sports.map((s) => ({
          sportId: s.sportId,
          name: s.sport.name,
          skill: s.skill,
        })),
      },
    });
  } catch (e) {
    next(e);
  }
});

const patchBody = z.object({
  name: z.string().min(1).max(80).optional(),
  city: z.string().max(80).nullable().optional(),
  sports: z
    .array(
      z.object({
        sportId: z.string(),
        skill: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).nullable().optional(),
      })
    )
    .optional(),
});

router.patch("/me", auth, async (req, res, next) => {
  try {
    const data = patchBody.parse(req.body);
    const userId = (req as AuthedRequest).userId;

    await prisma.$transaction(async (tx) => {
      if (data.name !== undefined || data.city !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.city !== undefined ? { city: data.city } : {}),
          },
        });
      }
      if (data.sports) {
        await tx.userSport.deleteMany({ where: { userId } });
        if (data.sports.length) {
          await tx.userSport.createMany({
            data: data.sports.map((s) => ({
              userId,
              sportId: s.sportId,
              skill: s.skill ?? null,
            })),
          });
        }
      }
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { sports: { include: { sport: true } } },
    });
    res.json({
      user: {
        id: user!.id,
        email: user!.email,
        name: user!.name,
        city: user!.city,
        sports: user!.sports.map((s) => ({
          sportId: s.sportId,
          name: s.sport.name,
          skill: s.skill,
        })),
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
