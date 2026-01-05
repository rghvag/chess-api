import { WebSocketServer } from "ws";
import { AuthedWebSocket } from "../types";
import { authenticateWS } from "./middlewares/auth";
import { userSockets } from "./store";
import { routeMessage } from "./handlers";

export function initWSServer(server: any) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: AuthedWebSocket, req) => {
    try {
      authenticateWS(ws, req);
      userSockets.set(ws.user?.userId || "", ws);
    } catch {
      ws.close();
      return;
    }

    ws.isAlive = true;
    ws.on("pong", () => (ws.isAlive = true));

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await routeMessage(ws, message);
      } catch {
        ws.send(
          JSON.stringify({
            type: "ERROR",
            message: "Invalid message format",
          })
        );
      }
    });

    ws.on("close", () => {
      if (ws.user) userSockets.delete(ws.user.userId);
    });
  });

  setInterval(() => {
    wss.clients.forEach((ws: AuthedWebSocket) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
}
