import { Router } from "express";
import { gameRouter } from "./game";
import { matchmakingRouter } from "./matchmaking";
import { userRouter } from "./user";

const router = Router();

router.use("/game", gameRouter);
router.use("/matchmaking", matchmakingRouter);
router.use("/user", userRouter);

export default router;
