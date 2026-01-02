import { AuthedWebSocket } from "../types";
import { makeMove } from "./handlers/game";

export function handleWSMessage(ws: AuthedWebSocket, message: string) {
  const { type, payload } = JSON.parse(message);

  switch (type) {
    case "MAKE_MOVE":
      makeMove(ws, payload);
      break;

    case "RESIGN":
      // handleResign(ws, payload);
      break;
  }
}
