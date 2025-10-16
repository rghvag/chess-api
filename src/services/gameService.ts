import { WebSocketServer, WebSocket } from "ws";
import { redis } from "../config/redis";
import { Game } from "../models/Game";
import { Chess } from "chess.js";

class GameService {
  async addToQueue(
    { userId }: { userId: string },
    ws: WebSocket,
    wss: WebSocketServer
  ) {
    const queueKey = "gameQueue";
    console.log("gamequeue");
    console.log("userid", userId);

    const queue = await redis.lRange(queueKey, 0, -1);
    if (queue.includes(userId)) {
      console.log("User already in queue");
      return;
    }

    await redis.rPush(queueKey, userId);
    const players = await redis.lLen(queueKey);
    console.log(players);
    if (players >= 2) {
      const popped = await redis.lPopCount(queueKey, 2);
      if (!popped || popped.length < 2) return;
      const [white, black] = popped;
      console.log("white", white);
      console.log("black", black);

      const game = await Game.create({
        white,
        black,
        fen: new Chess().fen(),
        moves: [],
      });

      console.log({
        event: "gameStart",
        data: { gameId: game._id, white, black, fen: game.fen },
      });
      this.broadcast(wss, {
        event: "gameStart",
        data: { gameId: game._id, white, black, fen: game.fen },
      });
    }
  }

  async makeMove(
    gameId: string,
    move: string,
    ws: WebSocket,
    wss: WebSocketServer
  ) {
    const game = await Game.findById(gameId);
    if (!game) return;

    const chess = new Chess(game.fen);
    const result = chess.move(move);
    if (!result) return;

    game.fen = chess.fen();
    game.moves.push(move);
    await game.save();

    this.broadcast(wss, {
      event: "moveMade",
      data: { gameId, move, fen: game.fen },
    });
  }

  private broadcast(wss: WebSocketServer, msg: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(msg));
      }
    });
  }
}

export default new GameService();
