import { socketStore } from "./socketStore";

export function emitGameStarted(white: string, black: string, gameId: string) {
  socketStore.get(white)?.send(
    JSON.stringify({
      color: "white",
      type: "GAME_STARTED",
      gameId,
    })
  );

  socketStore.get(black)?.send(
    JSON.stringify({
      type: "GAME_STARTED",
      color: "black",
      gameId,
    })
  );
}
