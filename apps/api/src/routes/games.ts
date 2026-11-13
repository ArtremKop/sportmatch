import { Router } from "express";
import { z } from "zod";
import { prisma } from "db";
import { auth, AuthedRequest } from "../middleware/auth";
import { ApiError } from "../httpError";
import { joinGame, leaveGame } from "../lib/joinGame";
import { searchGames } from "../lib/searchGames";
import type { Server } from "socket.io";

const router = Router();

function emitCount(req: { app: { get: (k: string) => Server } }, gameId: string, count: number, max: number) {
  const io = req.app.get("io");
  if (io) io.to(`game:${gameId}`).emit("participants", { gameId, count, maxParticipants: max });
}

const gameInclude = {
  sport: true,
  organizer: { select: { id: true, name: true } },
  participants: {
    include: { user: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" as const },
  },
};

function shapeGame(g: {
  id: string;
  type: string;
  status: string;
  sportId: string;
  startsAt: Date;
  locationName: string;
  latitude: number;
  longitude: number;
  maxParticipants: number;
  skillPref: string | null;
  notes: string | null;
  organizerId: string;
  sport: { id: string; name: string };
  organizer: { id: string; name: string };
  participants: Array<{ user: { id: string; name: string } }>;
}) {
  return {
    id: g.id,
    type: g.type,
    status: g.status,
    sportId: g.sportId,
    sportName: g.sport.name,
    startsAt: g.startsAt,
    locationName: g.locationName,
    latitude: g.latitude,
    longitude: g.longitude,
    maxParticipants: g.maxParticipants,
    skillPref: g.skillPref,
    notes: g.notes,
    organizerId: g.organizerId,
    organizerName: g.organizer.name,
    participantCount: g.participants.length,
    participants: g.participants.map((p) => p.user),
  };
}

router.get("/", auth, async (req, res, next) => {
  try {
    const sportId = typeof req.query.sportId === "string" ? req.query.sportId : undefined;
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const lat = req.query.lat != null ? Number(req.query.lat) : undefined;
    const lng = req.query.lng != null ? Number(req.query.lng) : undefined;
    const radiusKm = req.query.radiusKm != null ? Number(req.query.radiusKm) : undefined;
    const onlyOpen = req.query.onlyOpen === "false" ? false : true;

    const games = await searchGames({ sportId, from, to, lat, lng, radiusKm, onlyOpen });
    res.json({ games });
  } catch (e) {
    next(e);
  }
});

router.get("/mine", auth, async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const games = await prisma.game.findMany({
      where: {
        OR: [{ organizerId: userId }, { participants: { some: { userId } } }],
      },
      include: gameInclude,
      orderBy: { startsAt: "desc" },
    });
    res.json({ games: games.map(shapeGame) });
  } catch (e) {
    next(e);
  }
});

