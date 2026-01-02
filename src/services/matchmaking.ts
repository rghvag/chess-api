import { redis } from "../config/redis";
import { Game } from "../models/Game";
import { emitGameStarted } from "../ws/emitters";

export const makeMatch = async () => {
  const queueKey = process.env.MATCHMAKING_QUEUE_KEY || "";

  const players = await redis.lLen(queueKey);
  if (players >= 2) {
    const popped = await redis.lPopCount(queueKey, 2);

    if (!popped || popped.length < 2) return;
    const white = popped[0];
    const black = popped[1];
    console.log("Matched players:", { white, black });

    //create a game
    const game = await Game.create({
      white,
      black,
      time_control: "5+0",//for now
      started_at: new Date(),
    });

    const gameId = game._id.toString();
    console.log("Created game:", gameId);

    //emit event to both players
    emitGameStarted(white, black, gameId);
  }
};
