import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { socketStore } from "./socketStore";
import { AuthedWebSocket, AuthUser } from "../types";
import { handleWSMessage } from "./router";

export function initWS(wss: WebSocketServer) {
  wss.on("connection", (ws: AuthedWebSocket, req) => {
    if (!req.url) {
      ws.close(4001, "Unauthorized");
      return;
    }

    const token = new URL(req.url, "http://localhost:3000").searchParams.get(
      "token"
    );

    if (!token) {
      ws.close(4001, "Token missing");
      return;
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as AuthUser;

      const existing = socketStore.get(decoded.userId);
      if (existing) {
        existing.close(4000, "New connection opened");
      }

      ws.userId = decoded.userId;
      socketStore.set(decoded.userId, ws);

      console.log("Authenticated WS user:", decoded.userId);

      ws.on("message", (data) => {
        handleWSMessage(ws, data.toString());
      });

      ws.on("close", () => {
        socketStore.delete(decoded.userId);
        console.log("Disconnected WS user:", decoded.userId);
      });
    } catch {
      ws.close(4001, "Invalid token");
    }
  });
}
