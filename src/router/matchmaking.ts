import express, { Router } from "express";
import { isAuth } from "../middlewares";
import { matchmakingController } from "../controller";

const matchmakingRouter: Router = express.Router();

matchmakingRouter.post("/join", isAuth, matchmakingController.joinGame);
export { matchmakingRouter };
