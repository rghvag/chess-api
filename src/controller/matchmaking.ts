import { redis } from "../config/redis";
import { makeMatch } from "../services/matchmaking";

export const joinGame = async (req: any, res: any) => {
  const { userId } = req.user;
  const queueKey = process.env.MATCHMAKING_QUEUE_KEY || "";
  if (!queueKey) {
    return res
      .status(500)
      .json({ error: "Matchmaking queue key not set in env variables" });
  }
  //TODO:check if already in a game
  //add to queue
  const queue = await redis.lRange(queueKey, 0, -1);
  if (queue.includes(userId)) {
    console.log("User already in queue");
    return res
      .status(400)
      .json({ error: "User already in queue", message: "Try again later." });
  }

  await redis.rPush(queueKey, userId);
  console.log(`User ${userId} added to matchmaking queue`);

  makeMatch();
  return res.status(200).json({ message: "Joined matchmaking queue." });
};

module.exports = { joinGame };
