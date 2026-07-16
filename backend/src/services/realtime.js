import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let io;

// Rooms are keyed by user id — every device/tab a user has open joins the
// same room, so emitToUser reaches all of them without tracking sockets by hand.
export function initRealtime(httpServer) {
  io = new Server(httpServer, { cors: { origin: process.env.CORS_ORIGIN || "*" } });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentification requise"));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user) return next(new Error("Utilisateur introuvable"));
      socket.userId = user._id.toString();
      next();
    } catch {
      next(new Error("Session invalide ou expirée"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.userId}`);
  });

  return io;
}

export function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${userId.toString()}`).emit(event, payload);
}
