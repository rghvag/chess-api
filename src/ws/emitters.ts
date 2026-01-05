import { userSockets } from "./store";

export function emitGameStarted(white: string, black: string, gameId: string) {
  userSockets.get(white)?.send(
    JSON.stringify({
      color: "white",
      type: "GAME_STARTED",
      gameId,
    })
  );

  userSockets.get(black)?.send(
    JSON.stringify({
      type: "GAME_STARTED",
      color: "black",
      gameId,
    })
  );
}
