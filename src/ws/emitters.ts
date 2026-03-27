import { publishDeliveries } from "../pubsub/gameRealtime";

export function emitGameStarted(white: string, black: string, gameId: string) {
  void publishDeliveries([
    {
      userId: white,
      payload: { color: "white", type: "GAME_STARTED", gameId },
    },
    {
      userId: black,
      payload: { type: "GAME_STARTED", color: "black", gameId },
    },
  ]);
}
