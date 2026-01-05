import { AuthedWebSocket, WSMessage } from "../../types";
import { gameHandler } from "./game";


export async function routeMessage(ws: AuthedWebSocket, message: WSMessage) {
  await gameHandler(ws, message);
}
