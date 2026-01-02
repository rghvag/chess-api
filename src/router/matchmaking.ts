import express, { Router } from "express";
import { isAuth } from "../middlewares";
import { joinGame } from "../controller";

const matchmakingRouter: Router = express.Router();

matchmakingRouter.post("/join", isAuth, joinGame);
export { matchmakingRouter };
