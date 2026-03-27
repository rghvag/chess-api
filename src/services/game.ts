import { Game } from "../models/Game";
import { User } from "../models/User";
import { AuthedWebSocket, MovePayload, ResignPayload } from "../types";
import { Chess } from "chess.js";
import { Move } from "../models/Move";
import mongoose from "mongoose";
import { publishDeliveries } from "../pubsub/gameRealtime";

async function getGameById(userId: string, gameId: string) {
  try {
    if (!mongoose.isValidObjectId(gameId)) {
      return { error: "Invalid game id" };
    }
    const gameDoc = await Game.findById(gameId);
    if (!gameDoc) {
      return { error: "Game not found" };
    }
    const game = gameDoc.toJSON();

    const { white, black } = game;
    const opponentColor =
      white.toString() === userId
        ? "black"
        : black.toString() === userId
        ? "white"
        : "null";
    if (opponentColor === "null") {
      return { error: "User not part of this game" };
    }
    //get opponent info
    const opponent = await User.findById(game[opponentColor]);

    return {
      data: {
        ...game,
        // white: undefined,
        // black: undefined,
        color: opponentColor === "white" ? "black" : "white",
        [opponentColor]: undefined,
        opponent: {
          userId: opponent?._id,
          username: opponent?.username,
          rating: opponent?.rating,
          country: opponent?.country,
          color: opponentColor,
        },
      },
    };
  } catch (e) {
    console.log("Error fetching game:", e);
    return {
      error: "Error fetching game",
      message: e instanceof Error ? e.message : JSON.stringify(e),
    };
  }
}

async function makeMove(ws: AuthedWebSocket, payload: MovePayload) {
  try {
    if (!ws.user?.userId) return;
    const { from, to, game_id: gameId, promotion } = payload;

    if (!mongoose.isValidObjectId(gameId)) {
      ws.send(JSON.stringify({ type: "ERROR", message: "Invalid game id" }));
      return;
    }

    const game = await Game.findById(gameId);
    if (!game) {
      ws.send(JSON.stringify({ type: "ERROR", message: "Game not found" }));
      return;
    }

    if (game.ended_at) {
      ws.send(JSON.stringify({ type: "ERROR", message: "Game is already over" }));
      return;
    }

    //Load chess state
    const chess = new Chess(game.fen);

    //validate turn
    const isWhite = game.white.toString() === ws.user?.userId;
    const isBlack = game.black.toString() === ws.user?.userId;
    const expectedTurn = chess.turn() === "w" ? "white" : "black";
    if (
      (expectedTurn === "white" && !isWhite) ||
      (expectedTurn === "black" && !isBlack)
    ) {
      ws.send(JSON.stringify({ type: "ERROR", message: "Not your turn" }));
      return;
    }

    // Validate move
    const move = chess.move({ from, to, promotion });
    if (!move) {
      ws.send(JSON.stringify({ type: "ERROR", message: "Illegal move" }));
      return;
    }

    // handle clock timings
    const now = Date.now();
    const lastMoveAt = game.clock?.lastMoveAt?.getTime() ?? now;
    const elapsed = now - lastMoveAt;

    const gameClock = game.clock;
    if (!gameClock) {
      ws.send(
        JSON.stringify({ type: "ERROR", message: "Clock not initialized" })
      );
      return;
    }
    if (move.color === "w") {
      gameClock.whiteTimeMs = Math.max(0, gameClock.whiteTimeMs - elapsed);
    } else {
      gameClock.blackTimeMs = Math.max(0, gameClock.blackTimeMs - elapsed);
    }

    gameClock.lastMoveAt = new Date();
    game.fen = chess.fen();

    const moveDoc = new Move({
      game_id: new mongoose.Types.ObjectId(gameId),
      move_number: chess.history().length,
      notation: move.san,
      played_by_color: move.color == "w" ? "white" : "black",
      fen_after: game.fen,
      piece: move.piece,
      from: move.from,
      to: move.to,
    });

    await moveDoc.save();

    // Game over detection
    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        game.result = move.color === "w" ? "white" : "black";
        game.result_reason = "checkmate";
      } else if (chess.isStalemate()) {
        game.result = "draw";
        game.result_reason = "stalemate";
      } else if (chess.isInsufficientMaterial()) {
        game.result = "draw";
        game.result_reason = "insufficient_material";
      } else {
        game.result = "draw";
        game.result_reason = "agreement";
      }
      game.ended_at = new Date();
    }
    await game.save();

    const message = {
      type: chess.isGameOver() ? "GAME_OVER" : "MOVE_MADE",
      move: moveDoc.toJSON(),
      fen: game.fen,
      turn: chess.turn() === "w" ? "white" : "black",
      clock: {
        whiteTimeMs: gameClock.whiteTimeMs,
        blackTimeMs: gameClock.blackTimeMs,
      },
    };

    const whiteId = game.white.toString();
    const blackId = game.black.toString();
    void publishDeliveries([
      { userId: whiteId, payload: message },
      { userId: blackId, payload: message },
    ]);
  } catch (err) {
    console.error("Error in makeMove:", err);
    ws.send(
      JSON.stringify({ type: "ERROR", message: "Internal server error" })
    );
  }
}

async function resign(ws: AuthedWebSocket, payload: ResignPayload) {
  //fetch if game exists and user is part of it
  if (!ws.user?.userId) return;
  const { game_id: gameId } = payload;

  if (!mongoose.isValidObjectId(gameId)) {
    ws.send(JSON.stringify({ type: "ERROR", message: "Invalid game id" }));
    return null;
  }

  const game = await Game.findById(gameId);
  if (!game) {
    ws.send(JSON.stringify({ type: "ERROR", message: "Game not found" }));
    return null;
  }

  const resignedBy = await (async () => {
    if (game.white.toString() === ws.user?.userId) return "white";
    if (game.black.toString() === ws.user?.userId) return "black";
    ws.send(
      JSON.stringify({ type: "ERROR", message: "User not part of game" })
    );
    return null;
  })();
  if (!resignedBy) return;

  if (game.ended_at) {
    //send error:game is over
    ws.send(JSON.stringify({ type: "ERROR", message: "Game is already over" }));
    return;
  }

  //update game result and reason
  game.result = resignedBy === "white" ? "black" : "white";
  game.result_reason = "resignation";
  game.ended_at = new Date();

  await game.save();

  const message = {
    type: "GAME_OVER",
    result: game.result,
    result_reason: game.result_reason,
  };
  const whiteId = game.white.toString();
  const blackId = game.black.toString();
  void publishDeliveries([
    { userId: whiteId, payload: message },
    { userId: blackId, payload: message },
  ]);
}

export const GameService = { getGameById, makeMove, resign };
