import { io } from "socket.io-client";
import { getToken } from "./client.js";

let socket = null;

export function getSocket() {
  const token = getToken();
  if (!token) return null;

  if (!socket) {
    socket = io({ auth: { token }, autoConnect: false });
  }
  if (socket.auth.token !== token) {
    socket.auth.token = token;
    if (socket.connected) socket.disconnect();
  }
  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
