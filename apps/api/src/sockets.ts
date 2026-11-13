import { Server } from "socket.io";
import { prisma } from "db";
import { verifyAccess } from "./lib/tokens";

export function setupSockets(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Not logged in"));
    try {
      socket.data.userId = verifyAccess(token);
      next();
    } catch {
      next(new Error("Session expired"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;

    socket.on("joinGameRoom", async (gameId: string) => {
      const game = await prisma.game.findUnique({ where: { id: gameId } });
      if (!game) return;
      socket.join(`game:${gameId}`);

      const count = await prisma.gameParticipant.count({ where: { gameId } });
      socket.emit("participants", {
        gameId,
        count,
        maxParticipants: game.maxParticipants,
      });
    });

    socket.on("leaveGameRoom", (gameId: string) => {
      socket.leave(`game:${gameId}`);
    });

    socket.on("chat:send", async (payload: { gameId: string; text: string }) => {
      const text = (payload?.text || "").trim();
      if (!payload?.gameId || !text || text.length > 500) return;

      const inGame = await prisma.gameParticipant.findUnique({
        where: { gameId_userId: { gameId: payload.gameId, userId } },
      });
      if (!inGame) {
        socket.emit("errorMsg", "Only players in this game can chat");
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      const msg = await prisma.chatMessage.create({
        data: { gameId: payload.gameId, userId, text },
      });

      io.to(`game:${payload.gameId}`).emit("chat:message", {
        id: msg.id,
        text: msg.text,
        createdAt: msg.createdAt,
        userId,
        userName: user?.name ?? "Player",
        gameId: payload.gameId,
      });
    });
  });
}
