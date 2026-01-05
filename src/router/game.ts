import { Router } from "express";
import { gameController } from "../controller";
import { isAuth } from "../middlewares";

const gameRouter: Router = require("express").Router();

gameRouter.get("/:gameId", isAuth, gameController.game);

export { gameRouter };
