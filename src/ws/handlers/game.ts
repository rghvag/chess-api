import { GameService } from "../../services/game";
import { AuthedWebSocket, WSMessage } from "../../types";

export async function gameHandler(ws: AuthedWebSocket, message: WSMessage) {
  switch (message.type) {
    case "MAKE_MOVE":
      await GameService.makeMove(ws, message.payload);
      break;

    case "RESIGN":
      await GameService.resign(ws, message.payload);
      break;

    default:
      ws.send(
        JSON.stringify({
          type: "ERROR",
          message: "Unknown event",
        })
      );
  }
}
