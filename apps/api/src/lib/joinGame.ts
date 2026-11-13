import { prisma } from "db";
import { ApiError } from "../httpError";

export async function joinGame(gameId: string, userId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<
        Array<{
          id: string;
          maxParticipants: number;
          status: string;
          startsAt: Date;
        }>
      >`
        SELECT id, "maxParticipants", status, "startsAt"
        FROM "Game"
        WHERE id = ${gameId}
        FOR UPDATE
      `;

      const game = rows[0];
      if (!game) throw new ApiError(404, "Game not found");
      if (game.status !== "OPEN") throw new ApiError(400, "This game is not open");
      if (new Date(game.startsAt).getTime() <= Date.now()) {
        throw new ApiError(400, "Game already started");
      }

      const already = await tx.gameParticipant.findUnique({
        where: { gameId_userId: { gameId, userId } },
      });
      if (already) throw new ApiError(409, "You already joined this game");

      const count = await tx.gameParticipant.count({ where: { gameId } });
      if (count >= game.maxParticipants) {
        throw new ApiError(409, "Game is full");
      }

      await tx.gameParticipant.create({
        data: { gameId, userId },
      });

      return { count: count + 1, maxParticipants: game.maxParticipants };
    });
  } catch (e: unknown) {
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
      throw new ApiError(409, "You already joined this game");
    }
    throw e;
  }
}

export async function leaveGame(gameId: string, userId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) throw new ApiError(404, "Game not found");
  if (game.organizerId === userId) {
    throw new ApiError(400, "Organizer can't leave — cancel the game instead");
  }
  if (game.status !== "OPEN" || game.startsAt.getTime() <= Date.now()) {
    throw new ApiError(400, "Can't leave this game anymore");
  }

  const deleted = await prisma.gameParticipant.deleteMany({
    where: { gameId, userId },
  });
  if (deleted.count === 0) throw new ApiError(400, "You are not in this game");

  const count = await prisma.gameParticipant.count({ where: { gameId } });
  return { count, maxParticipants: game.maxParticipants };
}
