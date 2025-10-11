import { WebSocketServer, WebSocket } from "ws";
import GameService from "../services/gameService";

export function gameSocket(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket) => {
    console.log("New connection connected");

    ws.on("message", async (msg: string) => {
      try {
        const { event, data } = JSON.parse(msg.toString());

        if (event === "joinQueue") {
          await GameService.addToQueue(data, ws, wss);
        }

        if (event === "makeMove") {
          //gameId, move
          await GameService.makeMove(data.gameId, data.move, ws, wss);
        }
      } catch (err) {
        console.error("Invalid message:", err);
      }
    });

    ws.on("close", () => {
      console.log("Disconnected.");
    });
  });
}
