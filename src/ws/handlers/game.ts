import { Chess } from "chess.js";
import { Game } from "../../models/Game";
import { Move } from "../../models/Move";
import { AuthedWebSocket } from "../../types";
import { socketStore } from "../socketStore";

interface movePayload {
  from: string;
  to: string;
  game_id: string;
}
async function makeMove(ws: AuthedWebSocket, payload: movePayload) {
  const { from, to, game_id: gameId } = payload;

  if (!ws.userId) {
    return;
  }
  //play move in that game
  ///find game
  const game = await Game.findById(gameId);
  if (!game) {
    ws.send(JSON.stringify({ type: "ERROR", message: "Game not found" }));
    return;
  }
  const currGame = new Chess(game.fen);

  const isWhite = game.white.toString() === ws.userId;
  const isBlack = game.black.toString() === ws.userId;

  const expectedTurn = currGame.turn() === "w" ? "white" : "black";
  if (
    (expectedTurn === "white" && !isWhite) ||
    (expectedTurn === "black" && !isBlack)
  ) {
    ws.send(JSON.stringify({ type: "ERROR", message: "Not your turn" }));
    return;
  }
  const move = currGame.move({ from, to });

  if (!move) {
    ws.send(JSON.stringify({ type: "ERROR", message: "Illegal move" }));
    return;
  }

  //if game over
  if (currGame.isGameOver()) {
    if (currGame.isCheckmate()) {
      game.result = expectedTurn;
      game.result_reason = "checkmate";
    } else if (currGame.isStalemate()) {
      game.result = "draw";
      game.result_reason = "stalemate";
    } else if (currGame.isInsufficientMaterial()) {
      game.result = "draw";
      game.result_reason = "insufficient_material";
    } else if (currGame.isThreefoldRepetition()) {
      game.result = "draw";
      game.result_reason = "agreement";
    } else if (currGame.isDraw()) {
      game.result = "draw";
      game.result_reason = "agreement";
    }
    game.ended_at = new Date();

    //notify players

    ws.send(JSON.stringify({ type: "GAME_OVER", game }));
    // You might want to notify the other player as well
    // await emitGameOver(gameId);
    const opponentId = isWhite ? game.black.toString() : game.white.toString();
    socketStore
      .get(opponentId)
      ?.send(JSON.stringify({ type: "GAME_OVER", game }));
  }
  // Persist
  game.fen = currGame.fen();
  const san = move.san;
  // move
  const moveRaw = {
    game_id: gameId,
    move_number: currGame.history().length,
    notation: san,
    played_by_color: move.color,
    fen_after: game.fen,
    from: move.from,
    to: move.to,
  };
  //save move
  const moveDoc = new Move(moveRaw);
  await moveDoc.save();
  //save game
  await game.save();
  

  // Respond with updated game state
  // send to both player
  const payloadToSend = {
    type: "MOVE_MADE",
    move: moveRaw,
    fen: game.fen,
  };
  const opponentId = isWhite ? game.black.toString() : game.white.toString();
  socketStore.get(opponentId)?.send(JSON.stringify(payloadToSend));
  ws.send(JSON.stringify(payloadToSend));
}

export { makeMove };
