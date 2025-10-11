import { WebSocketServer, WebSocket } from "ws";
import { redis } from "../config/redis";
import { Game } from "../models/Game";
import { Chess } from "chess.js";

class GameService {
  async addToQueue(playerId: string, ws: WebSocket, wss: WebSocketServer) {
    const queueKey = "gameQueue";

    await redis.rPush(queueKey, playerId);
    const players = await redis.lLen(queueKey);

    if (players >= 2) {
      const popped = await redis.lPopCount(queueKey, 2);
      if (!popped || popped.length < 2) return;
      const [white, black] = popped;

      const game = await Game.create({
        white,
        black,
        fen: new Chess().fen(),
        moves: [],
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
