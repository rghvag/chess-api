import { WebSocketServer, WebSocket } from "ws";
import GameService from "../services/gameService";
import { wsAuthMiddleware } from "./authMiddleware";

interface User {
  userId: string;
}
export function gameSocket(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket, req: any) => {
    wsAuthMiddleware(ws, req, (err: any) => {
      if (err) {
        console.log(err);
        ws.close(4001, "Unauthorized");
        return;
      }

      console.log("New connection connected, user:", (ws as any).user);

      ws.on("message", async (msg: string) => {
        try {
          const { event, data } = JSON.parse(msg.toString());
          const user = (ws as any).user as User;

          if (event === "joinQueue") {
            await GameService.addToQueue(
              { ...data, userId: user.userId },
              ws,
              wss
            );
          }

          if (event === "makeMove") {
            await GameService.makeMove(data.gameId, data.move, ws, wss);
          }
        } catch (err) {
          console.error("Invalid message:", err);
        }
      });

      ws.on("close", () => {
        console.log("Disconnected:", (ws as any).user.id);
      });
    });
  });
}
