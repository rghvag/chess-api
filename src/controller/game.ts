import { Request, Response } from "express";
import { GameService } from "../services/game";

async function game(req: Request, res: Response): Promise<any> {
  const { gameId } = req.params;

  const {
    data: gameData,
    error,
    message,
  } = await GameService.getGameById(req.user?.userId || "", gameId);
  console.log(gameData);
  if (error) {
    return res.status(400).json({ error, message });
  }
  return res.status(200).json({ game: gameData });
}

export { game };
