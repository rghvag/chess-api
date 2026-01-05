import { Game } from "../models/Game";
import { User } from "../models/User";
import { AuthedWebSocket, MovePayload, ResignPayload } from "../types";
import { Chess } from "chess.js";
import { Move } from "../models/Move";
import { userSockets } from "../ws/store";
import mongoose from "mongoose";

async function getGameById(userId: string, gameId: string) {
  try {
    //get game
    const gameDoc = await Game.findById(new mongoose.Types.ObjectId(gameId));
    if (!gameDoc) {
      return { error: "Game not found" };
    }
    const game = gameDoc.toJSON();
    console.log(game);

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

    const game = await Game.findById(gameId);
    if (!game) {
      ws.send(JSON.stringify({ type: "ERROR", message: "Game not found" }));
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
    console.log("Move made", move);

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
      gameClock.whiteTimeMs -= elapsed;
    } else {
      gameClock.blackTimeMs -= elapsed;
    }

    gameClock.lastMoveAt = new Date();
    game.fen = chess.fen();

    const moveDoc = new Move({
      game_id: gameId,
      move_number: chess.history().length,
      notation: move.san,
      played_by_color: move.color == "w" ? "white" : "black",
      fen_after: game.fen,
      peice: move.piece,
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
    console.log("updated game state", game);
    await game.save();

    // Broadcast
    const opponentId = isWhite ? game.black.toString() : game.white.toString();

    const message = {
      type: chess.isGameOver() ? "GAME_OVER" : "MOVE_MADE",
      move: moveDoc,
      fen: game.fen,
      turn: chess.turn() === "w" ? "white" : "black",
      clock: {
        whiteTimeMs: gameClock.whiteTimeMs,
        blackTimeMs: gameClock.blackTimeMs,
      },
    };

    userSockets.get(opponentId)?.send(JSON.stringify(message));
    ws.send(JSON.stringify(message));
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

  //broadcast to opponent
  const opponent = resignedBy === "white" ? game.black : game.white;
  const message = {
    type: "GAME_OVER",
    result: game.result,
    result_reason: game.result_reason,
  };
  userSockets.get(opponent.toString())?.send(JSON.stringify(message));
  ws.send(JSON.stringify(message));
}

export const GameService = { getGameById, makeMove, resign };
