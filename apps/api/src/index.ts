import "./env";
import http from "http";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { ZodError } from "zod";
import { Server } from "socket.io";
import { prisma } from "db";
import { env } from "./env";
import { ApiError } from "./httpError";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import gameRoutes from "./routes/games";
import { setupSockets } from "./sockets";

const app = express();
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/sports", async (_req, res, next) => {
  try {
    const sports = await prisma.sport.findMany({ orderBy: { name: "asc" } });
    res.json({ sports });
  } catch (e) {
    next(e);
  }
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/games", gameRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: err.issues[0]?.message || "Invalid input" });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: env.clientOrigin },
});
setupSockets(io);
app.set("io", io);

server.listen(env.port, () => {
  console.log(`API on http://localhost:${env.port}`);
});
