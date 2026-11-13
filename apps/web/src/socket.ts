import { io, Socket } from "socket.io-client";
import { apiUrl } from "./api";

let socket: Socket | null = null;

export function getSocket() {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  if (!socket) {
    socket = io(apiUrl(), {
      auth: { token },
      autoConnect: true,
    });
  } else if (socket.auth && (socket.auth as { token?: string }).token !== token) {
    socket.auth = { token };
    socket.connect();
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
