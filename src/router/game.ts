import { Router } from "express";
import { gameController } from "../controller";
import { isAuth } from "../middlewares";

const gameRouter = Router();

gameRouter.get("/:gameId", isAuth, gameController.game);

export { gameRouter };