router.get("/:id/messages", auth, async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const gameId = req.params.id;
    const inGame = await prisma.gameParticipant.findUnique({
      where: { gameId_userId: { gameId, userId } },
    });
    if (!inGame) throw new ApiError(403, "Only players in this game can see the chat");

    const messages = await prisma.chatMessage.findMany({
      where: { gameId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    res.json({
      messages: messages.map((m) => ({
        id: m.id,
        text: m.text,
        createdAt: m.createdAt,
        userId: m.userId,
        userName: m.user.name,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", auth, async (req, res, next) => {
  try {
    const game = await prisma.game.findUnique({
      where: { id: req.params.id },
      include: gameInclude,
    });
    if (!game) throw new ApiError(404, "Game not found");
    res.json({ game: shapeGame(game) });
  } catch (e) {
    next(e);
  }
});

const createBody = z.object({
  type: z.enum(["ONE_ON_ONE", "TEAM"]),
  sportId: z.string(),
  startsAt: z.string(),
  locationName: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  maxParticipants: z.number().int().min(2).max(50).optional(),
  skillPref: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).nullable().optional(),
  notes: z.string().max(500).optional(),
});

router.post("/", auth, async (req, res, next) => {
  try {
    const data = createBody.parse(req.body);
    const startsAt = new Date(data.startsAt);
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      throw new ApiError(400, "Start time must be in the future");
    }

    const maxParticipants = data.type === "ONE_ON_ONE" ? 2 : data.maxParticipants ?? 10;
    if (data.type === "TEAM" && maxParticipants < 3) {
      throw new ApiError(400, "Team games need at least 3 spots");
    }

    const sport = await prisma.sport.findUnique({ where: { id: data.sportId } });
    if (!sport) throw new ApiError(400, "Unknown sport");

    const userId = (req as AuthedRequest).userId;
    const game = await prisma.game.create({
      data: {
        type: data.type,
        sportId: data.sportId,
        startsAt,
        locationName: data.locationName,
        latitude: data.latitude,
        longitude: data.longitude,
        maxParticipants,
        skillPref: data.skillPref ?? null,
        notes: data.notes,
        organizerId: userId,
        participants: { create: { userId } },
      },
      include: gameInclude,
    });
    res.status(201).json({ game: shapeGame(game) });
  } catch (e) {
    next(e);
  }
});

const patchBody = createBody.partial().omit({ type: true });

router.patch("/:id", auth, async (req, res, next) => {
  try {
    const data = patchBody.parse(req.body);
    const userId = (req as AuthedRequest).userId;
    const game = await prisma.game.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { participants: true } } },
    });
    if (!game) throw new ApiError(404, "Game not found");
    if (game.organizerId !== userId) throw new ApiError(403, "Only the organizer can edit");
    if (game.status !== "OPEN" || game.startsAt.getTime() <= Date.now()) {
      throw new ApiError(400, "Can't edit after the game started or was cancelled");
    }

    const startsAt = data.startsAt ? new Date(data.startsAt) : undefined;
    if (startsAt && startsAt.getTime() <= Date.now()) {
      throw new ApiError(400, "Start time must be in the future");
    }

    if (data.maxParticipants != null && data.maxParticipants < game._count.participants) {
      throw new ApiError(400, "Can't set max below current players");
    }
    if (game.type === "ONE_ON_ONE" && data.maxParticipants != null && data.maxParticipants !== 2) {
      throw new ApiError(400, "1-on-1 games always have 2 spots");
    }

    const updated = await prisma.game.update({
      where: { id: game.id },
      data: {
        ...(data.sportId ? { sportId: data.sportId } : {}),
        ...(startsAt ? { startsAt } : {}),
        ...(data.locationName ? { locationName: data.locationName } : {}),
        ...(data.latitude != null ? { latitude: data.latitude } : {}),
        ...(data.longitude != null ? { longitude: data.longitude } : {}),
        ...(data.maxParticipants != null && game.type === "TEAM"
          ? { maxParticipants: data.maxParticipants }
          : {}),
        ...(data.skillPref !== undefined ? { skillPref: data.skillPref } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
      include: gameInclude,
    });
    res.json({ game: shapeGame(updated) });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", auth, async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const game = await prisma.game.findUnique({ where: { id: req.params.id } });
    if (!game) throw new ApiError(404, "Game not found");
    if (game.organizerId !== userId) throw new ApiError(403, "Only the organizer can cancel");
    if (game.status !== "OPEN" || game.startsAt.getTime() <= Date.now()) {
      throw new ApiError(400, "Can't cancel this game");
    }

    const updated = await prisma.game.update({
      where: { id: game.id },
      data: { status: "CANCELLED" },
      include: gameInclude,
    });

    const io = req.app.get("io") as Server | undefined;
    io?.to(`game:${game.id}`).emit("gameCancelled", { gameId: game.id });

    res.json({ game: shapeGame(updated) });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/join", auth, async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const result = await joinGame(req.params.id, userId);
    emitCount(req, req.params.id, result.count, result.maxParticipants);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id/leave", auth, async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const result = await leaveGame(req.params.id, userId);
    emitCount(req, req.params.id, result.count, result.maxParticipants);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
